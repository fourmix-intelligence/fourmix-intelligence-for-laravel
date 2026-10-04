<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\Tools\BridgeConnections;
use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolExecutor;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use FourmixIntelligence\Laravel\Tools\UserBindings;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class NativeBridgeController extends Controller
{
    public function binding(Request $request, string $action, UserBindings $bindings): JsonResponse
    {
        $this->authorizeRequest($request);
        if (in_array($action, ['context', 'revoke'], true)) {
            $input = $request->validate(['binding_id' => ['required', 'uuid'], 'remote_user' => ['required', 'uuid'],
                'audience' => ['sometimes', 'required', Rule::in(['internal', 'customer'])]]);
            $result = $bindings->context($input['binding_id'], $input['remote_user'], (string) $request->header('X-Fourmix-Connection'));
            $context = app(ToolPolicy::class)->resolve(['workspace_id' => (string) $request->header('X-Fourmix-Workspace'), 'connection_id' => (string) $request->header('X-Fourmix-Connection'), 'remote_user' => $input['remote_user']]);
            abort_unless($context->subject === $result['subject'], 403);
            $context = new ToolContext($context->subject, $context->channel, [...$context->identity,
                'connection_id' => (string) $request->header('X-Fourmix-Connection'),
                'connection_revision' => (string) $request->attributes->get('fourmix_connection_revision')]);
            if ($action === 'revoke') {
                $bindings->revoke($context, (string) $request->header('X-Fourmix-Connection'));

                return response()->json(['revoked' => true])->header('Cache-Control', 'no-store');
            }
            $result['permissions'] = [];
            $modes = app(ToolConsent::class)->modes($context);
            foreach (app(ToolRegistry::class)->manifest($this->enabledOperations()) as $tool) {
                $mode = $modes[$tool['name']] ?? 'disabled';
                if ($mode !== 'disabled'
                    && in_array($input['audience'] ?? 'internal', $tool['audiences'] ?? ['internal'], true)) {
                    $result['permissions'][$tool['name']] = $mode;
                }
            }

            return response()->json($result)->header('Cache-Control', 'no-store');
        }
        $input = $request->validate(['code' => ['required', 'string', 'size:48'], 'remote_user' => [$action === 'claim' ? 'required' : 'nullable', 'uuid']]);

        $connection = (string) $request->header('X-Fourmix-Connection');

        return response()->json($action === 'claim' ? $bindings->claim($input['code'], $input['remote_user'], $connection) : $bindings->preview($input['code'], $connection))->header('Cache-Control', 'no-store');
    }

    public function manifest(Request $request, ToolRegistry $tools): JsonResponse
    {
        $this->authorizeRequest($request);
        $configured = app(BridgeConnections::class)->get((string) $request->header('X-Fourmix-Connection'));
        $modes = app(ToolConsent::class)->modes(new ToolContext($configured['subject'], identity: [
            'connection_id' => $configured['id'], 'connection_revision' => (string) $request->attributes->get('fourmix_connection_revision')]));

        return response()->json([
            'protocol' => 'fourmix-laravel/1.0',
            'revision' => max(1, $configured['revision'], (int) config('fourmix-intelligence.bridge.revision', 1)),
            'application' => ['id' => $this->applicationId(), 'version' => app()->version()],
            'capabilities' => $tools->manifest(array_keys(array_filter($modes, fn (string $mode): bool => $mode !== 'disabled'))),
            'features' => ['user_bound_execution', 'application_reviews', 'durable_idempotency', 'native_chat'],
        ]);
    }

    public function receipt(Request $request, string $requestId, ToolExecutor $executor, ToolPolicy $policy): JsonResponse
    {
        $this->authorizeRequest($request);
        $context = $this->trustedContext($request, $policy);

        return response()->json($executor->receipt($context, $requestId))->header('Cache-Control', 'no-store');
    }

    public function execute(Request $request, string $operation, ToolExecutor $executor, ToolPolicy $policy): JsonResponse
    {
        $this->authorizeRequest($request);
        // 連携要求は Fourmix Intelligence 側から届くため、接続元IPで数えると
        // 複数組織が同じ上限を共有する。署名で検証済みの接続単位で制限する。
        $limit = 'fourmix-native:'.hash('sha256', implode("\n", [
            (string) $request->header('X-Fourmix-Workspace', ''),
            (string) $request->header('X-Fourmix-Connection', ''),
        ]));
        abort_if(RateLimiter::tooManyAttempts($limit, 120), 429, '処理が混み合っています。');
        RateLimiter::hit($limit, 60);
        $arguments = $request->input('arguments', []);
        abort_unless(is_array($arguments), 422, 'arguments の形式を確認してください。');

        $context = $this->trustedContext($request, $policy);
        try {
            $result = $executor->execute($context, $operation, $arguments, $request->input('request_id'));
        } catch (\Throwable $exception) {
            if ($exception instanceof ValidationException || $exception instanceof HttpExceptionInterface || $exception instanceof AuthorizationException) {
                throw $exception;
            }
            $row = DB::table('fourmix_intelligence_tool_actions')->where('subject', $context->subject)
                ->where('request_id', $request->input('request_id'))->where('operation', $operation)->where('state', 'unknown_effect')->first();
            if ($row === null) {
                throw $exception;
            }
            $result = ['id' => $row->id, 'state' => 'unknown_effect', 'operation' => $operation, 'url' => $policy->reviewUrl($row->id),
                'message' => '実行結果を確認できません。同じ受付番号では再実行しません。業務画面と操作履歴を確認してください。'];
        }

        return response()->json($result)->header('Cache-Control', 'no-store');
    }

    private function trustedContext(Request $request, ToolPolicy $policy): ToolContext
    {
        $identity = $request->input('identity', []);
        abort_unless(is_array($identity), 422, 'identity の形式を確認してください。');
        $rules = [
            'identity.audience' => ['sometimes', 'required', Rule::in(['internal', 'customer'])],
            'identity.grant_id' => ['sometimes', 'required', 'uuid'],
            'identity.binding_id' => ['sometimes', 'required', 'uuid'],
            'identity.conversation_id' => ['sometimes', 'required', 'uuid'],
        ];
        $validated = $request->validate($rules);
        $metadata = (array) ($validated['identity'] ?? []);
        $metadata['audience'] ??= 'internal';
        $signed = ['workspace_id' => (string) $request->header('X-Fourmix-Workspace'),
            'connection_id' => (string) $request->header('X-Fourmix-Connection'),
            'connection_revision' => (string) $request->attributes->get('fourmix_connection_revision')];
        $context = $policy->resolve([...$identity, ...$signed, ...$metadata]);

        return new ToolContext($context->subject, $context->channel, [...$context->identity, ...$signed, ...$metadata]);
    }

    private function authorizeRequest(Request $request): void
    {
        abort_unless($request->query->count() === 0, 422, '連携の入力は署名対象のリクエスト本文で送信してください。');
        abort_if(strlen($request->getContent()) > 256000, 413, '入力内容が大きすぎます。');
        $timestamp = (string) $request->header('X-Fourmix-Timestamp', '');
        $nonce = (string) $request->header('X-Fourmix-Nonce', '');
        $workspace = (string) $request->header('X-Fourmix-Workspace', '');
        $connection = (string) $request->header('X-Fourmix-Connection', '');
        $provided = (string) $request->header('X-Fourmix-Signature', '');
        abort_unless(ctype_digit($timestamp) && abs(time() - (int) $timestamp) <= 300, 403, '署名の有効期限が切れています。');
        abort_unless($nonce !== '' && strlen($nonce) <= 100 && $connection !== '', 403, '署名情報が不足しています。');
        $configured = app(BridgeConnections::class)->get($connection);
        $secret = $configured['secret'];
        $canonical = implode("\n", [
            $timestamp, $nonce, strtoupper($request->method()), '/'.$request->path(),
            $workspace, $connection, hash('sha256', $request->getContent()),
        ]);
        abort_unless(hash_equals('v1='.hash_hmac('sha256', $canonical, $secret), $provided), 403, '署名を確認できませんでした。');
        $request->attributes->set('fourmix_connection_revision', $configured['revision']);
        // 接続先は管理者の設定を正本とし、キャッシュ消去や最初の要求で変更しない。
        abort_unless(hash_equals($configured['workspace_id'], $workspace), 409, '別の Fourmix Intelligence 接続は利用できません。');
        abort_unless(Cache::add('fourmix-native-nonce:'.hash('sha256', $connection.'|'.$nonce), true, 600), 403, '同じ要求は再実行できません。');
    }

    /** @return list<string> */
    private function enabledOperations(): array
    {
        $configured = config('fourmix-intelligence.bridge.enabled_operations', ['*']);

        return is_array($configured) ? array_values(array_filter($configured, 'is_string')) : [];
    }

    private function applicationId(): string
    {
        $configured = trim((string) config('fourmix-intelligence.bridge.application_id'));
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $configured)) {
            return strtolower($configured);
        }
        $hex = hash('sha256', (string) config('app.key').'|'.(string) config('app.url'));

        return substr($hex, 0, 8).'-'.substr($hex, 8, 4).'-5'.substr($hex, 13, 3).'-a'.substr($hex, 17, 3).'-'.substr($hex, 20, 12);
    }
}
