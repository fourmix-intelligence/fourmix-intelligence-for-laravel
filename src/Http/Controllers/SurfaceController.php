<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\AgentSelection;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class SurfaceController
{
    public function __construct(private IntegrationAccess $access, private UiSurfaces $surfaces, private AgentSelection $agents) {}

    public function page(Request $request): View|Response
    {
        $context = $this->access->context($request);
        $input = $request->validate(['surface' => ['sometimes', 'string', 'regex:/^[a-z][a-z0-9-]{0,63}$/D'], 'initial_prompt' => ['sometimes', 'nullable', 'string', 'max:10000']]);
        $name = $input['surface'] ?? 'page';
        abort_unless($this->surfaces->definition($name)['type'] === 'page' && $this->surfaces->enabled($context, $name), 404, 'このチャット画面は利用できません。');
        if ($request->header('X-Inertia') === 'true') {
            return response('', 409)->header('X-Inertia-Location', $request->fullUrl())->header('Cache-Control', 'no-store');
        }

        /** @var view-string $view */
        $view = 'fourmix-intelligence::chat-page';

        return view($view, ['surface' => $name, 'initialPrompt' => $input['initial_prompt'] ?? '']);
    }

    public function update(Request $request, string $name): JsonResponse
    {
        $context = $this->access->context($request);
        $definition = $this->surfaces->definition($name);
        $input = $request->validate(['enabled' => ['required', 'boolean'], 'connection_id' => ['required_with:grant_id', 'uuid'],
            'grant_id' => ['required_with:connection_id', 'uuid']], ['enabled.required' => 'このチャット画面を表示するか選択してください。']);
        abort_if($input['enabled'] && ! $definition['enabled'], 403, 'このチャット画面はアプリケーションの設定で無効になっています。');
        if (isset($input['connection_id'], $input['grant_id'])) {
            $grants = $this->agents->available($context, $input['connection_id']);
            $grant = collect($grants)->firstWhere('grant_id', $input['grant_id']);
            abort_unless($grant !== null && ($grant['audience'] ?? 'internal') === 'internal', 422, '標準チャットでは社内向けAIを設定してください。対外向けAIには開発者APIで顧客の識別が必要です。');
            $this->agents->select($context, $definition['alias'], $input['connection_id'], $input['grant_id'], requiredAudience: 'internal');
        }
        $this->surfaces->save($context, $name, (bool) $input['enabled']);

        return response()->json(['saved' => true, 'surfaces' => $this->surfaces->for($context, $this->agents->selections($context))])->header('Cache-Control', 'no-store');
    }
}
