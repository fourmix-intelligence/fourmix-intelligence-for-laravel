<?php

namespace Tests\Feature;

use App\Intelligence\NoteToolPolicy;
use App\Models\Note;
use App\Models\User;
use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolExecutor;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class DemoIntegrationTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function beforeRefreshingDatabase(): void
    {
        $this->app['migrator']->path(base_path('vendor/fourmix-intelligence/laravel/database/migrations'));
    }

    public function test_synthetic_accounts_login_and_logout_with_standard_session_authentication(): void
    {
        $this->seed();
        $this->get(route('notes.index'))->assertRedirect(route('login'));
        $this->post(route('login.store'), ['email' => 'alice@example.test', 'password' => 'incorrect'])->assertSessionHasErrors(['email' => 'メールアドレスまたはパスワードが正しくありません。']);
        $this->post(route('login.store'), ['email' => 'alice@example.test', 'password' => 'demo-password'])->assertRedirect(route('notes.index'));
        $this->assertAuthenticatedAs(User::where('email', 'alice@example.test')->firstOrFail());
        $this->post(route('logout'))->assertRedirect(route('login'));
        $this->assertGuest();
        $this->post(route('login.store'), ['email' => 'bob@example.test', 'password' => 'demo-password'])->assertRedirect(route('notes.index'));
        $this->assertAuthenticatedAs(User::where('email', 'bob@example.test')->firstOrFail());
    }

    public function test_each_user_only_sees_their_own_notes_and_foreign_note_ids_return_404(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $own = Note::factory()->for($alice)->create(['title' => '本人の確認用備忘']);
        $foreign = Note::factory()->for($bob)->create(['title' => '他人の非公開備忘']);
        $this->actingAs($alice)->get(route('notes.index'))->assertOk()->assertSee($own->title)->assertDontSee($foreign->title);
        $this->get(route('notes.show', $foreign))->assertNotFound()->assertSee('ページが見つかりません')->assertDontSee($foreign->title)->assertDontSee('Not Found');
        $this->actingAs($bob)->get(route('notes.show', $own))->assertNotFound()->assertSee('ページが見つかりません')->assertDontSee($own->title);
    }

    #[TestWith([403, 'この操作は利用できません'])]
    #[TestWith([404, 'ページが見つかりません'])]
    #[TestWith([419, 'ページの有効期限が切れました'])]
    #[TestWith([429, 'しばらく待ってからお試しください'])]
    #[TestWith([500, '処理を完了できませんでした'])]
    public function test_error_pages_are_japanese_and_do_not_expose_exception_details(int $status, string $heading): void
    {
        config(['app.debug' => false]);
        Route::get('/demo-error-test', fn () => abort($status, 'Internal exception must not appear'));
        $this->get('/demo-error-test')->assertStatus($status)->assertSee($heading)->assertSee('備忘一覧へ戻る')->assertDontSee('Internal exception must not appear');
    }

    public function test_user_content_is_escaped_in_note_pages(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->for($user)->create(['title' => '<script>alert(1)</script>', 'body' => '<img src=x onerror=alert(1)>']);
        $this->actingAs($user)->get(route('notes.show', $note))->assertOk()->assertSee('&lt;script&gt;', false)->assertDontSee('<script>alert(1)</script>', false)->assertDontSee('<img src=x onerror=alert(1)>', false);
    }

    public function test_composer_discovers_the_sdk_with_default_management_ui_and_no_implicit_permissions(): void
    {
        Http::preventStrayRequests();
        $user = User::factory()->create();
        $this->actingAs($user)->get(route('fourmix-intelligence.manage'))->assertOk()->assertViewIs('fourmix-intelligence::manage');
        $this->get(route('fourmix-intelligence.chat'))->assertOk()->assertViewIs('fourmix-intelligence::chat-page');
        $state = $this->getJson(route('fourmix-intelligence.state'))->assertOk();
        $state->assertJsonCount(0, 'connections')->assertJsonCount(2, 'surfaces');
        $this->assertSame(['ui-page', 'ui-floating'], array_column($state->json('surfaces'), 'alias'));
        $this->assertSame([false, false], array_column($state->json('surfaces'), 'configured'));
        $this->assertDatabaseCount('fourmix_intelligence_connections', 0);
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
        Http::assertNothingSent();
    }

    public function test_note_creation_waits_for_owner_approval_and_confirmation_is_idempotent(): void
    {
        $alice = User::factory()->create();
        $context = $this->connected($alice);
        $this->allow($context, ['notes.create' => 'review']);
        $executor = app(ToolExecutor::class);
        $requestId = (string) Str::uuid();
        $arguments = ['title' => '承認後に作成', 'body' => '内容を確認して保存します。'];
        $proposal = $executor->execute($context, 'notes.create', $arguments, $requestId);
        $this->assertSame('confirmation_required', $proposal['state']);
        $this->assertSame('本人の備忘のみ', $proposal['preview']['登録先']);
        $this->assertDatabaseCount('notes', 0);
        $result = $executor->confirm($context, $proposal['id']);
        $this->assertSame('succeeded', $result['state']);
        $this->assertSame('備忘を保存しました。', $result['data']['message']);
        $this->assertDatabaseHas('notes', ['user_id' => $alice->id, ...$arguments]);
        $this->assertSame($result, $executor->confirm($context, $proposal['id']));
        $this->assertSame($result, $executor->execute($context, 'notes.create', $arguments, $requestId));
        $this->assertDatabaseCount('notes', 1);
    }

    public function test_a_user_without_explicit_consent_cannot_create_notes(): void
    {
        $user = User::factory()->create();
        try {
            app(ToolExecutor::class)->execute($this->connected($user), 'notes.create', ['title' => '未許可の操作', 'body' => '保存しない'], (string) Str::uuid());
            $this->fail('利用者の明示的な許可が必要です。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        $this->assertDatabaseCount('notes', 0);
        $this->assertDatabaseCount('fourmix_intelligence_tool_actions', 0);
    }

    public function test_another_user_cannot_inspect_or_approve_a_note_creation(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $context = $this->connected($alice);
        $this->allow($context, ['notes.create' => 'review']);
        $proposal = app(ToolExecutor::class)->execute($context, 'notes.create', ['title' => '本人のみ', 'body' => '承認待ち'], (string) Str::uuid());
        $this->actingAs($bob)->getJson(url('fourmix-intelligence/actions/'.$proposal['id']))->assertNotFound();
        $this->postJson(url('fourmix-intelligence/actions/'.$proposal['id'].'/confirm'), ['acknowledge' => true])->assertNotFound();
        $this->assertDatabaseCount('notes', 0);
    }

    public function test_revoking_permission_blocks_an_existing_proposal(): void
    {
        $user = User::factory()->create();
        $context = $this->connected($user);
        $this->allow($context, ['notes.create' => 'review']);
        $proposal = app(ToolExecutor::class)->execute($context, 'notes.create', ['title' => '撤回後は作成しない', 'body' => '承認待ち'], (string) Str::uuid());
        $local = DB::table('fourmix_intelligence_connections')->where('remote_connection', $context->identity['connection_id'])->value('id');
        app(ConnectionManager::class)->renew($context, $local, []);
        try {
            app(ToolExecutor::class)->confirm($context, $proposal['id']);
            $this->fail('許可を撤回した操作は実行できません。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        $this->assertDatabaseCount('notes', 0);
    }

    public function test_deleted_account_cannot_approve_an_existing_proposal(): void
    {
        $user = User::factory()->create();
        $context = $this->connected($user);
        $this->allow($context, ['notes.create' => 'review']);
        $proposal = app(ToolExecutor::class)->execute($context, 'notes.create', ['title' => '削除済み利用者', 'body' => '承認待ち'], (string) Str::uuid());
        $user->delete();
        try {
            app(ToolExecutor::class)->confirm($context, $proposal['id']);
            $this->fail('削除済みの利用者は実行できません。');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
        $this->assertDatabaseCount('notes', 0);
    }

    public function test_attribute_read_tools_cannot_read_foreign_owner_notes(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $own = Note::factory()->for($alice)->create();
        $foreign = Note::factory()->for($bob)->create();
        $context = $this->connected($alice);
        $this->allow($context, ['notes.list' => 'automatic', 'notes.show' => 'automatic']);
        $result = app(ToolExecutor::class)->execute($context, 'notes.list', ['limit' => 10]);
        $this->assertSame([$own->id], array_column($result['data']['notes'], 'id'));
        $this->expectException(ModelNotFoundException::class);
        app(ToolExecutor::class)->execute($context, 'notes.show', ['id' => $foreign->id]);
    }

    public function test_attribute_schema_rejects_attempts_to_set_another_owner(): void
    {
        $user = User::factory()->create();
        $context = $this->connected($user);
        $this->allow($context, ['notes.create' => 'review']);
        try {
            app(ToolExecutor::class)->execute($context, 'notes.create', ['title' => '不正な所有者', 'body' => 'テスト', 'user_id' => 999], (string) Str::uuid());
            $this->fail('所有者を入力から指定できません。');
        } catch (ValidationException|HttpException $exception) {
            $this->assertDatabaseCount('notes', 0);
            $this->assertDatabaseCount('fourmix_intelligence_tool_actions', 0);
        }
    }

    public function test_binding_identity_is_resolved_by_sdk_instead_of_accepting_a_caller_subject(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $context = $this->connected($alice);
        $identity = [...$context->identity, 'subject' => 'user:'.$bob->id];
        $this->assertSame('user:'.$alice->id, app(NoteToolPolicy::class)->resolve($identity)->subject);
        $alice->delete();
        $this->expectException(HttpException::class);
        app(NoteToolPolicy::class)->resolve($identity);
    }

    public function test_repeated_seeding_keeps_user_created_notes_and_does_not_grant_fi_access(): void
    {
        $this->seed();
        $alice = User::where('email', 'alice@example.test')->firstOrFail();
        Note::factory()->for($alice)->create(['title' => '利用者が追加した備忘']);
        $this->seed();
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('notes', 5);
        $this->assertDatabaseHas('notes', ['user_id' => $alice->id, 'title' => '利用者が追加した備忘']);
        foreach (['fourmix_intelligence_connections', 'fourmix_intelligence_user_bindings', 'fourmix_intelligence_agent_bindings', 'fourmix_intelligence_ui_surfaces'] as $table) {
            $this->assertSame(0, DB::table($table)->count());
        }
    }

    /** @param array<string, string> $modes */
    private function allow(ToolContext $context, array $modes): void
    {
        DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('remote_connection', $context->identity['connection_id'])
            ->update(['permissions' => app(ToolConsent::class)->encode($modes)]);
    }

    /** Tests use synthetic, explicitly bound connections; seeding never creates them. */
    private function connected(User $user): ToolContext
    {
        $remote = (string) Str::uuid();
        $fiUser = (string) Str::uuid();
        $subject = 'user:'.$user->id;
        DB::table('fourmix_intelligence_connections')->insert(['id' => (string) Str::uuid(), 'name' => '合成接続', 'subject' => $subject,
            'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic',
            'scope' => 'personal', 'host_mode' => 'user', 'remote_connection' => $remote, 'workspace_id' => '',
            'secret' => Crypt::encryptString(str_repeat('s', 64)), 'permissions' => '{}', 'revision' => 1, 'state' => 'ready',
            'created_at' => now(), 'updated_at' => now()]);
        DB::table('fourmix_intelligence_user_bindings')->insert(['id' => (string) Str::uuid(), 'subject' => $subject, 'display_name' => '合成利用者',
            'connection_id' => $remote, 'workspace_id' => '', 'remote_user' => $fiUser, 'created_at' => now(), 'updated_at' => now()]);

        return new ToolContext($subject, 'fourmix-intelligence', ['connection_id' => $remote, 'remote_user' => $fiUser, 'workspace_id' => '']);
    }

    public function test_page_and_floating_visibility_are_independent_and_private(): void
    {
        Http::preventStrayRequests();
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $context = new ToolContext('user:'.$alice->id);
        app(UiSurfaces::class)->save($context, 'floating', false);
        $this->actingAs($alice)->get(route('notes.index'))->assertOk()->assertDontSee('<fourmix-floating-chat', false);
        $this->get(route('fourmix-intelligence.chat'))->assertOk()->assertSee('surface="page"', false);
        $this->actingAs($bob)->get(route('notes.index'))->assertOk()->assertSee('surface="floating"', false);
        Http::assertNothingSent();
    }
}
