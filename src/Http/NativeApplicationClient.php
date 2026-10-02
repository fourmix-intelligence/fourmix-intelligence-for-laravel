<?php

namespace FourmixIntelligence\Laravel\Http;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Str;

/** Uses a paired user's scoped platform runtime; credentials remain on the server. */
final class NativeApplicationClient
{
    public function __construct(private Factory $http) {}

    /** @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function call(string $action, array $payload): array
    {
        abort_unless(in_array($action, ['chat', 'history', 'status'], true), 422);
        $tenant = (string) config('fourmix-intelligence.native.tenant');
        $connection = (string) config('fourmix-intelligence.bridge.connection_id');
        $workspace = (string) config('fourmix-intelligence.bridge.workspace_id');
        $secret = (string) config('fourmix-intelligence.bridge.secret');
        $baseUrl = rtrim((string) config('fourmix-intelligence.native.url'), '/');
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
        $response = $this->http->baseUrl($baseUrl)->acceptJson()->withoutRedirecting()
            ->timeout((int) config('fourmix-intelligence.native.timeout', 250))->connectTimeout(5)
            ->withHeaders(['X-Fourmix-Timestamp' => $timestamp, 'X-Fourmix-Nonce' => $nonce, 'X-Fourmix-Workspace' => $workspace,
                'X-Fourmix-Connection' => $connection, 'X-Fourmix-Signature' => 'v1='.hash_hmac('sha256', $canonical, $secret)])
            ->withBody($raw, 'application/json')->post($path);
        if (! $response->successful() || ! is_array($response->json())) {
            throw new ApiException('AIの処理を完了できませんでした。接続と会話履歴を確認してください。', $response->status());
        }

        return $response->json();
    }
}
