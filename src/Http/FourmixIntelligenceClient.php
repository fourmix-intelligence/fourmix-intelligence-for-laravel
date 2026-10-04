<?php

namespace FourmixIntelligence\Laravel\Http;

use FourmixIntelligence\Laravel\Data\AgentResult;
use FourmixIntelligence\Laravel\Exceptions\ApiException;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Str;

final class FourmixIntelligenceClient
{
    /** @param array<string, mixed> $config */
    public function __construct(private readonly Factory $http, private readonly array $config) {}

    /**
     * @param  array<int, array{role:string, content:string}>  $messages
     * @param  array<string, mixed>  $options
     */
    public function run(string $agent, array $messages, array $options = [], ?string $conversationId = null, ?string $customerToken = null): AgentResult
    {
        $body = ['messages' => $messages, 'options' => $options];
        if ($conversationId !== null) {
            $body['conversation_id'] = $conversationId;
        }
        if ($customerToken !== null) {
            $body['customer_token'] = $customerToken;
        }

        // 会話実行は初回通信の結果が不明なまま再送すると、同じ発言を二重に処理する
        // 可能性がある。利用側で会話IDを受け取る前のため、自動再試行しない。
        return AgentResult::fromArray($this->json('POST', '/api/v3/ai/plugins/'.rawurlencode($agent).'/runs', $body, allowRetry: false));
    }

    /** @return array<string, mixed> */
    public function history(string $agent, string $conversationId, string $customerToken, ?int $beforeId = null): array
    {
        $body = ['conversation_id' => $conversationId, 'customer_token' => $customerToken];
        if ($beforeId !== null) {
            $body['before_id'] = $beforeId;
        }

        return $this->json('POST', '/api/v3/ai/plugins/'.rawurlencode($agent).'/customer-history', $body);
    }

    /**
     * @param  array<int, array<string, mixed>>  $records
     * @return array<string, mixed>
     */
    public function syncDocuments(string $dataset, array $records, ?string $idempotencyKey = null): array
    {
        return $this->json('POST', '/api/v3/data/'.rawurlencode($dataset).'/documents/sync', ['records' => $records], $idempotencyKey ?? (string) Str::uuid(), true);
    }

    /** @return array<string, mixed> */
    public function syncStatus(string $dataset, string $jobId): array
    {
        return $this->json('GET', '/api/v3/data/'.rawurlencode($dataset).'/sync/'.rawurlencode($jobId), [], null, true);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function json(string $method, string $path, array $payload = [], ?string $idempotencyKey = null, bool $sync = false, bool $allowRetry = true): array
    {
        $request = $this->request($sync, $allowRetry);
        if ($idempotencyKey !== null) {
            $request = $request->withHeader('Idempotency-Key', $idempotencyKey);
        }
        $response = $request->send($method, ltrim($path, '/'), $method === 'GET' ? ['query' => $payload] : ['json' => $payload]);
        $this->ensureSuccessful($response);
        $json = $response->json();
        if (! is_array($json)) {
            // HTML の案内画面や壊れた JSON を成功として扱わない。本文は秘密情報を
            // 含む可能性があるため、例外へコピーしない。
            throw new ApiException('Fourmix Intelligence の応答形式を確認できませんでした。', $response->status(), $response->header('X-Request-Id'));
        }

        return $json;
    }

    private function request(bool $sync = false, bool $allowRetry = true): PendingRequest
    {
        $token = $sync ? ($this->config['sync_token'] ?? null) : ($this->config['token'] ?? null);
        if (! is_string($token) || $token === '') {
            throw new ApiException($sync ? '資料同期キーが設定されていません。' : '接続トークンが設定されていません。');
        }
        $retry = is_array($this->config['retry'] ?? null) ? $this->config['retry'] : [];

        $request = $this->http->baseUrl(rtrim((string) $this->config['url'], '/'))->acceptJson()->asJson()->withoutRedirecting()
            ->withToken($token)->timeout((int) ($this->config['timeout'] ?? 60))
            ->connectTimeout((int) ($this->config['connect_timeout'] ?? 5))
            ->withHeaders(['User-Agent' => 'Fourmix-Intelligence-for-Laravel/1.0']);

        return $allowRetry
            ? $request->retry((int) ($retry['times'] ?? 2), (int) ($retry['sleep_ms'] ?? 250), throw: false)
            : $request;
    }

    private function ensureSuccessful(Response $response): void
    {
        if ($response->successful()) {
            return;
        }
        throw new ApiException('Fourmix Intelligence との通信に失敗しました。', $response->status(), $response->header('X-Request-Id'));
    }
}
