<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Tools\BoundUserToolPolicy;
use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use FourmixIntelligence\Laravel\Tools\UserBindings;
use Illuminate\Auth\GenericUser;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class BoundUserToolPolicyTest extends TestCase
{
    private string $connection;

    private string $remoteUser;

    private string $secret;

    private string $binding;

    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('s', 32)));
        $app['config']->set('cache.default', 'array');
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://platform.example.test']);
        $app['config']->set('auth.providers.users', ['driver' => 'database', 'table' => 'synthetic_auth_users']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        Schema::create('synthetic_auth_users', function (Blueprint $table): void {
            $table->string('id')->primary();
        });
        Http::preventStrayRequests();
        $this->assertInstanceOf(BoundUserToolPolicy::class, app(ToolPolicy::class));
    }

    #[TestWith(['17'])]
    #[TestWith(['6e7487c5-adf4-4bf9-a7de-59f35766335f'])]
    public function test_pure_studio_context_needs_no_host_policy_for_existing_integer_or_uuid_users(string $identifier): void
    {
        $this->connect($identifier);
        $this->signed('/fourmix-intelligence/v1/bindings/context', $this->bindingInput())
            ->assertOk()->assertJsonPath('subject', 'user:'.$identifier)->assertJsonPath('permissions', []);
        $resolved = app(ToolPolicy::class)->resolve([...$this->identity(), 'subject' => 'user:someone-else']);
        $this->assertSame('user:'.$identifier, $resolved->subject);
        $this->assertSame($this->binding, $resolved->identity['binding_id']);
    }

    public function test_deleted_user_is_rejected_even_when_a_guard_still_has_a_cached_user(): void
    {
        $this->connect('17');
        $this->actingAs(new GenericUser(['id' => '17']));
        $this->signed('/fourmix-intelligence/v1/bindings/context', $this->bindingInput())->assertOk();
        DB::table('synthetic_auth_users')->where('id', '17')->delete();
        $this->signed('/fourmix-intelligence/v1/bindings/context', $this->bindingInput())->assertForbidden();
    }

    public function test_connection_owner_and_host_mode_cannot_be_substituted(): void
    {
        $this->connect('17');
        DB::table('synthetic_auth_users')->insert(['id' => '18']);
        DB::table('fourmix_intelligence_connections')->update(['subject' => 'user:18']);
        $this->signed('/fourmix-intelligence/v1/bindings/context', $this->bindingInput())->assertForbidden();
        DB::table('fourmix_intelligence_connections')->update(['subject' => 'user:17', 'host_mode' => 'system']);
        $this->signed('/fourmix-intelligence/v1/bindings/context', $this->bindingInput())->assertForbidden();
    }

    public function test_revoked_or_different_remote_identity_cannot_resolve_the_pairing(): void
    {
        $this->connect('17');
        $policy = app(ToolPolicy::class);
        foreach ([['remote_user' => (string) Str::uuid()], ['workspace_id' => (string) Str::uuid()]] as $change) {
            try {
                $policy->resolve([...$this->identity(), ...$change]);
                $this->fail('異なる利用者や利用範囲は拒否される必要があります。');
            } catch (HttpException $exception) {
                $this->assertSame(403, $exception->getStatusCode());
            }
        }
        DB::table('fourmix_intelligence_user_bindings')->update(['revoked_at' => now()]);
        $this->expectException(HttpException::class);
        $policy->resolve($this->identity());
    }

    public function test_even_explicit_tool_consent_does_not_grant_business_permissions_without_a_host_policy(): void
    {
        $this->connect('17');
        $executed = false;
        $registry = app(ToolRegistry::class);
        $registry->registerCallback('catalog.lookup', ['read_only' => true, 'input_schema' => ['type' => 'object', 'properties' => []]],
            function () use (&$executed): array {
                $executed = true;

                return ['items' => []];
            });
        DB::table('fourmix_intelligence_connections')->where('remote_connection', $this->connection)->update(['permissions' => app(ToolConsent::class)->encode(['catalog.lookup' => 'automatic'])]);
        $this->signed('/fourmix-intelligence/v1/actions/catalog.lookup', ['identity' => $this->identity(), 'arguments' => []])->assertForbidden();
        $this->assertFalse($executed);
        $this->expectException(HttpException::class);
        app(ToolPolicy::class)->preview(new ToolContext('user:17'), 'catalog.lookup', []);
    }

    public function test_environment_values_cannot_establish_an_unpaired_database_connection(): void
    {
        DB::table('synthetic_auth_users')->insert(['id' => '17']);
        $remote = (string) Str::uuid();
        config(['fourmix-intelligence.bridge.connection_id' => $remote,
            'fourmix-intelligence.bridge.scope' => 'personal', 'fourmix-intelligence.bridge.workspace_id' => '',
            'fourmix-intelligence.bridge.secret' => str_repeat('l', 32)]);
        try {
            app(UserBindings::class)->issue(new ToolContext('user:17'), '合成利用者', $remote);
            $this->fail('設定値だけの接続を許可しないでください。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
    }

    private function connect(string $identifier): void
    {
        DB::table('synthetic_auth_users')->insert(['id' => $identifier]);
        $manager = app(ConnectionManager::class);
        $pending = $manager->issue(new ToolContext('user:'.$identifier), '合成アプリの接続', []);
        $this->connection = (string) Str::uuid();
        $this->remoteUser = (string) Str::uuid();
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([
            'code_hash' => hash('sha256', $pending['code']), 'tenant' => 'synthetic', 'scope' => 'personal',
            'connection_id' => $this->connection, 'workspace_id' => '', 'remote_user' => $this->remoteUser,
        ])]);
        $this->secret = $manager->complete($pending['code'], str_repeat('a', 64), ['platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic'])['secret'];
        $this->binding = DB::table('fourmix_intelligence_user_bindings')->where('connection_id', $this->connection)->value('id');
    }

    /** @return array<string, string> */
    private function identity(): array
    {
        return ['workspace_id' => '', 'connection_id' => $this->connection, 'remote_user' => $this->remoteUser];
    }

    /** @return array<string, string> */
    private function bindingInput(): array
    {
        return ['binding_id' => $this->binding, 'remote_user' => $this->remoteUser];
    }

    /** @param array<string, mixed> $body */
    private function signed(string $path, array $body): TestResponse
    {
        $timestamp = (string) time();
        $nonce = (string) Str::uuid();
        $raw = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $canonical = implode("\n", [$timestamp, $nonce, 'POST', $path, '', $this->connection, hash('sha256', $raw)]);

        return $this->call('POST', $path, [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_FOURMIX_TIMESTAMP' => $timestamp, 'HTTP_X_FOURMIX_NONCE' => $nonce,
            'HTTP_X_FOURMIX_WORKSPACE' => '', 'HTTP_X_FOURMIX_CONNECTION' => $this->connection,
            'HTTP_X_FOURMIX_SIGNATURE' => 'v1='.hash_hmac('sha256', $canonical, $this->secret),
        ], $raw);
    }
}
