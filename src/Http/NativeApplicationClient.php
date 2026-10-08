<?php

namespace FourmixIntelligence\Laravel\Http;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\Tools\BridgeConnections;
use GuzzleHttp\Psr7\Utils;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Str;

/** Uses a paired user's scoped platform runtime; credentials remain on the server. */
final class NativeApplicationClient
{
    public function __construct(private Factory $http) {}

    /** @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function call(string $action, array $payload, ?string $connectionId = null, ?int $expectedRevision = null): array
    {
        $response = $this->send($action, $payload, $connectionId, $expectedRevision);
        if (! $response->successful() || ! is_array($response->json())) {
            $this->fail($response, $action);
        }

        return $response->json();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  callable(array<string, mixed>): void  $onEvent
     * @return array<string, mixed>
     */
    public function stream(array $payload, ?string $connectionId, ?int $expectedRevision, callable $onEvent): array
    {
        $response = $this->send('agent_chat', [...$payload, 'stream' => true], $connectionId, $expectedRevision, true);
        if (! $response->successful() || ! str_contains((string) $response->header('Content-Type'), 'application/x-ndjson')) {
            throw new ApiException('AIの応答を開始できませんでした。接続と会話履歴を確認してください。', $response->status());
        }
        $body = $response->toPsrResponse()->getBody();
        try {
            while (! $body->eof()) {
                /** A fixed-size read may wait for later HTTP chunks; deliver each complete event immediately. */
                $line = Utils::readLine($body, 2 * 1024 * 1024 + 2);
                abort_if(strlen($line) > 2 * 1024 * 1024, 502, 'AIの応答が大きすぎます。会話履歴を確認してください。');
                abort_unless(str_ends_with($line, "\n"), 502, '通信が途中で終了しました。会話履歴と操作結果を確認してください。');
                $line = trim($line);
                if ($line === '') {
                    continue;
                }
                $event = json_decode($line, true, 64, JSON_THROW_ON_ERROR);
                abort_unless(is_array($event) && is_string($event['type'] ?? null) && is_array($event['data'] ?? null), 502);
                $onEvent($event);
                if ($event['type'] === 'run.failed') {
                    throw new ApiException('AIの処理を完了できませんでした。会話履歴と操作結果を確認してください。', 502);
                }
                if ($event['type'] === 'run.completed') {
                    return $event['data'];
                }
            }
            abort(502, '通信が途中で終了しました。会話履歴と操作結果を確認してください。');
        } finally {
            $body->close();
        }
    }

    /** @param array<string, mixed> $payload */
    private function send(string $action, array $payload, ?string $connectionId, ?int $expectedRevision, bool $stream = false): Response
    {
        abort_unless(in_array($action, ['chat', 'history', 'status', 'agents', 'agent_chat', 'agent_history', 'agent_run_cancel', 'agent_run_status',
            'agent_attachments', 'agent_attachment_upload', 'agent_attachment_content', 'agent_attachment_delete', 'agent_artifact_content'], true), 422);
        $configured = app(BridgeConnections::class)->get($connectionId);
        abort_if($expectedRevision !== null && $configured['revision'] !== $expectedRevision, 409, '接続が更新されました。もう一度接続とAIを設定してください。');
        $connection = $configured['id'];
        $workspace = $configured['workspace_id'];
        $secret = $configured['secret'];
        $platform = app(BridgeConnections::class)->platform($connection);
        $tenant = $platform['tenant'];
        $baseUrl = PlatformEndpoint::trusted($platform['url']);
        $parts = parse_url($baseUrl);
        $local = app()->environment(['local', 'testing']) && in_array(strtolower((string) ($parts['host'] ?? '')), ['localhost', '127.0.0.1', 'host.docker.internal'], true);
        abort_unless(is_array($parts) && isset($parts['host'], $parts['scheme']) && array_intersect(array_keys($parts), ['user', 'pass', 'query', 'fragment']) === []
            && ($parts['scheme'] === 'https' || ($local && $parts['scheme'] === 'http')), 503, '接続先URLを確認してください。');
        abort_unless($tenant !== '' && $connection !== '' && strlen($secret) >= 32, 503, 'Fourmix Intelligence 接続を設定してください。');
        $path = '/api/v3/native/laravel/'.rawurlencode($tenant).'/'.rawurlencode($connection).'/'.$action;
        $raw = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $timestamp = (string) time();
        $nonce = (string) Str::uuid();
        $canonical = implode("\n", [$timestamp, $nonce, 'POST', $path, $workspace, $connection, hash('sha256', $raw)]);

        return $this->http->baseUrl($baseUrl)->accept($stream ? 'application/x-ndjson' : 'application/json')->withoutRedirecting()->withOptions(['stream' => $stream])
            ->timeout((int) config('fourmix-intelligence.native.timeout', 250))->connectTimeout(5)
            ->withHeaders(['X-Fourmix-Timestamp' => $timestamp, 'X-Fourmix-Nonce' => $nonce, 'X-Fourmix-Workspace' => $workspace,
                'X-Fourmix-Connection' => $connection, 'X-Fourmix-Signature' => 'v1='.hash_hmac('sha256', $canonical, $secret)])
            ->withBody($raw, 'application/json')->post($path);
    }

    private function fail(Response $response, string $action): never
    {
        if ($action === 'agent_artifact_content') {
            abort(in_array($response->status(), [401, 403, 404, 409, 410, 429, 503], true) ? $response->status() : 502, match ($response->status()) {
                401 => '再ログインして生成ファイルを取得してください。',
                403 => 'この生成ファイルを取得する権限がありません。',
                404 => 'この会話の生成ファイルを確認できません。',
                409 => '現在の接続とAI設定を確認してください。',
                410 => '生成ファイルの利用期限が切れています。',
                default => '生成ファイルを取得できませんでした。再試行してください。',
            });
        }
        if (str_starts_with($action, 'agent_attachment') && in_array($response->status(), [403, 404, 409, 410, 413, 415, 422, 429], true)) {
            if ($action === 'agent_attachment_upload' && $response->status() === 409 && $response->json('state') === 'unknown'
                && Str::isUuid((string) $response->json('conversation_id'))) {
                throw new HttpResponseException(response()->json(['message' => '保存結果を確認できません。添付一覧を確認し、同じファイルを自動で再送しないでください。',
                    'conversation_id' => $response->json('conversation_id'), 'state' => 'unknown'], 409)->header('Cache-Control', 'private, no-store'));
            }
            abort($response->status(), match ($response->status()) {
                403 => 'このAI・会話の添付を利用する権限がありません。',
                404 => 'この会話で利用できる添付が見つかりません。',
                409 => '添付は処理中または会話で使用済みのため、変更できません。',
                410 => '添付の保存期限が過ぎています。再度添付してください。',
                413 => '添付のサイズまたは件数が上限を超えています。',
                415 => 'このファイル形式は添付できません。',
                429 => '添付の処理が混み合っています。少し待ってから再試行してください。',
                default => 'ファイルを読み取れません。形式・破損・暗号化の有無を確認してください。',
            });
        }
        throw new ApiException('AIの処理を完了できませんでした。接続と会話履歴を確認してください。', $response->status());
    }
}
