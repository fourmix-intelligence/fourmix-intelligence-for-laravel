<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\AgentSelection;
use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\FourmixIntelligenceManager;
use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolExecutor;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use FourmixIntelligence\Laravel\Tools\UiPreferences;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class ManagementController
{
    public function __construct(private IntegrationAccess $access, private ConnectionManager $connections) {}

    public function index(Request $request): View|Response
    {
        $this->access->context($request);
        if ($request->header('X-Inertia') === 'true') {
            return response('', 409)->header('X-Inertia-Location', $request->fullUrl())->header('Cache-Control', 'no-store');
        }

        /** @var view-string $view */
        $view = 'fourmix-intelligence::manage';

        return view($view);
    }

    public function state(Request $request, ToolRegistry $tools, ToolConsent $consent): JsonResponse
    {
        $context = $this->access->context($request);

        return response()->json(['timezone' => (string) config('app.timezone', 'UTC'), 'domain_labels' => (array) config('fourmix-intelligence.ui.domain_labels', []), 'connections' => $this->connections->connections($context),
            'ui_preferences' => app(UiPreferences::class)->for($context),
            'rendering' => ['attachmentUrlPrefixes' => [route('fourmix-intelligence.attachments.index').'/'],
                'allowedImageOrigins' => array_values(array_filter((array) config('fourmix-intelligence.ui.allowed_image_origins', []), 'is_string'))],
            'agents' => app(AgentSelection::class)->selections($context),
            'tools' => $tools->manifest(array_values(array_filter((array) config('fourmix-intelligence.bridge.enabled_operations', ['*']), 'is_string'))),
            'surfaces' => app(UiSurfaces::class)->for($context, app(AgentSelection::class)->selections($context)),
            'actions' => DB::table('fourmix_intelligence_tool_actions')->where('subject', $context->subject)
                ->latest('created_at')->limit(30)->get(['id', 'operation', 'state', 'created_at'])->map(function (object $row): array {
                    $item = (array) $row;
                    $item['created_at'] = Carbon::parse($row->created_at, (string) config('app.timezone', 'UTC'))->toIso8601String();

                    return $item;
                })])->header('Cache-Control', 'no-store');
    }

    public function agents(Request $request, AgentSelection $agents): JsonResponse
    {
        $input = $request->validate(['connection_id' => ['required', 'uuid']]);

        return response()->json(['agents' => $agents->available($this->access->context($request), $input['connection_id'])])->header('Cache-Control', 'no-store');
    }

    public function selectAgent(Request $request, string $alias, AgentSelection $agents): JsonResponse
    {
        $input = $request->validate(['connection_id' => ['required', 'uuid'], 'grant_id' => ['required', 'uuid'], 'allowed_operations' => ['prohibited']]);
        $agents->select($this->access->context($request), $alias, $input['connection_id'], $input['grant_id']);

        return response()->json(['saved' => true]);
    }

    public function removeAgent(Request $request, string $alias, AgentSelection $agents): JsonResponse
    {
        $agents->remove($this->access->context($request), $alias);

        return response()->json(['removed' => true]);
    }

    public function chat(Request $request, FourmixIntelligenceManager $manager): JsonResponse|StreamedResponse
    {
        $context = $this->access->context($request);
        $input = $request->validate(['surface' => ['required', 'string', 'regex:/^[a-z][a-z0-9-]{0,63}$/D'], 'alias' => ['sometimes', 'string', 'max:128'], 'message' => ['required', 'string', 'max:10000'],
            'conversation_id' => ['sometimes', 'nullable', 'uuid'], 'context' => ['sometimes', 'array'],
            'attachment_ids' => ['sometimes', 'array', 'max:'.(int) config('fourmix-intelligence.attachments.max_files', 5)], 'attachment_ids.*' => ['required', 'uuid', 'distinct']]);
        abort_if(strlen(json_encode($input['context'] ?? [], JSON_THROW_ON_ERROR)) > 16000, 422, '補足情報が大きすぎます。');
        $agent = $manager->agent($this->surfaceAlias($request, $context, $input['surface']))->forUser($context)
            ->expectSelection($this->expectation($request))->context($input['context'] ?? []);
        if (! empty($input['conversation_id'])) {
            $agent = $agent->conversation($input['conversation_id']);
        }
        if (! empty($input['attachment_ids'])) {
            abort_unless(! empty($input['conversation_id']), 422, '添付を保存した会話を指定してください。');
            $agent = $agent->attachments($input['attachment_ids']);
        }

        if (str_contains((string) $request->header('Accept'), 'application/x-ndjson')) {
            return response()->stream(function () use ($agent, $input): void {
                $write = static function (array $event): void {
                    echo json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)."\n";
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                };
                $write(['type' => 'run.status', 'data' => ['phase' => 'connecting', 'message' => 'AIに接続しています']]);
                try {
                    $agent->stream($input['message'], $write);
                } catch (\Throwable $error) {
                    report($error);
                    $status = $error instanceof ApiException ? $error->status : ($error instanceof HttpExceptionInterface ? $error->getStatusCode() : 502);
                    $write(['type' => 'run.failed', 'data' => ['message' => '応答を完了できませんでした。会話履歴と操作結果を確認してください。',
                        'status_code' => in_array($status, [401, 403, 409, 422, 429], true) ? $status : 502]]);
                }
            }, 200, ['Content-Type' => 'application/x-ndjson', 'Cache-Control' => 'private, no-store, no-transform', 'X-Accel-Buffering' => 'no']);
        }

        return response()->json($agent->ask($input['message'])->raw)->header('Cache-Control', 'no-store');
    }

    public function history(Request $request, FourmixIntelligenceManager $manager): JsonResponse
    {
        $input = $request->validate(['surface' => ['required', 'string', 'regex:/^[a-z][a-z0-9-]{0,63}$/D'], 'alias' => ['sometimes', 'string', 'max:128'], 'conversation_id' => ['sometimes', 'nullable', 'uuid'], 'before_id' => ['sometimes', 'nullable', 'integer', 'min:1']]);
        $agent = $manager->agent($this->surfaceAlias($request, $this->access->context($request), $input['surface']))->forUser($this->access->context($request))
            ->expectSelection($this->expectation($request));
        $result = empty($input['conversation_id']) ? $agent->conversations() : $agent->conversation($input['conversation_id'])->history($input['before_id'] ?? null);

        return response()->json($result)->header('Cache-Control', 'no-store');
    }

    public function action(Request $request, string $id, ToolExecutor $executor): JsonResponse
    {
        $action = $executor->action($this->access->context($request), $id);
        if (isset($action['expires_at'])) {
            $action['expires_at'] = Carbon::parse($action['expires_at'], (string) config('app.timezone', 'UTC'))->toIso8601String();
        }

        return response()->json($action)->header('Cache-Control', 'no-store');
    }

    public function confirm(Request $request, string $id, ToolExecutor $executor): JsonResponse
    {
        $request->validate(['acknowledge' => ['accepted']], ['acknowledge.accepted' => '実行する内容を確認してください。']);

        return response()->json($executor->confirm($this->access->context($request), $id))->header('Cache-Control', 'no-store');
    }

    public function reject(Request $request, string $id, ToolExecutor $executor): JsonResponse
    {
        return response()->json($executor->reject($this->access->context($request), $id))->header('Cache-Control', 'no-store');
    }

    public function revoke(Request $request, string $id): JsonResponse
    {
        $this->connections->revoke($this->access->context($request), $id);

        return response()->json(['deleted' => true]);
    }

    public function issueKey(Request $request): JsonResponse
    {
        $context = $this->access->context($request);
        $input = $request->validate(['name' => ['required', 'string', 'max:100'], 'modes' => ['present', 'array', 'max:500'], 'modes.*' => ['required', Rule::in(['disabled', 'review', 'automatic'])], 'acknowledge_automatic' => ['sometimes', 'boolean'], 'host_mode' => ['sometimes', Rule::in(array_values(array_intersect((array) config('fourmix-intelligence.ui.host_modes', ['user']), ['user', 'system'])))]],
            ['name.required' => '接続名を入力してください。', 'name.string' => '接続名は文字列で入力してください。', 'name.max' => '接続名は100文字以内で入力してください。']);
        if (in_array('automatic', $input['modes'], true)) {
            $request->validate(['acknowledge_automatic' => ['accepted']], ['acknowledge_automatic.accepted' => '継続許可する操作を確認してください。']);
        }
        $mode = $input['host_mode'] ?? 'user';
        if ($mode === 'system') {
            $this->access->authorizeSystemConnection($request);
        }

        return response()->json($this->connections->issue($context, $input['name'], $input['modes'], $mode) + ['application_url' => url('/')], 201)->header('Cache-Control', 'no-store');
    }

    public function rename(Request $request, string $id): JsonResponse
    {
        $context = $this->access->context($request);
        $input = $request->validate(['name' => ['required', 'string', 'max:100']],
            ['name.required' => '接続名を入力してください。', 'name.string' => '接続名は文字列で入力してください。', 'name.max' => '接続名は100文字以内で入力してください。']);
        $this->connections->rename($context, $id, $input['name']);

        return response()->json(['updated' => true]);
    }

    private function surfaceAlias(Request $request, ToolContext $context, string $name): string
    {
        $alias = app(UiSurfaces::class)->resolve($context, $name);
        abort_if($request->has('alias') && $request->input('alias') !== $alias, 422, 'このチャット画面に設定されたAIを使用してください。');

        return $alias;
    }

    /** @return array{connection_id:string, grant_id:string, connection_revision:int}|null */
    private function expectation(Request $request): ?array
    {
        $input = $request->validate(['expected_selection' => ['sometimes', 'required', 'array:connection_id,grant_id,connection_revision'],
            'expected_selection.connection_id' => ['required_with:expected_selection', 'uuid'],
            'expected_selection.grant_id' => ['required_with:expected_selection', 'uuid'],
            'expected_selection.connection_revision' => ['required_with:expected_selection', 'integer', 'min:1']]);

        return isset($input['expected_selection']) ? [
            'connection_id' => (string) $input['expected_selection']['connection_id'],
            'grant_id' => (string) $input['expected_selection']['grant_id'],
            'connection_revision' => (int) $input['expected_selection']['connection_revision'],
        ] : null;
    }

    public function preferences(Request $request, UiPreferences $preferences): JsonResponse
    {
        $input = $request->validate(['chat_entry' => ['required', Rule::in(['header', 'floating', 'both', 'hidden'])]]);
        $preferences->save($this->access->context($request), $input['chat_entry']);

        return response()->json(['saved' => true, 'ui_preferences' => ['chat_entry' => $input['chat_entry']]])->header('Cache-Control', 'no-store');
    }

    public function permissions(Request $request, string $id): JsonResponse
    {
        $context = $this->access->context($request);
        $input = $request->validate(['modes' => ['present', 'array', 'max:500'], 'modes.*' => ['required', Rule::in(['disabled', 'review', 'automatic'])],
            'acknowledge_automatic' => ['sometimes', 'boolean']]);
        if (in_array('automatic', $input['modes'], true)) {
            $request->validate(['acknowledge_automatic' => ['accepted']], ['acknowledge_automatic.accepted' => '継続許可する操作を確認してください。']);
        }
        $result = $this->connections->renew($context, $id, $input['modes']);

        return response()->json($result + ['application_url' => url('/')])->header('Cache-Control', 'no-store');
    }
}
