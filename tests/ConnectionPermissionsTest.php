<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Tools\BridgeConnections;
use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolExecutor;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Auth\GenericUser;
use Illuminate\Database\RecordNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class ConnectionPermissionsTest extends TestCase
{
    private int $writes = 0;

    private string $grantRemote;

    private string $grantScope;

    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('s', 32)));
        $app['config']->set('cache.default', 'array');
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://platform.example.test']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        Http::preventStrayRequests();
        Http::fake(['https://platform.example.test/*' => fn ($request) => Http::response(['code_hash' => $request['code_hash'],
            'tenant' => 'synthetic', 'scope' => $this->grantScope, 'connection_id' => $this->grantRemote, 'remote_user' => (string) Str::uuid(),
            'workspace_id' => $this->grantScope === 'workspace' ? '11111111-1111-4111-8111-111111111111' : ''])]);
        $registry = app(ToolRegistry::class);
        $registry->registerCallback('records.lookup', ['description' => '合成情報を見る', 'read_only' => true, 'input_schema' => ['type' => 'object', 'properties' => (object) []]],
            fn (array $arguments, ToolContext $context): array => ['subject' => $context->subject]);
        $registry->registerCallback('records.save', ['description' => '合成情報を保存', 'version' => '1', 'read_only' => false,
            'input_schema' => ['type' => 'object', 'properties' => ['name' => ['type' => 'string']], 'required' => ['name']]],
            function (array $arguments): array {
                $this->writes++;

                return ['saved' => $arguments['name']];
            });
        $this->app->instance(ToolPolicy::class, new ConnectionPermissionsPolicy);
    }

    /** @return array{array<string, mixed>, ToolContext, array<string, string>} */
    private function ready(array $modes, string $subject = 'user:1', string $scope = 'personal', ?string $remote = null): array
    {
        $key = app(ConnectionManager::class)->issue(new ToolContext($subject), '合成接続', $modes);
        $remote ??= (string) Str::uuid();
        $result = $this->handshake($key, $remote, $scope);

        return [$key, new ToolContext($subject, 'fourmix-intelligence', ['connection_id' => $remote, 'connection_revision' => $result['connection_revision']]), $result];
    }

    private function handshake(array $key, string $remote, string $scope = 'personal'): array
    {
        $this->grantRemote = $remote;
        $this->grantScope = $scope;

        return app(ConnectionManager::class)->complete($key['code'], str_repeat('t', 64), [
            'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic']);
    }

    public function test_management_sets_permissions_per_connection_and_requires_confirmation_for_automatic_writes(): void
    {
        $this->actingAs(new GenericUser(['id' => 1]));
        $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => '合成接続', 'modes' => ['records.save' => 'automatic']])
            ->assertUnprocessable()->assertJsonValidationErrors('acknowledge_automatic');
        $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => '合成接続', 'modes' => ['unknown.save' => 'automatic'], 'acknowledge_automatic' => true])
            ->assertUnprocessable();
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
        $key = $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => '合成接続', 'modes' => ['records.save' => 'review']])
            ->assertCreated()->json();
        $remote = (string) Str::uuid();
        $this->handshake($key, $remote);
        $path = route('fourmix-intelligence.connections.permissions', $key['id']);
        $this->putJson($path, ['modes' => ['records.save' => 'automatic']])->assertUnprocessable();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $key['id'], 'state' => 'ready', 'revision' => 1]);
        $renewed = $this->putJson($path, ['modes' => [], 'subject' => 'user:2'])->assertOk()->assertJsonPath('id', $key['id'])
            ->assertJsonPath('revision', 2)->json();
        $this->assertNotSame($key['code'], $renewed['code']);
        $this->assertSame(['records.lookup' => 'disabled', 'records.save' => 'disabled'], app(ToolConsent::class)->forConnection(new ToolContext('user:1'), $key['id']));
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $key['id'], 'subject' => 'user:1', 'state' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        $this->actingAs(new GenericUser(['id' => 2]))->putJson($path, ['modes' => []])->assertNotFound();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $key['id'], 'revision' => 2]);
    }

    public function test_two_connections_of_one_owner_have_independent_operation_modes(): void
    {
        [$first, $allowed] = $this->ready(['records.lookup' => 'automatic', 'records.save' => 'review']);
        [$second, $disabled] = $this->ready(['records.lookup' => 'disabled', 'records.save' => 'automatic']);
        $consent = app(ToolConsent::class);
        $this->assertSame('review', $consent->mode($allowed, 'records.save'));
        $this->assertSame('automatic', $consent->mode($disabled, 'records.save'));
        $this->assertSame('succeeded', app(ToolExecutor::class)->execute($allowed, 'records.lookup', [])['state']);
        $this->expectException(HttpException::class);
        app(ToolExecutor::class)->execute($disabled, 'records.lookup', []);
    }

    #[TestWith(['personal'])]
    #[TestWith(['organization'])]
    #[TestWith(['workspace'])]
    public function test_fi_usage_scope_does_not_change_the_owner_or_grant_unselected_operations(string $scope): void
    {
        [$key, $context] = $this->ready(['records.lookup' => 'review'], scope: $scope);
        $this->assertSame('user:1', DB::table('fourmix_intelligence_connections')->where('id', $key['id'])->value('subject'));
        $this->assertSame('disabled', app(ToolConsent::class)->mode($context, 'records.save'));
        $this->assertSame('succeeded', app(ToolExecutor::class)->execute($context, 'records.lookup', [])['state']);
        $this->expectException(HttpException::class);
        app(ToolExecutor::class)->execute(new ToolContext('user:2', identity: $context->identity), 'records.lookup', []);
    }

    public function test_permissions_change_invalidates_secret_bindings_old_key_and_actions_before_rehandshake(): void
    {
        [$first, $original, $binding] = $this->ready(['records.save' => 'review']);
        $proposal = app(ToolExecutor::class)->execute($original, 'records.save', ['name' => '合成'], (string) Str::uuid());
        DB::table('fourmix_intelligence_agent_bindings')->insert(['subject' => 'user:1', 'alias' => 'assistant', 'connection_id' => $first['id'],
            'grant_id' => (string) Str::uuid()]);
        $renewed = app(ConnectionManager::class)->renew(new ToolContext('user:1'), $first['id'], ['records.save' => 'automatic']);
        $this->assertSame($first['id'], $renewed['id']);
        $this->assertSame(2, $renewed['revision']);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $first['id'], 'state' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
        try {
            app(BridgeConnections::class)->get($original->identity['connection_id']);
            $this->fail('旧接続を拒否してください。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        try {
            $this->handshake($first, $original->identity['connection_id']);
            $this->fail('使用済みキーを拒否してください。');
        } catch (RecordNotFoundException) {
            $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        }
        $newBinding = $this->handshake($renewed, $original->identity['connection_id']);
        $this->assertNotSame($binding['secret'], $newBinding['secret']);
        $this->assertNotSame($binding['binding_id'], $newBinding['binding_id']);
        $this->assertSame('2', $newBinding['connection_revision']);
        $this->assertSame(0, $this->writes);
        try {
            app(ToolExecutor::class)->confirm(new ToolContext('user:1'), $proposal['id']);
            $this->fail('旧世代の確認を拒否してください。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        $current = new ToolContext('user:1', identity: ['connection_id' => $original->identity['connection_id'], 'connection_revision' => '2']);
        $this->assertSame('succeeded', app(ToolExecutor::class)->execute($current, 'records.save', ['name' => '新しい合成'], (string) Str::uuid())['state']);
        $this->assertSame(1, $this->writes);
    }

    public function test_renew_cannot_be_requested_by_another_owner_and_does_not_change_other_connections(): void
    {
        [$first, $context] = $this->ready(['records.lookup' => 'automatic']);
        [$second, $other] = $this->ready(['records.lookup' => 'review']);
        try {
            app(ConnectionManager::class)->renew(new ToolContext('user:2'), $first['id'], []);
            $this->fail('別の利用者による変更を拒否してください。');
        } catch (RecordNotFoundException) {
            $this->assertSame('automatic', app(ToolConsent::class)->mode($context, 'records.lookup'));
        }
        app(ConnectionManager::class)->renew(new ToolContext('user:1'), $first['id'], []);
        $this->assertSame('review', app(ToolConsent::class)->mode($other, 'records.lookup'));
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $second['id'], 'revision' => 1, 'state' => 'ready']);
    }

    public function test_an_ai_not_selected_as_a_laravel_ui_alias_can_use_connection_permissions(): void
    {
        [$key, $context] = $this->ready(['records.save' => 'automatic']);
        $remoteAi = new ToolContext($context->subject, 'fourmix-intelligence', [...$context->identity,
            'grant_id' => (string) Str::uuid(), 'host_agent_alias' => 'not-a-ui-selection', 'audience' => 'internal']);
        $this->assertSame('succeeded', app(ToolExecutor::class)->execute($remoteAi, 'records.save', ['name' => '合成'], (string) Str::uuid())['state']);
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
    }

    public function test_receipts_cannot_cross_connection_boundaries_even_for_the_same_owner(): void
    {
        [$first, $original] = $this->ready(['records.save' => 'review']);
        [$second, $other] = $this->ready(['records.save' => 'review']);
        $request = (string) Str::uuid();
        app(ToolExecutor::class)->execute($original, 'records.save', ['name' => '合成'], $request);
        $this->expectException(HttpException::class);
        app(ToolExecutor::class)->receipt($other, $request);
    }

    public function test_confirmation_cannot_cross_connections_before_the_write_occurs(): void
    {
        [$first, $original] = $this->ready(['records.save' => 'review']);
        [$second, $other] = $this->ready(['records.save' => 'review']);
        $proposal = app(ToolExecutor::class)->execute($original, 'records.save', ['name' => '合成'], (string) Str::uuid());
        try {
            app(ToolExecutor::class)->confirm($other, $proposal['id']);
            $this->fail('別の接続から確認してはいけません。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        $this->assertSame(0, $this->writes);
        $this->assertDatabaseHas('fourmix_intelligence_tool_actions', ['id' => $proposal['id'], 'state' => 'confirmation_required']);
    }

    public function test_an_uncompleted_key_is_rotated_and_only_its_new_key_can_handshake(): void
    {
        $original = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', ['records.lookup' => 'review']);
        $renewed = app(ConnectionManager::class)->renew(new ToolContext('user:1'), $original['id'], []);
        $this->assertSame($original['id'], $renewed['id']);
        $this->assertNotSame($original['code'], $renewed['code']);
        try {
            $this->handshake($original, (string) Str::uuid());
            $this->fail('古い未使用キーも無効にしてください。');
        } catch (RecordNotFoundException) {
            Http::assertNothingSent();
        }
        $remote = (string) Str::uuid();
        $this->handshake($renewed, $remote);
        $this->assertSame('disabled', app(ToolConsent::class)->mode(new ToolContext('user:1', identity: ['connection_id' => $remote]), 'records.lookup'));
    }

    public function test_host_policy_can_deny_an_operation_permitted_by_the_connection(): void
    {
        [$key, $context] = $this->ready(['records.lookup' => 'automatic']);
        $this->app->instance(ToolPolicy::class, new ConnectionPermissionsPolicy(false));
        $this->expectException(HttpException::class);
        app(ToolExecutor::class)->execute($context, 'records.lookup', []);
    }

    public function test_delete_removes_the_connection_but_keeps_action_audit_records(): void
    {
        [$key, $context] = $this->ready(['records.save' => 'review']);
        app(ToolExecutor::class)->execute($context, 'records.save', ['name' => '合成'], (string) Str::uuid());
        app(ConnectionManager::class)->revoke(new ToolContext('user:1'), $key['id']);
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        $this->assertDatabaseCount('fourmix_intelligence_tool_actions', 1);
    }
}

final class ConnectionPermissionsPolicy implements ToolPolicy
{
    public function __construct(private bool $allowed = true) {}

    public function resolve(array $identity): ToolContext
    {
        return new ToolContext('user:1', identity: $identity);
    }

    public function authorize(ToolContext $context, string $operation, array $arguments): void
    {
        abort_unless($this->allowed, 403);
    }

    public function preview(ToolContext $context, string $operation, array $arguments): array
    {
        return $arguments;
    }

    public function reviewUrl(string $actionId): string
    {
        return '/reviews/'.$actionId;
    }
}
