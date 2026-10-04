<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolExecutor;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;

final class NativeBridgeTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('fourmix-intelligence.bridge.enabled', true);
        $app['config']->set('fourmix-intelligence.bridge.secret', str_repeat('s', 32));
        $app['config']->set('fourmix-intelligence.bridge.workspace_id', 'workspace-1');
        $app['config']->set('fourmix-intelligence.bridge.connection_id', 'connection-1');
        $app['config']->set('fourmix-intelligence.bridge.enabled_operations', ['orders.lookup']);
        $app['config']->set('database.default', 'testing');
        $app['config']->set('cache.default', 'array');
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://api.example.test']);
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        $this->app->bind(ToolPolicy::class, NativeBridgeTestPolicy::class);
        $this->app->make(ToolRegistry::class)->register(new NativeBridgeFixture);
        $key = app(ConnectionManager::class)->issue(new ToolContext('test-user'), '合成接続', ['orders.lookup' => 'review']);
        DB::table('fourmix_intelligence_connections')->where('id', $key['id'])->update(['state' => 'ready', 'scope' => 'workspace',
            'remote_connection' => 'connection-1', 'workspace_id' => 'workspace-1', 'secret' => Crypt::encryptString(str_repeat('s', 32)), 'code_hash' => null,
            'platform_url' => 'https://api.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic']);
        DB::table('fourmix_intelligence_user_bindings')->insert(['id' => (string) Str::uuid(), 'subject' => 'test-user', 'display_name' => '合成利用者',
            'connection_id' => 'connection-1', 'workspace_id' => 'workspace-1', 'remote_user' => (string) Str::uuid()]);
    }

    public function test_it_exposes_and_executes_only_enabled_registered_operations(): void
    {
        $manifest = $this->signed('GET', '/fourmix-intelligence/v1/manifest');
        self::assertSame(200, $manifest->status(), $manifest->getContent());
        $manifest->assertJsonPath('protocol', 'fourmix-laravel/1.0')->assertJsonCount(1, 'capabilities');
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup', ['arguments' => ['number' => 'A-1']])
            ->assertOk()->assertJsonPath('data.number', 'A-1');
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.cancel', ['arguments' => ['number' => 'A-1']])
            ->assertForbidden();
    }

    public function test_studio_grant_can_execute_without_a_ui_binding_or_alias(): void
    {
        $identity = ['grant_id' => (string) Str::uuid(), 'audience' => 'internal'];
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup', [
            'arguments' => ['number' => 'studio-order'], 'identity' => $identity,
        ])->assertOk()->assertJsonPath('data.number', 'studio-order');
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup', [
            'arguments' => ['number' => 'studio-order'], 'identity' => [...$identity, 'audience' => 'customer'],
        ])->assertForbidden();
    }

    public function test_old_signed_secret_cannot_call_after_permissions_are_rehandshaken(): void
    {
        $local = DB::table('fourmix_intelligence_connections')->value('id');
        app(ConnectionManager::class)->renew(new ToolContext('test-user'), $local, ['orders.lookup' => 'automatic']);
        $this->signed('GET', '/fourmix-intelligence/v1/manifest')->assertForbidden();
        DB::table('fourmix_intelligence_connections')->where('id', $local)->update(['state' => 'ready', 'scope' => 'workspace',
            'workspace_id' => 'workspace-1', 'secret' => Crypt::encryptString(str_repeat('n', 64)), 'code_hash' => null]);
        DB::table('fourmix_intelligence_user_bindings')->insert(['id' => (string) Str::uuid(), 'subject' => 'test-user', 'display_name' => '新しい関連付け',
            'connection_id' => 'connection-1', 'workspace_id' => 'workspace-1', 'remote_user' => (string) Str::uuid()]);
        $this->signed('GET', '/fourmix-intelligence/v1/manifest')->assertForbidden();
        $this->signed('GET', '/fourmix-intelligence/v1/manifest', secret: str_repeat('n', 64))->assertOk()->assertJsonPath('revision', 2);
    }

    public function test_it_rejects_replayed_requests(): void
    {
        $nonce = 'fixed-nonce';
        $this->signed('GET', '/fourmix-intelligence/v1/manifest', [], $nonce)->assertOk();
        $this->signed('GET', '/fourmix-intelligence/v1/manifest', [], $nonce)->assertForbidden();
    }

    public function test_unsigned_query_arguments_cannot_supplement_a_signed_request_body(): void
    {
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup?arguments[number]=unsigned', ['identity' => []])
            ->assertUnprocessable();
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup', ['arguments' => ['number' => 'signed']])
            ->assertOk()->assertJsonPath('data.number', 'signed');
    }

    #[DataProvider('restrictedReceiptCallers')]
    public function test_receipts_recheck_signed_caller_metadata_even_when_host_policy_discards_it(string $scenario): void
    {
        [$requestId, $grant] = $this->completedStudioAction();
        $identity = ['audience' => 'customer'];
        if ($scenario !== 'customer_fincube') {
            $identity += ['grant_id' => $grant];
        }
        $this->signed('POST', '/fourmix-intelligence/v1/receipts/'.$requestId, ['identity' => $identity])->assertForbidden();
        $this->assertDatabaseHas('fourmix_intelligence_tool_actions', ['request_id' => $requestId, 'state' => 'succeeded']);
    }

    public static function restrictedReceiptCallers(): array
    {
        return [['customer_studio'], ['customer_fincube']];
    }

    public function test_execution_preserves_signed_metadata_and_receipt_checks_the_original_ai_after_revocation(): void
    {
        [$requestId, $grant] = $this->completedStudioAction();
        $this->signed('POST', '/fourmix-intelligence/v1/receipts/'.$requestId)->assertOk()
            ->assertJsonPath('data.execution_identity.workspace_id', 'workspace-1')
            ->assertJsonPath('data.execution_identity.connection_id', 'connection-1')
            ->assertJsonPath('data.execution_identity.grant_id', $grant)
            ->assertJsonPath('data.execution_identity.audience', 'internal');
        app(ConnectionManager::class)->renew(new ToolContext('test-user'), DB::table('fourmix_intelligence_connections')->value('id'), []);
        $this->signed('POST', '/fourmix-intelligence/v1/receipts/'.$requestId)->assertForbidden();
    }

    #[DataProvider('invalidIdentityMetadata')]
    public function test_execute_and_receipt_validate_metadata_before_resolving_the_host_identity(string $endpoint, array $identity, string $error): void
    {
        $this->mock(ToolPolicy::class, fn ($mock) => $mock->shouldNotReceive('resolve'));
        $path = $endpoint === 'execute' ? '/fourmix-intelligence/v1/actions/orders.lookup'
            : '/fourmix-intelligence/v1/receipts/'.Str::uuid();
        $this->signed('POST', $path, ['identity' => $identity, 'arguments' => ['number' => 'A-1']])
            ->assertUnprocessable()->assertJsonValidationErrors($error);
    }

    public static function invalidIdentityMetadata(): array
    {
        $cases = [];
        foreach (['execute', 'receipt'] as $endpoint) {
            foreach ([
                [['audience' => 'other'], 'identity.audience'],
                [['audience' => null], 'identity.audience'],
                [['grant_id' => null], 'identity.grant_id'],
                [['grant_id' => 'bad'], 'identity.grant_id'],
            ] as [$identity, $error]) {
                $cases[] = [$endpoint, $identity, $error];
            }
        }

        return $cases;
    }

    /** @return array{string, string} */
    private function completedStudioAction(array $metadata = []): array
    {
        $internalGrant = (string) Str::uuid();
        $registry = app(ToolRegistry::class);
        $registry->registerCallback('records.save', ['description' => '合成情報を保存', 'version' => '1', 'read_only' => false,
            'input_schema' => ['type' => 'object', 'properties' => ['number' => ['type' => 'string']], 'required' => ['number']]],
            fn (array $arguments, ToolContext $context): array => ['number' => $arguments['number'], 'execution_identity' => $context->identity]);
        config(['fourmix-intelligence.bridge.enabled_operations' => ['orders.lookup', 'records.save']]);
        DB::table('fourmix_intelligence_connections')->update(['permissions' => app(ToolConsent::class)->encode(['orders.lookup' => 'review', 'records.save' => 'review'])]);
        $requestId = (string) Str::uuid();
        $proposal = $this->signed('POST', '/fourmix-intelligence/v1/actions/records.save', ['request_id' => $requestId,
            'arguments' => ['number' => 'internal-record'], 'identity' => [...$metadata, 'grant_id' => $internalGrant,
                'audience' => 'internal', 'workspace_id' => 'forged-workspace',
                'connection_id' => 'forged-connection']])->assertOk()->assertJsonPath('state', 'confirmation_required');
        app(ToolExecutor::class)->confirm(new ToolContext('test-user'), $proposal->json('id'));

        return [$requestId, $internalGrant];
    }

    public function test_fincube_and_unselected_studio_ai_share_the_connections_host_permissions(): void
    {
        $binding = DB::table('fourmix_intelligence_user_bindings')->first();
        $base = ['binding_id' => $binding->id, 'remote_user' => $binding->remote_user];
        $studio = [...$base, 'grant_id' => (string) Str::uuid()];
        $this->signed('POST', '/fourmix-intelligence/v1/bindings/context', $studio)->assertOk()->assertJsonPath('permissions', ['orders.lookup' => 'review']);
        $this->signed('POST', '/fourmix-intelligence/v1/bindings/context', $base)->assertOk()->assertJsonPath('permissions', ['orders.lookup' => 'review']);
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
        app(ConnectionManager::class)->renew(new ToolContext('test-user'), DB::table('fourmix_intelligence_connections')->value('id'), []);
        $this->signed('POST', '/fourmix-intelligence/v1/bindings/context', $studio)->assertForbidden();
        $this->signed('POST', '/fourmix-intelligence/v1/bindings/context', $base)->assertForbidden();
    }

    public function test_a_ui_unselected_internal_ai_can_read_the_same_connections_receipt(): void
    {
        [$requestId, $grant] = $this->completedStudioAction();
        $this->signed('POST', '/fourmix-intelligence/v1/receipts/'.$requestId, ['identity' => ['audience' => 'internal',
            'grant_id' => $grant]])->assertOk();
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
    }

    #[DataProvider('receiptBoundaries')]
    public function test_signed_receipts_preserve_conversation_binding_and_grant_even_when_application_policy_discards_metadata(string $field): void
    {
        $metadata = ['binding_id' => (string) Str::uuid(), 'conversation_id' => (string) Str::uuid()];
        [$requestId, $grant] = $this->completedStudioAction($metadata);
        $identity = [...$metadata, 'grant_id' => $grant, 'audience' => 'internal'];
        $this->signed('POST', '/fourmix-intelligence/v1/receipts/'.$requestId, ['identity' => $identity])->assertOk()
            ->assertJsonPath('data.execution_identity.conversation_id', $metadata['conversation_id']);
        $identity[$field] = (string) Str::uuid();
        $this->signed('POST', '/fourmix-intelligence/v1/receipts/'.$requestId, ['identity' => $identity])->assertForbidden();
        $this->assertDatabaseCount('fourmix_intelligence_tool_actions', 1);
    }

    public static function receiptBoundaries(): array
    {
        return [['grant_id'], ['binding_id'], ['conversation_id']];
    }

    public function test_cache_flush_cannot_change_the_configured_connection(): void
    {
        $this->signed('GET', '/fourmix-intelligence/v1/manifest')->assertOk();
        Cache::flush();
        $this->signed('GET', '/fourmix-intelligence/v1/manifest', workspace: 'workspace-2')->assertStatus(409);
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup', ['arguments' => ['number' => 'A-1']], connection: 'connection-2')->assertForbidden();
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup', ['arguments' => ['number' => 'A-1']])->assertOk();
        $this->signed('GET', '/fourmix-intelligence/v1/manifest', connection: 'connection-2')->assertForbidden();
    }

    public function test_environment_settings_do_not_override_the_database_connection(): void
    {
        config(['fourmix-intelligence.bridge.connection_id' => 'forged', 'fourmix-intelligence.bridge.workspace_id' => 'forged', 'fourmix-intelligence.bridge.secret' => null]);
        $this->signed('GET', '/fourmix-intelligence/v1/manifest')->assertOk();
        DB::table('fourmix_intelligence_connections')->delete();
        $this->signed('GET', '/fourmix-intelligence/v1/manifest')->assertForbidden();
    }

    private function signed(string $method, string $path, array $body = [], ?string $nonce = null, string $workspace = 'workspace-1', string $connection = 'connection-1', string $secret = 'ssssssssssssssssssssssssssssssss')
    {
        $timestamp = (string) time();
        $nonce ??= fake()->uuid();
        $raw = $body === [] ? '' : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $canonical = implode("\n", [$timestamp, $nonce, $method, parse_url($path, PHP_URL_PATH), $workspace, $connection, hash('sha256', $raw)]);
        $headers = [
            'X-Fourmix-Timestamp' => $timestamp,
            'X-Fourmix-Nonce' => $nonce,
            'X-Fourmix-Workspace' => $workspace,
            'X-Fourmix-Connection' => $connection,
            'X-Fourmix-Signature' => 'v1='.hash_hmac('sha256', $canonical, $secret),
        ];

        $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];
        foreach ($headers as $name => $value) {
            $server['HTTP_'.strtoupper(str_replace('-', '_', $name))] = $value;
        }

        return $this->call($method, $path, [], [], [], $server, $raw);
    }
}

final class NativeBridgeTestPolicy implements ToolPolicy
{
    public function resolve(array $identity): ToolContext
    {
        return new ToolContext('test-user');
    }

    public function authorize(ToolContext $context, string $operation, array $arguments): void {}

    public function preview(ToolContext $context, string $operation, array $arguments): array
    {
        return $arguments;
    }

    public function reviewUrl(string $actionId): string
    {
        return '/reviews/'.$actionId;
    }
}

final class NativeBridgeFixture
{
    #[FourmixIntelligenceTool(name: 'orders.lookup', description: '注文を確認します', inputSchema: [
        'type' => 'object', 'properties' => ['number' => ['type' => 'string']], 'required' => ['number'],
    ], domain: 'orders', keywords: ['注文'])]
    public function lookup(string $number): array
    {
        return ['number' => $number];
    }

    #[FourmixIntelligenceTool(name: 'orders.cancel', description: '注文を取消します', requiresApproval: true, readOnly: false, inputSchema: [
        'type' => 'object', 'properties' => ['number' => ['type' => 'string']], 'required' => ['number'],
    ])]
    public function cancel(string $number): array
    {
        return ['number' => $number];
    }
}
