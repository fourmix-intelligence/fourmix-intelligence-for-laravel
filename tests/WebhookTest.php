<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Http\Middleware\VerifyFourmixIntelligenceWebhook;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class WebhookTest extends TestCase
{
    private int $calls = 0;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'testing', 'database.connections.testing' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => ''], 'fourmix-intelligence.webhooks.secret' => 'isolated-test-secret', 'fourmix-intelligence.webhooks.connection_id' => 'connection-one']);
        (require __DIR__.'/../database/migrations/2026_10_01_000000_create_fourmix_intelligence_webhook_receipts.php')->up();
        Route::post('/webhook', function () { ++$this->calls; return response()->json(['accepted' => true]); })->middleware(VerifyFourmixIntelligenceWebhook::class);
        Route::post('/failure', function () { ++$this->calls; return response()->json(['accepted' => false], 503); })->middleware(VerifyFourmixIntelligenceWebhook::class);
    }

    public function test_duplicates_return_original_response_after_cache_flush_and_new_timestamp(): void
    {
        $this->deliver('one')->assertOk()->assertJson(['accepted' => true]);
        cache()->flush();
        $this->deliver('one', time() + 1)->assertOk()->assertJson(['accepted' => true]);
        $this->assertSame(1, $this->calls);
        $this->deliver('two')->assertOk();
        $this->assertSame(2, $this->calls);
    }

    public function test_payload_collision_and_in_flight_event_never_execute_twice(): void
    {
        $this->deliver('one')->assertOk();
        $this->deliver('one', extra: 'different')->assertStatus(409);
        DB::table('fourmix_intelligence_webhook_receipts')->update(['status' => 'processing']);
        $this->deliver('one')->assertStatus(409);
        $this->assertSame(1, $this->calls);
    }

    public function test_uncertain_result_is_retained_and_not_retried(): void
    {
        $this->deliver('one', path: '/failure')->assertStatus(503);
        $this->deliver('one', path: '/failure')->assertStatus(409);
        $this->assertSame(1, $this->calls);
    }

    public function test_invalid_signed_and_expired_requests_fail_before_handler(): void
    {
        $this->deliver('one', time() - 301)->assertUnauthorized();
        $this->deliver('one', signature: 'invalid')->assertUnauthorized();
        $this->deliver('')->assertStatus(422);
        config(['fourmix-intelligence.webhooks.connection_id' => null]);
        $this->deliver('one')->assertStatus(503);
        $this->assertSame(0, $this->calls);
    }

    public function test_overlapping_delivery_cannot_enter_the_handler_and_alias_returns_original_result(): void
    {
        $middleware = new VerifyFourmixIntelligenceWebhook;
        $body = json_encode(['event_id' => 'overlap', 'data' => ''], JSON_THROW_ON_ERROR);
        $timestamp = (string) time();
        $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_X_FOURMIX_INTELLIGENCE_TIMESTAMP' => $timestamp,
            'HTTP_X_FOURMIX_INTELLIGENCE_SIGNATURE' => hash_hmac('sha256', $timestamp.'.'.$body, 'isolated-test-secret')];
        $request = fn (string $path) => Request::create($path, 'POST', server: $server, content: $body);
        $result = $middleware->handle($request('/webhook'), function () use ($middleware, $request) {
            ++$this->calls;
            try {
                $middleware->handle($request('/alias'), function () { ++$this->calls; return response('unexpected'); });
                $this->fail('処理中の同一イベントは拒否される必要があります。');
            } catch (HttpException $exception) {
                $this->assertSame(409, $exception->getStatusCode());
            }
            return response()->json(['accepted' => true]);
        });
        $retry = $middleware->handle($request('/alias'), function () { ++$this->calls; return response('unexpected'); });
        $this->assertSame(1, $this->calls);
        $this->assertSame($result->getContent(), $retry->getContent());
        $this->assertSame(200, $retry->getStatusCode());
    }

    public function test_claim_inside_an_uncommitted_business_transaction_is_rejected(): void
    {
        DB::beginTransaction();
        try {
            $this->deliver('transaction')->assertStatus(503);
            $this->assertSame(0, $this->calls);
            $this->assertSame(0, DB::table('fourmix_intelligence_webhook_receipts')->count());
        } finally {
            DB::rollBack();
        }
    }

    private function deliver(string $event, ?int $timestamp = null, string $extra = '', string $path = '/webhook', ?string $signature = null): \Illuminate\Testing\TestResponse
    {
        $timestamp ??= time();
        $body = json_encode(['event_id' => $event, 'data' => $extra], JSON_THROW_ON_ERROR);
        return $this->call('POST', $path, server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X_FOURMIX_INTELLIGENCE_TIMESTAMP' => (string) $timestamp, 'HTTP_X_FOURMIX_INTELLIGENCE_SIGNATURE' => $signature ?? hash_hmac('sha256', $timestamp.'.'.$body, 'isolated-test-secret')], content: $body);
    }
}
