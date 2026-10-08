<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\AgentSelection;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/** 現在の本人・接続・会話の権限で生成ファイルを取得します。 */
final class ArtifactController
{
    public function __construct(private IntegrationAccess $access, private AgentSelection $agents) {}

    public function show(Request $request, string $conversation, string $artifact): Response
    {
        $input = $request->validate(['surface' => ['required', 'string', 'regex:/^[a-z][a-z0-9-]{0,63}$/D'], 'alias' => ['sometimes', 'string', 'max:128'],
            'expected_selection' => ['sometimes', 'required', 'array:connection_id,grant_id,connection_revision'],
            'expected_selection.connection_id' => ['required_with:expected_selection', 'uuid'],
            'expected_selection.grant_id' => ['required_with:expected_selection', 'uuid'],
            'expected_selection.connection_revision' => ['required_with:expected_selection', 'integer', 'min:1']]);
        abort_unless(Str::isUuid($conversation) && Str::isUuid($artifact), 404);
        $context = $this->access->context($request);
        $alias = app(UiSurfaces::class)->resolve($context, $input['surface']);
        abort_if(isset($input['alias']) && $input['alias'] !== $alias, 422, 'このチャット画面に設定されたAIを使用してください。');
        $result = $this->agents->call($context, $alias, 'agent_artifact_content', ['conversation_id' => $conversation, 'artifact_id' => $artifact]
            + (isset($input['expected_selection']) ? ['expected_selection' => $input['expected_selection']] : []));
        $row = $result['artifact'] ?? [];
        $name = $row['name'] ?? null;
        $mime = $row['mime'] ?? null;
        $encoded = $result['content_base64'] ?? null;
        abort_unless(($row['id'] ?? null) === $artifact && is_string($name) && $name !== '' && strlen($name) <= 720
            && preg_match('/[\x00-\x1f\x7f\/\\\\]/u', $name) === 0 && is_string($mime) && preg_match('/^[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+$/D', $mime)
            && is_int($row['size'] ?? null) && $row['size'] > 0 && $row['size'] <= 20 * 1024 * 1024
            && is_string($encoded) && strlen($encoded) <= (int) ceil(20 * 1024 * 1024 / 3) * 4, 502, '生成ファイルの内容を確認できませんでした。');
        $body = base64_decode($encoded, true);
        abort_unless(is_string($body) && strlen($body) === $row['size'], 502, '生成ファイルの内容を確認できませんでした。');

        return response($body)->header('Content-Type', $mime)->header('Content-Disposition', "attachment; filename*=UTF-8''".rawurlencode($name))
            ->header('Cache-Control', 'private, no-store')->header('X-Content-Type-Options', 'nosniff')->header('Content-Security-Policy', "sandbox; default-src 'none'");
    }
}
