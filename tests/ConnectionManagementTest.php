<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Tools\BridgeConnections;
use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\UiPreferences;
use Illuminate\Auth\GenericUser;
use Illuminate\Database\RecordNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class ConnectionManagementTest extends TestCase
{
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
    }

    private function input(string $scope = 'personal'): array
    {
        return ['name' => '合成アプリの接続', 'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test',
            'tenant' => 'synthetic', 'scope' => $scope, 'host_mode' => 'user', 'modes' => []];
    }

    #[TestWith(['personal', ''])]
    #[TestWith(['organization', ''])]
    #[TestWith(['workspace', '11111111-1111-4111-8111-111111111111'])]
    public function test_handshake_establishes_each_scope_without_environment_identifiers(string $scope, string $workspace): void
    {
        $manager = app(ConnectionManager::class);
        $pending = $manager->issue(new ToolContext('user:1'), '合成アプリの接続', []);
        $remote = (string) Str::uuid();
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([
            'code_hash' => hash('sha256', $pending['code']), 'tenant' => 'synthetic', 'scope' => $scope,
            'connection_id' => $remote, 'workspace_id' => $workspace, 'remote_user' => (string) Str::uuid(),
        ])]);
        $result = $manager->complete($pending['code'], str_repeat('a', 64), $this->callbackEndpoint());
        $configuration = app(BridgeConnections::class)->get($remote);
        $this->assertSame($scope, $configuration['scope']);
        $this->assertSame($workspace, $configuration['workspace_id']);
        $this->assertSame($result['secret'], $configuration['secret']);
        $this->assertNotSame($result['secret'], DB::table('fourmix_intelligence_connections')->value('secret'));
        $this->assertDatabaseHas('fourmix_intelligence_user_bindings', ['subject' => 'user:1', 'connection_id' => $remote]);
        $this->assertStringNotContainsString($result['secret'], json_encode($manager->connections(new ToolContext('user:1'))));
        Http::assertSentCount(1);
        $this->expectException(RecordNotFoundException::class);
        $manager->complete($pending['code'], str_repeat('a', 64), $this->callbackEndpoint());
    }

    public function test_user_connections_are_not_visible_or_revocable_by_another_user(): void
    {
        $owner = new GenericUser(['id' => 1]);
        $this->actingAs($owner)->postJson(route('fourmix-intelligence.connections.key'), $this->input())->assertCreated();
        $id = DB::table('fourmix_intelligence_connections')->value('id');
        $this->actingAs(new GenericUser(['id' => 2]))->getJson(route('fourmix-intelligence.state'))->assertOk()->assertJsonCount(0, 'connections');
        $this->deleteJson(route('fourmix-intelligence.connections.revoke', $id))->assertNotFound();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $id, 'state' => 'pending']);
        Http::assertNothingSent();
    }

    public function test_system_identity_requires_an_explicit_host_authorization(): void
    {
        $input = $this->input();
        $input['host_mode'] = 'system';
        config(['fourmix-intelligence.ui.host_modes' => ['user', 'system']]);
        $this->actingAs(new GenericUser(['id' => 1]))->postJson(route('fourmix-intelligence.connections.key'), $input)->assertForbidden();
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
    }

    #[TestWith(['pending'])]
    #[TestWith(['revoked'])]
    public function test_deletion_removes_the_connection_and_invalidates_its_key(string $state): void
    {
        $manager = app(ConnectionManager::class);
        $pending = $manager->issue(new ToolContext('user:1'), '合成接続', []);
        DB::table('fourmix_intelligence_connections')->where('id', $pending['id'])->update(['state' => $state]);

        $this->actingAs(new GenericUser(['id' => 1]))->deleteJson(route('fourmix-intelligence.connections.revoke', $pending['id']))
            ->assertOk()->assertJsonPath('deleted', true);

        $this->assertDatabaseMissing('fourmix_intelligence_connections', ['id' => $pending['id']]);
        $this->getJson(route('fourmix-intelligence.state'))->assertJsonCount(0, 'connections');
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertNotFound();
        Http::assertNothingSent();
    }

    public function test_deletion_removes_only_the_target_connection_and_its_own_bindings(): void
    {
        $manager = app(ConnectionManager::class);
        $target = $manager->issue(new ToolContext('user:1'), '合成接続', []);
        $remaining = $manager->issue(new ToolContext('user:1'), '合成接続', []);
        $other = $manager->issue(new ToolContext('user:2'), '別の利用者の合成接続', []);
        $remote = (string) Str::uuid();
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([
            'code_hash' => hash('sha256', $target['code']), 'tenant' => 'synthetic', 'scope' => 'personal',
            'connection_id' => $remote, 'workspace_id' => '', 'remote_user' => (string) Str::uuid(),
        ])]);
        $manager->complete($target['code'], str_repeat('a', 64), [
            'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic',
        ]);
        foreach ([['user:1', 'deleted-ai', $target['id']], ['user:1', 'remaining-ai', $remaining['id']], ['user:2', 'other-ai', $other['id']]] as [$subject, $alias, $connection]) {
            DB::table('fourmix_intelligence_agent_bindings')->insert(['subject' => $subject, 'alias' => $alias,
                'connection_id' => $connection, 'grant_id' => (string) Str::uuid(), 'created_at' => now(), 'updated_at' => now()]);
        }

        $this->actingAs(new GenericUser(['id' => 1]))->deleteJson(route('fourmix-intelligence.connections.revoke', $target['id']))
            ->assertOk()->assertJsonPath('deleted', true);

        $this->assertDatabaseMissing('fourmix_intelligence_connections', ['id' => $target['id']]);
        $this->assertDatabaseMissing('fourmix_intelligence_user_bindings', ['subject' => 'user:1', 'connection_id' => $remote]);
        $this->assertDatabaseMissing('fourmix_intelligence_agent_bindings', ['subject' => 'user:1', 'alias' => 'deleted-ai']);
        $this->assertDatabaseHas('fourmix_intelligence_agent_bindings', ['subject' => 'user:1', 'alias' => 'remaining-ai']);
        $this->assertDatabaseHas('fourmix_intelligence_agent_bindings', ['subject' => 'user:2', 'alias' => 'other-ai']);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $remaining['id'], 'subject' => 'user:1']);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $other['id'], 'subject' => 'user:2']);
        $this->getJson(route('fourmix-intelligence.state'))->assertJsonCount(1, 'connections')->assertJsonPath('connections.0.id', $remaining['id']);
        Http::assertSentCount(1);
    }

    public function test_multiple_named_connections_can_be_renamed_and_deleted_independently(): void
    {
        $this->actingAs(new GenericUser(['id' => 1]));
        $first = $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => '個人用AI', 'modes' => []])->assertCreated()->json('id');
        $second = $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => '開発チーム用AI', 'modes' => []])->assertCreated()->json('id');

        $this->patchJson(route('fourmix-intelligence.connections.rename', $first), ['name' => ' 新しい個人用AI ', 'subject' => 'user:2', 'host_mode' => 'system'])
            ->assertOk()->assertJsonPath('updated', true);

        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $first, 'name' => '新しい個人用AI', 'subject' => 'user:1', 'host_mode' => 'user', 'state' => 'pending']);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $second, 'name' => '開発チーム用AI']);
        $this->getJson(route('fourmix-intelligence.state'))->assertJsonCount(2, 'connections');
        $this->deleteJson(route('fourmix-intelligence.connections.revoke', $first))->assertOk()->assertJsonPath('deleted', true);
        $this->getJson(route('fourmix-intelligence.state'))->assertJsonCount(1, 'connections')->assertJsonPath('connections.0.id', $second);
        $this->assertDatabaseMissing('fourmix_intelligence_connections', ['id' => $first]);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $second, 'name' => '開発チーム用AI']);
        Http::assertNothingSent();
    }

    #[TestWith([''])]
    #[TestWith(['   '])]
    #[TestWith([['invalid']])]
    public function test_connection_names_are_required_and_rename_does_not_change_invalid_names(mixed $name): void
    {
        $manager = app(ConnectionManager::class);
        $connection = $manager->issue(new ToolContext('user:1'), '合成接続', []);
        $this->actingAs(new GenericUser(['id' => 1]));

        $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => $name, 'modes' => []])->assertUnprocessable();
        $this->patchJson(route('fourmix-intelligence.connections.rename', $connection['id']), ['name' => $name, 'modes' => []])->assertUnprocessable();

        $this->assertDatabaseCount('fourmix_intelligence_connections', 1);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $connection['id'], 'name' => '合成接続']);
        Http::assertNothingSent();
    }

    public function test_connection_rename_requires_the_owner_and_does_not_accept_overlong_names(): void
    {
        $connection = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        $this->patchJson(route('fourmix-intelligence.connections.rename', $connection['id']), ['name' => '変更', 'modes' => []])->assertUnauthorized();
        $this->actingAs(new GenericUser(['id' => 2]))->patchJson(route('fourmix-intelligence.connections.rename', $connection['id']), ['name' => '変更', 'modes' => []])->assertNotFound();
        $this->actingAs(new GenericUser(['id' => 1]))->patchJson(route('fourmix-intelligence.connections.rename', $connection['id']), ['name' => str_repeat('名', 101), 'modes' => []])->assertUnprocessable();
        $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => str_repeat('名', 101), 'modes' => []])->assertUnprocessable();

        $this->assertDatabaseCount('fourmix_intelligence_connections', 1);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $connection['id'], 'name' => '合成接続']);
        Http::assertNothingSent();
    }

    public function test_an_invalid_platform_scope_cannot_complete_a_pending_handshake(): void
    {
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成アプリの接続', []);
        Http::fake(['https://platform.example.test/*' => Http::response(['code_hash' => hash('sha256', $pending['code']),
            'tenant' => 'synthetic', 'scope' => 'invalid', 'connection_id' => (string) Str::uuid(),
            'workspace_id' => '', 'remote_user' => (string) Str::uuid()])]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertForbidden();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $pending['id'], 'state' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
    }

    #[TestWith(['https://127.0.0.1:8443'])]
    #[TestWith(['https://10.0.0.1'])]
    #[TestWith(['https://169.254.169.254'])]
    #[TestWith(['https://untrusted.example.test'])]
    public function test_handshake_refuses_untrusted_private_or_external_platforms(string $url): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64),
            ...$this->callbackEndpoint(), 'platform_url' => $url])->assertUnprocessable();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $pending['id'], 'state' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        Http::assertNothingSent();
    }

    public function test_trust_removal_before_handshake_is_revalidated(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        config(['fourmix-intelligence.native.trusted_platform_urls' => []]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64),
            ...$this->callbackEndpoint()])->assertUnprocessable();
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        Http::assertNothingSent();
    }

    public function test_an_explicitly_trusted_self_hosted_platform_is_supported(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://self-hosted.example.test']]);
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        Http::fake(['https://self-hosted.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([
            'code_hash' => hash('sha256', $pending['code']), 'tenant' => 'synthetic', 'scope' => 'personal',
            'connection_id' => (string) Str::uuid(), 'workspace_id' => '', 'remote_user' => (string) Str::uuid(),
        ])]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64),
            ...$this->callbackEndpoint(), 'platform_url' => 'https://self-hosted.example.test/'])->assertOk();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $pending['id'], 'state' => 'ready', 'platform_url' => 'https://self-hosted.example.test']);
        Http::assertSentCount(1);
    }

    public function test_expired_handshake_is_refused_before_contacting_platform(): void
    {
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成アプリの接続', []);
        $this->travel(11)->minutes();
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertNotFound();
        Http::assertNothingSent();
    }

    public function test_package_pages_and_assets_are_provided_and_settings_require_login(): void
    {
        $this->getJson(route('fourmix-intelligence.state'))->assertUnauthorized();
        $this->actingAs(new GenericUser(['id' => 1]))->get(route('fourmix-intelligence.manage'))->assertOk()->assertSee('AIとの連携設定');
        $this->get(route('fourmix-intelligence.assets', 'sdk.js'))->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->get('/fourmix-intelligence/assets/composer.json')->assertNotFound();
    }

    #[TestWith(['personal', ''])]
    #[TestWith(['organization', ''])]
    #[TestWith(['workspace', '11111111-1111-4111-8111-111111111111'])]
    public function test_issued_key_accepts_only_platform_verified_scope_and_keeps_the_application_owner(string $scope, string $workspace): void
    {
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://platform.example.test']]);
        $response = $this->actingAs(new GenericUser(['id' => 1]))->postJson(route('fourmix-intelligence.connections.key'),
            ['name' => '合成接続', 'modes' => [], 'subject' => 'user:2', 'scope' => 'system'])->assertCreated();
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        $code = $response->json('code');
        $id = $response->json('id');
        $this->assertSame(48, strlen($code));
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $id, 'subject' => 'user:1', 'host_mode' => 'user',
            'scope' => 'pending', 'platform_url' => '', 'tenant' => '', 'code_hash' => hash('sha256', $code), 'secret' => null]);
        $remote = (string) Str::uuid();
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([
            'code_hash' => hash('sha256', $code), 'tenant' => 'synthetic', 'scope' => $scope,
            'connection_id' => $remote, 'workspace_id' => $workspace, 'remote_user' => (string) Str::uuid(),
        ])]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $code, 'ticket' => str_repeat('a', 64),
            ...$this->callbackEndpoint(), 'scope' => 'system', 'subject' => 'user:2'])->assertOk()->assertJsonPath('subject', 'user:1');
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $id, 'subject' => 'user:1', 'host_mode' => 'user',
            'state' => 'ready', 'scope' => $scope, 'workspace_id' => $workspace, 'remote_connection' => $remote, 'code_hash' => null]);
        $this->assertDatabaseHas('fourmix_intelligence_user_bindings', ['subject' => 'user:1', 'connection_id' => $remote]);
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
        $this->assertFalse(Schema::hasTable('fourmix_intelligence_tool_permissions'));
        $this->actingAs(new GenericUser(['id' => 2]))->getJson(route('fourmix-intelligence.state'))->assertJsonCount(0, 'connections');
        $this->deleteJson(route('fourmix-intelligence.connections.revoke', $id))->assertNotFound();
        Http::assertSentCount(1);
    }

    #[TestWith(['https://not-trusted.example.test'])]
    #[TestWith(['https://platform.example.test.evil.example'])]
    #[TestWith(['https://platform.example.test/another-base'])]
    #[TestWith(['https://user:password@platform.example.test'])]
    public function test_issued_key_rejects_untrusted_callback_api_before_making_a_request(string $url): void
    {
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://platform.example.test']]);
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64),
            ...$this->callbackEndpoint(), 'platform_url' => $url])->assertUnprocessable();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $pending['id'], 'state' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        Http::assertNothingSent();
    }

    #[TestWith(['scope', 'system'])]
    #[TestWith(['scope', 'workspace'])]
    #[TestWith(['workspace_id', '11111111-1111-4111-8111-111111111111'])]
    #[TestWith(['code_hash', 'wrong-hash'])]
    #[TestWith(['tenant', 'another-tenant'])]
    #[TestWith(['connection_id', 'not-a-uuid'])]
    #[TestWith(['remote_user', 'not-a-uuid'])]
    public function test_issued_key_does_not_accept_inconsistent_verified_grants(string $field, string $value): void
    {
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://platform.example.test']]);
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        $grant = ['code_hash' => hash('sha256', $pending['code']), 'tenant' => 'synthetic', 'scope' => 'personal',
            'connection_id' => (string) Str::uuid(), 'workspace_id' => '', 'remote_user' => (string) Str::uuid()];
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([...$grant, $field => $value])]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertForbidden();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $pending['id'], 'state' => 'pending', 'scope' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
    }

    public function test_callback_redirect_is_not_followed_and_does_not_establish_a_connection(): void
    {
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://platform.example.test']]);
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response('', 302, ['Location' => 'https://other.example.test/verify'])]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertForbidden();
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
        Http::assertSentCount(1);
    }

    public function test_workspace_grant_requires_a_uuid_instead_of_accepting_any_nonempty_workspace_identifier(): void
    {
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://platform.example.test']]);
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => Http::response([
            'code_hash' => hash('sha256', $pending['code']), 'tenant' => 'synthetic', 'scope' => 'workspace',
            'connection_id' => (string) Str::uuid(), 'workspace_id' => 'not-a-workspace-uuid', 'remote_user' => (string) Str::uuid(),
        ])]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertForbidden();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $pending['id'], 'state' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 0);
    }

    public function test_expired_issued_key_cannot_be_used_and_system_key_is_not_granted_to_a_normal_user(): void
    {
        $pending = app(ConnectionManager::class)->issue(new ToolContext('user:1'), '合成接続', []);
        $this->travel(10)->minutes();
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $pending['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertNotFound();
        config(['fourmix-intelligence.ui.host_modes' => ['user', 'system']]);
        $this->actingAs(new GenericUser(['id' => 1]))->postJson(route('fourmix-intelligence.connections.key'), ['name' => '合成接続', 'modes' => [], 'host_mode' => 'system'])->assertForbidden();
        $this->assertDatabaseCount('fourmix_intelligence_connections', 1);
        Http::assertNothingSent();
    }

    public function test_issued_key_cannot_be_replayed_or_claimed_as_a_second_application_users_connection(): void
    {
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://platform.example.test']]);
        $manager = app(ConnectionManager::class);
        $first = $manager->issue(new ToolContext('user:1'), '合成接続', []);
        $second = $manager->issue(new ToolContext('user:2'), '別の利用者の合成接続', []);
        $remote = (string) Str::uuid();
        Http::fake(['https://platform.example.test/api/v3/native/laravel/handshake/synthetic/verify' => fn ($request) => Http::response([
            'code_hash' => $request['code_hash'], 'tenant' => 'synthetic', 'scope' => 'organization',
            'connection_id' => $remote, 'workspace_id' => '', 'remote_user' => (string) Str::uuid(),
        ])]);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $first['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertOk();
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $first['code'], 'ticket' => str_repeat('a', 64), ...$this->callbackEndpoint()])->assertNotFound();
        Http::assertSentCount(1);
        $this->postJson('/fourmix-intelligence/v1/handshake', ['code' => $second['code'], 'ticket' => str_repeat('b', 64), ...$this->callbackEndpoint()])->assertConflict();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $first['id'], 'subject' => 'user:1', 'state' => 'ready']);
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $second['id'], 'subject' => 'user:2', 'state' => 'pending', 'secret' => null]);
        $this->assertDatabaseCount('fourmix_intelligence_user_bindings', 1);
    }

    private function callbackEndpoint(): array
    {
        return ['platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic'];
    }

    #[TestWith(['header'])]
    #[TestWith(['floating'])]
    #[TestWith(['both'])]
    #[TestWith(['hidden'])]
    public function test_chat_entry_preferences_are_personal_and_do_not_grant_ai_or_business_permissions(string $entry): void
    {
        $this->assertSame(['chat_entry' => 'floating'], app(UiPreferences::class)->for(new ToolContext('user:1')));
        $response = $this->actingAs(new GenericUser(['id' => 1]))->putJson(route('fourmix-intelligence.preferences'),
            ['chat_entry' => $entry, 'subject' => 'user:2', 'allowed_operations' => ['*']])->assertOk()
            ->assertJsonPath('ui_preferences.chat_entry', $entry);
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        $this->getJson(route('fourmix-intelligence.state'))->assertOk()->assertJsonPath('ui_preferences.chat_entry', $entry);
        $this->actingAs(new GenericUser(['id' => 2]))->getJson(route('fourmix-intelligence.state'))->assertOk()->assertJsonPath('ui_preferences.chat_entry', 'floating');
        $this->assertDatabaseHas('fourmix_intelligence_ui_preferences', ['subject' => 'user:1', 'chat_entry' => $entry]);
        $this->assertDatabaseCount('fourmix_intelligence_ui_preferences', 1);
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
        $this->assertFalse(Schema::hasTable('fourmix_intelligence_tool_permissions'));
        Http::assertNothingSent();
    }

    public function test_preferences_require_authentication_and_reject_unsupported_entries_without_overwriting_saved_choice(): void
    {
        $this->putJson(route('fourmix-intelligence.preferences'), ['chat_entry' => 'header'])->assertUnauthorized();
        app(UiPreferences::class)->save(new ToolContext('user:1'), 'hidden');
        $this->actingAs(new GenericUser(['id' => 1]))->putJson(route('fourmix-intelligence.preferences'), ['chat_entry' => 'system'])->assertUnprocessable();
        $this->assertSame(['chat_entry' => 'hidden'], app(UiPreferences::class)->for(new ToolContext('user:1')));
        $this->assertDatabaseCount('fourmix_intelligence_ui_preferences', 1);
        Http::assertNothingSent();
    }

    public function test_public_preference_service_rejects_an_unsupported_choice_without_creating_a_row(): void
    {
        try {
            app(UiPreferences::class)->save(new ToolContext('user:1'), 'system');
            $this->fail('未対応の表示方法を保存できません。');
        } catch (HttpException $exception) {
            $this->assertSame(422, $exception->getStatusCode());
        }
        $this->assertDatabaseCount('fourmix_intelligence_ui_preferences', 0);
        Http::assertNothingSent();
    }
}
