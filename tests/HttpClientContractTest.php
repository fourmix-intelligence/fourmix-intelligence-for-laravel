<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;

final class HttpClientContractTest extends TestCase
{
    private const DATASET = '10000000-0000-4000-8000-000000000001';

    private const JOB = '10000000-0000-4000-8000-000000000002';

    private const CONVERSATION = '10000000-0000-4000-8000-000000000003';

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    /** @param array<string, mixed> $overrides */
    private function client(array $overrides = []): FourmixIntelligenceClient
    {
        return new FourmixIntelligenceClient($this->app->make(Factory::class), array_replace([
            'url' => 'https://example.test',
            'token' => 'synthetic-agent-token',
            'sync_token' => 'fmsync.synthetic-test-key',
            'retry' => ['times' => 2, 'sleep_ms' => 0],
        ], $overrides));
    }

    public function test_it_rejects_non_json_success_without_copying_the_body(): void
    {
        Http::fake(['example.test/*' => Http::response('<html>synthetic-private-value</html>', 200, ['X-Request-Id' => 'request-1'])]);

        try {
            $this->client()->run('sales', [['role' => 'user', 'content' => '合成データで確認']]);
            self::fail('JSON 以外の応答は成功にできません。');
        } catch (ApiException $exception) {
            self::assertSame(200, $exception->status);
            self::assertSame('request-1', $exception->requestId);
            self::assertStringNotContainsString('synthetic-private-value', $exception->getMessage());
        }

        Http::assertSentCount(1);
    }

    public function test_it_does_not_retry_an_agent_connection_failure(): void
    {
        $attempts = 0;
        Http::fake(function () use (&$attempts) {
            $attempts++;

            return Http::failedConnection('合成タイムアウト');
        });

        try {
            $this->client()->run('sales', [['role' => 'user', 'content' => '一度だけ処理']]);
            self::fail('通信失敗を返す必要があります。');
        } catch (ConnectionException) {
            self::assertSame(1, $attempts);
        }
    }

    public function test_history_keeps_the_external_conversation_identity(): void
    {
        Http::fake(['example.test/*' => Http::response(['messages' => [], 'has_more' => false])]);
        $this->client()->history('sales', self::CONVERSATION, str_repeat('a', 64), 7);

        Http::assertSent(fn ($request): bool => $request->method() === 'POST'
            && $request->url() === 'https://example.test/api/v3/ai/plugins/sales/customer-history'
            && $request->hasHeader('Authorization', 'Bearer synthetic-agent-token')
            && $request['conversation_id'] === self::CONVERSATION
            && $request['customer_token'] === str_repeat('a', 64)
            && $request['before_id'] === 7);
    }

    public function test_sync_retries_keep_the_same_key_and_sync_credential(): void
    {
        Http::fakeSequence()->push(['detail' => '一時的な障害'], 503)
            ->push(['id' => self::JOB, 'status' => 'queued'], 202);
        $records = [['key' => 'synthetic-guide', 'version' => 1, 'operation' => 'replace', 'text' => '合成の案内文']];
        $result = $this->client()->syncDocuments(self::DATASET, $records, 'synthetic-idempotency-key');

        self::assertSame(self::JOB, $result['id']);
        Http::assertSentCount(2);
        foreach (Http::recorded() as [$request]) {
            self::assertSame('https://example.test/api/v3/data/'.self::DATASET.'/documents/sync', $request->url());
            self::assertTrue($request->hasHeader('Authorization', 'Bearer fmsync.synthetic-test-key'));
            self::assertTrue($request->hasHeader('Idempotency-Key', 'synthetic-idempotency-key'));
            self::assertSame($records, $request['records']);
        }
    }

    public function test_sync_status_uses_the_sync_credential_and_job_id(): void
    {
        Http::fake(['example.test/*' => Http::response(['id' => self::JOB, 'status' => 'completed'])]);
        $result = $this->client()->syncStatus(self::DATASET, self::JOB);
        self::assertSame('completed', $result['status']);
        Http::assertSent(fn ($request): bool => $request->method() === 'GET'
            && $request->url() === 'https://example.test/api/v3/data/'.self::DATASET.'/sync/'.self::JOB
            && $request->hasHeader('Authorization', 'Bearer fmsync.synthetic-test-key'));
    }

    public function test_it_preserves_an_authorization_failure(): void
    {
        Http::fake(['example.test/*' => Http::response(['detail' => 'この AI は利用できません。'], 403, ['X-Request-Id' => 'denied-1'])]);
        try {
            $this->client()->run('denied', [['role' => 'user', 'content' => '合成の権限確認']]);
            self::fail('認可拒否を返す必要があります。');
        } catch (ApiException $exception) {
            self::assertSame(403, $exception->status);
            self::assertSame('denied-1', $exception->requestId);
        }
        Http::assertSentCount(1);
    }

    public function test_a_missing_sync_key_does_not_fall_back_to_the_agent_token(): void
    {
        Http::fake();
        try {
            $this->client(['sync_token' => null])->syncStatus(self::DATASET, self::JOB);
            self::fail('同期専用キーを要求する必要があります。');
        } catch (ApiException $exception) {
            self::assertSame(0, $exception->status);
        }
        Http::assertNothingSent();
    }
}
