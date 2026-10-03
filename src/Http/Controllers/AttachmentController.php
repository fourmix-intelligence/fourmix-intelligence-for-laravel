<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\AgentSelection;
use FourmixIntelligence\Laravel\Attachments\AttachmentPolicy;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/** FI の非公開会話添付を仲介します。ブラウザーに接続トークンは渡しません。 */
final class AttachmentController
{
    public function __construct(private IntegrationAccess $access, private AgentSelection $agents, private AttachmentPolicy $policy) {}

    public function index(Request $request): JsonResponse
    {
        $input = $request->validate($this->rules());
        $result = $this->agents->call($this->access->context($request), $this->alias($request, $input['surface']), 'agent_attachments', ['conversation_id' => $input['conversation_id'] ?? null] + $this->expectation($input));
        abort_unless(is_array($result['policy'] ?? null) && is_array($result['data'] ?? null), 502, '添付の利用条件を確認できませんでした。');

        return response()->json(['conversation_id' => $result['conversation_id'] ?? null, 'data' => array_map($this->metadata(...), $result['data']),
            'policy' => $this->policy->intersect($result['policy'])])->header('Cache-Control', 'private, no-store');
    }

    public function store(Request $request): JsonResponse
    {
        $input = $request->validate($this->rules() + ['file' => ['required', 'file'], 'request_id' => ['required', 'uuid']]);
        $context = $this->access->context($request);
        /** @var UploadedFile $file */
        $file = $request->file('file');
        $encoded = $this->policy->encode($file);
        $result = $this->agents->call($context, $this->alias($request, $input['surface']), 'agent_attachment_upload', ['conversation_id' => $input['conversation_id'] ?? null,
            'request_id' => $input['request_id'], 'file' => $encoded] + $this->expectation($input));
        abort_unless(Str::isUuid((string) ($result['conversation_id'] ?? '')) && is_array($result['attachment'] ?? null), 502, '添付の保存結果を確認できませんでした。');

        return response()->json(['conversation_id' => $result['conversation_id'], 'attachment' => $this->metadata($result['attachment'])], 201)->header('Cache-Control', 'private, no-store');
    }

    public function show(Request $request, string $conversation, string $attachment): Response
    {
        $input = $request->validate($this->rules());
        abort_unless(Str::isUuid($conversation) && Str::isUuid($attachment), 404);
        $result = $this->agents->call($this->access->context($request), $this->alias($request, $input['surface']), 'agent_attachment_content', ['conversation_id' => $conversation, 'attachment_id' => $attachment] + $this->expectation($input));
        abort_unless(is_array($result['attachment'] ?? null) && is_string($result['content_base64'] ?? null), 502, '添付の内容を確認できませんでした。');
        $metadata = $this->metadata($result['attachment']);
        abort_unless($metadata['id'] === $attachment && strlen($result['content_base64']) <= (int) ceil(20 * 1024 * 1024 / 3) * 4, 502, '添付の内容を確認できませんでした。');
        $body = base64_decode($result['content_base64'], true);
        abort_unless(is_string($body) && strlen($body) === $metadata['size'], 502, '添付の内容を確認できませんでした。');
        $inline = in_array($metadata['mime'], ['image/png', 'image/jpeg', 'image/webp'], true);

        return response($body)->header('Content-Type', $metadata['mime'])->header('Content-Disposition', ($inline ? 'inline' : 'attachment')."; filename*=UTF-8''".rawurlencode($metadata['name']))
            ->header('Cache-Control', 'private, no-store')->header('X-Content-Type-Options', 'nosniff')->header('Content-Security-Policy', "sandbox; default-src 'none'");
    }

    public function destroy(Request $request, string $conversation, string $attachment): JsonResponse
    {
        $input = $request->validate($this->rules());
        abort_unless(Str::isUuid($conversation) && Str::isUuid($attachment), 404);
        $result = $this->agents->call($this->access->context($request), $this->alias($request, $input['surface']), 'agent_attachment_delete', ['conversation_id' => $conversation, 'attachment_id' => $attachment] + $this->expectation($input));
        abort_unless(($result['deleted'] ?? false) === true, 502, '添付の削除結果を確認できませんでした。');

        return response()->json(['deleted' => true])->header('Cache-Control', 'private, no-store');
    }

    private function alias(Request $request, string $surface): string
    {
        $alias = app(UiSurfaces::class)->resolve($this->access->context($request), $surface);
        abort_if($request->has('alias') && $request->input('alias') !== $alias, 422, 'このチャット画面に設定されたAIを使用してください。');

        return $alias;
    }

    /** @return array<string, list<string>> */
    private function rules(): array
    {
        return ['surface' => ['required', 'string', 'regex:/^[a-z][a-z0-9-]{0,63}$/D'], 'alias' => ['sometimes', 'string', 'max:128'], 'conversation_id' => ['sometimes', 'nullable', 'uuid'],
            'expected_selection' => ['sometimes', 'required', 'array:connection_id,grant_id,connection_revision'],
            'expected_selection.connection_id' => ['required_with:expected_selection', 'uuid'],
            'expected_selection.grant_id' => ['required_with:expected_selection', 'uuid'],
            'expected_selection.connection_revision' => ['required_with:expected_selection', 'integer', 'min:1']];
    }

    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    private function expectation(array $input): array
    {
        return isset($input['expected_selection']) ? ['expected_selection' => [...$input['expected_selection'],
            'connection_revision' => (int) $input['expected_selection']['connection_revision']]] : [];
    }

    /** @param array<string, mixed> $row
     * @return array{id: string, name: string, mime: string, size: int, expires_at: int}
     */
    private function metadata(array $row): array
    {
        $name = $row['name'] ?? null;
        $mime = is_string($name) ? $this->policy->mime(pathinfo($name, PATHINFO_EXTENSION)) : null;
        abort_unless(Str::isUuid((string) ($row['id'] ?? '')) && is_string($name) && $name !== '' && strlen($name) <= 720
            && preg_match('/[\x00-\x1f\x7f\/\\\\]/u', $name) === 0 && $mime !== null && $mime === ($row['mime'] ?? null)
            && is_int($row['size'] ?? null) && $row['size'] > 0 && $row['size'] <= 20 * 1024 * 1024 && is_int($row['expires_at'] ?? null), 502, '添付の情報を確認できませんでした。');

        return ['id' => $row['id'], 'name' => $name, 'mime' => $mime, 'size' => $row['size'], 'expires_at' => $row['expires_at']];
    }
}
