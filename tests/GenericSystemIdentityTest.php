<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\Tools\AuthenticatedIntegrationAccess;
use FourmixIntelligence\Laravel\Tools\BridgeConnections;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Auth\GenericUser;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class GenericSystemIdentityTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('cache.default', 'array');
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://platform.example.test']);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('s', 32)));
        $app['config']->set('fourmix-intelligence.bridge.enabled', true);
        $app['config']->set('fourmix-intelligence.bridge.enabled_operations', ['orders.lookup']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        Http::preventStrayRequests();
    }

    #[TestWith(['personal', ''])]
    #[TestWith(['organization', ''])]
    #[TestWith(['workspace', '11111111-1111-4111-8111-111111111111'])]
    public function test_an_explicit_host_service_adapter_handshakes_and_executes_with_an_independent_service_subject(string $scope, string $workspace): void
    {
        $this->configureServiceHost();
        $this->actingAs(new GenericUser(['id' => 71]));
        $pending = $this->postJson(route('fourmix-intelligence.connections.key'), $this->input($scope))->assertCreated()->json();
        $connection = (string) Str::uuid();
        $remoteUser = (string) Str::uuid();
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([
            'code_hash' => hash('sha256', $pending['code']), 'tenant' => 'synthetic', 'scope' => $scope,
            'connection_id' => $connection, 'workspace_id' => $workspace, 'remote_user' => $remoteUser,
        ])]);
        $binding = $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), 'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic'])
            ->assertOk()->assertJsonPath('subject', 'service:fulfillment')->json();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $pending['id'], 'subject' => 'service:fulfillment', 'host_mode' => 'system']);
        $this->assertDatabaseHas('fourmix_intelligence_user_bindings', ['id' => $binding['binding_id'], 'subject' => 'service:fulfillment']);
        $this->assertSame(0, DB::table('fourmix_intelligence_connections')->where('subject', 'like', 'user:%')->count());
        $this->assertSame(0, DB::table('fourmix_intelligence_user_bindings')->where('subject', 'like', 'user:%')->count());
        Http::assertSentCount(1);
        Http::assertSent(fn ($request): bool => $request['code_hash'] === hash('sha256', $pending['code']) && $request['ticket'] === str_repeat('a', 64));
        $this->signed('/fourmix-intelligence/v1/bindings/context', ['binding_id' => $binding['binding_id'], 'remote_user' => $remoteUser], $connection, $workspace, $binding['secret'])
            ->assertOk()->assertJsonPath('subject', 'service:fulfillment')->assertJsonPath('permissions', ['orders.lookup' => 'review']);
        $this->signed('/fourmix-intelligence/v1/actions/orders.lookup', ['arguments' => ['number' => 'SYNTHETIC-100'],
            'identity' => ['remote_user' => $remoteUser, 'subject' => 'user:71']], $connection, $workspace, $binding['secret'])
            ->assertOk()->assertJsonPath('state', 'succeeded')->assertJsonPath('data.execution_subject', 'service:fulfillment')
            ->assertJsonPath('data.number', 'SYNTHETIC-100')->assertJsonPath('data.remote_caller', $remoteUser);
        config(['host.service.enabled' => false]);
        $this->signed('/fourmix-intelligence/v1/actions/orders.lookup', ['arguments' => ['number' => 'SYNTHETIC-100'],
            'identity' => ['remote_user' => $remoteUser]], $connection, $workspace, $binding['secret'])->assertForbidden();
    }

    public function test_a_user_without_the_host_service_gate_cannot_create_or_manage_system_connections(): void
    {
        $this->configureServiceHost();
        $this->actingAs(new GenericUser(['id' => 72]));
        $this->getJson(route('fourmix-intelligence.state'))->assertForbidden();
        $this->postJson(route('fourmix-intelligence.connections.key'), $this->input('organization'))->assertForbidden();
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
        Http::assertNothingSent();
    }

    public function test_the_default_account_adapter_refuses_system_authority_even_if_an_unrelated_gate_is_allowed(): void
    {
        Gate::define('fourmix-intelligence.system', fn (Authenticatable $user): bool => true);
        $request = Request::create('/fourmix-intelligence/connections', 'POST');
        $request->setUserResolver(fn (): GenericUser => new GenericUser(['id' => 71]));
        try {
            app(AuthenticatedIntegrationAccess::class)->authorizeSystemConnection($request);
            $this->fail('システム権限は専用の宿主アダプターを明示的に導入した場合だけ利用できます。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
        Http::assertNothingSent();
    }

    private function configureServiceHost(): void
    {
        config(['fourmix-intelligence.ui.host_modes' => ['system'], 'host.service.enabled' => true]);
        Gate::define('host.service.integration', fn (Authenticatable $user): bool => $user->getAuthIdentifier() === 71 && config('host.service.enabled'));
        $this->app->bind(IntegrationAccess::class, GenericServiceIntegrationAccess::class);
        $this->app->bind(ToolPolicy::class, GenericServiceToolPolicy::class);
        app(ToolRegistry::class)->register(new GenericServiceOrderTools);
    }

    private function input(string $scope): array
    {
        return ['name' => '配送サービスの合成接続', 'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test',
            'tenant' => 'synthetic', 'scope' => $scope, 'host_mode' => 'system', 'modes' => ['orders.lookup' => 'review']];
    }

    private function signed(string $path, array $body, string $connection, string $workspace, string $secret): TestResponse
    {
        $timestamp = (string) time();
        $nonce = (string) Str::uuid();
        $raw = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $canonical = implode("\n", [$timestamp, $nonce, 'POST', $path, $workspace, $connection, hash('sha256', $raw)]);

        return $this->call('POST', $path, [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_FOURMIX_TIMESTAMP' => $timestamp, 'HTTP_X_FOURMIX_NONCE' => $nonce, 'HTTP_X_FOURMIX_WORKSPACE' => $workspace,
            'HTTP_X_FOURMIX_CONNECTION' => $connection, 'HTTP_X_FOURMIX_SIGNATURE' => 'v1='.hash_hmac('sha256', $canonical, $secret)], $raw);
    }
}

final class GenericServiceIntegrationAccess implements IntegrationAccess
{
    public function context(Request $request): ToolContext
    {
        abort_unless($request->user() !== null, 401);
        Gate::forUser($request->user())->authorize('host.service.integration');

        return new ToolContext('service:fulfillment');
    }

    public function authorizeSystemConnection(Request $request): void
    {
        $this->context($request);
    }
}

final class GenericServiceToolPolicy implements ToolPolicy
{
    public function resolve(array $identity): ToolContext
    {
        abort_unless(config('host.service.enabled') && Str::isUuid($identity['remote_user'] ?? '') && is_string($identity['connection_id'] ?? null), 403);
        $connection = app(BridgeConnections::class)->get($identity['connection_id']);
        abort_unless($connection['host_mode'] === 'system' && $connection['subject'] === 'service:fulfillment'
            && $connection['workspace_id'] === ($identity['workspace_id'] ?? null), 403);
        $binding = DB::table('fourmix_intelligence_user_bindings')->where('subject', 'service:fulfillment')
            ->where('connection_id', $identity['connection_id'])->where('remote_user', $identity['remote_user'])->whereNull('revoked_at')->first();
        abort_unless($binding !== null, 403);

        return new ToolContext('service:fulfillment', 'fourmix-intelligence', array_intersect_key($identity, array_flip(['connection_id', 'workspace_id', 'remote_user'])));
    }

    public function authorize(ToolContext $context, string $operation, array $arguments): void
    {
        abort_unless(config('host.service.enabled') && $context->subject === 'service:fulfillment' && $operation === 'orders.lookup', 403);
    }

    public function preview(ToolContext $context, string $operation, array $arguments): array
    {
        return ['operation' => '配送状況の確認', 'input' => $arguments];
    }

    public function reviewUrl(string $actionId): string
    {
        return '/reviews/'.$actionId;
    }
}

final class GenericServiceOrderTools
{
    #[FourmixIntelligenceTool(name: 'orders.lookup', description: '注文番号から配送状況を確認します', scopes: ['orders:read'], inputSchema: [
        'type' => 'object', 'properties' => ['number' => ['type' => 'string']], 'required' => ['number'],
    ])]
    public function lookup(string $number, ToolContext $context): array
    {
        return ['number' => $number, 'execution_subject' => $context->subject, 'remote_caller' => $context->identity['remote_user']];
    }
}
