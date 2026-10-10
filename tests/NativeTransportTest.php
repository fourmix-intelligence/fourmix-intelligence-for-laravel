<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\Http\NativeApplicationClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestWith;

final class NativeTransportTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://platform.example.test']);
    }

    #[TestWith([403, 403])]
    #[TestWith([409, 409])]
    #[TestWith([429, 429])]
    #[TestWith([503, 503])]
    #[TestWith([500, 502])]
    #[TestWith([401, 502])]
    #[TestWith([200, 502])]
    public function test_api_errors_return_safe_json_instead_of_500(int $upstream, int $expected): void
    {
        Route::get('/test-ai-transport', function () use ($upstream) {
            throw new ApiException('synthetic-private-value', $upstream);
        });
        $this->getJson('/test-ai-transport')->assertStatus($expected)->assertJsonStructure(['message'])
            ->assertHeader('Cache-Control', 'no-store, private')->assertDontSee('synthetic-private-value');
    }

    public function test_native_connection_failure_returns_503_without_resending(): void
    {
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        $remote = (string) Str::uuid();
        DB::table('fourmix_intelligence_connections')->insert(['id' => (string) Str::uuid(), 'subject' => 'user:1', 'name' => '合成接続',
            'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic', 'scope' => 'personal',
            'host_mode' => 'user', 'remote_connection' => $remote, 'workspace_id' => '', 'secret' => Crypt::encryptString(str_repeat('s', 64)),
            'state' => 'ready', 'created_at' => now(), 'updated_at' => now()]);
        Http::preventStrayRequests();
        $attempts = 0;
        Http::fake(['platform.example.test/*' => function () use (&$attempts) {
            $attempts++;
            throw new ConnectionException('synthetic-private-value');
        }]);
        Route::get('/test-ai-history', fn () => app(NativeApplicationClient::class)->call('agent_history', [], $remote));
        $this->getJson('/test-ai-history')->assertStatus(503)->assertJsonPath('message', '接続先との通信を完了できませんでした。会話履歴と操作結果を確認してください。')->assertDontSee('synthetic-private-value');
        $this->assertSame(1, $attempts);
    }
}
