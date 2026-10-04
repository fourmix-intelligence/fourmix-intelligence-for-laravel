<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\AgentSelection;
use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\FourmixIntelligenceManager;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use GuzzleHttp\Psr7\PumpStream;
use Illuminate\Auth\GenericUser;
use Illuminate\Database\RecordNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use PHPUnit\Framework\AssertionFailedError;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class StudioAgentTest extends TestCase
{
    private string $local;

    private string $remote;

    private string $binding;

    private string $grant;

    private bool $granted = true;

    private mixed $grantName = 'アプリ秘書';

    private string $audience = 'internal';

    /** @var array<string, mixed> */
    private array $chatPayload = [];

    private string|\Psr\Http\Message\StreamInterface|null $streamBody = null;

    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('s', 32)));
        $app['config']->set('app.timezone', 'Asia/Tokyo');
        $app['config']->set('fourmix-intelligence.ui.surfaces.page.alias', 'sales-assistant');
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://platform.example.test']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        $this->local = (string) Str::uuid();
        $this->remote = (string) Str::uuid();
        $this->binding = (string) Str::uuid();
        $this->grant = (string) Str::uuid();
        DB::table('fourmix_intelligence_connections')->insert(['id' => $this->local, 'subject' => 'user:1', 'name' => '合成アプリ',
            'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic', 'scope' => 'personal',
            'host_mode' => 'user', 'remote_connection' => $this->remote, 'workspace_id' => '', 'secret' => Crypt::encryptString(str_repeat('s', 64)),
            'state' => 'ready', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('fourmix_intelligence_user_bindings')->insert(['id' => $this->binding, 'subject' => 'user:1', 'display_name' => '合成利用者',
            'workspace_id' => '', 'connection_id' => $this->remote, 'remote_user' => (string) Str::uuid(), 'created_at' => now(), 'updated_at' => now()]);
        Http::preventStrayRequests();
        Http::fake(function ($request) {
            if (($request['stream'] ?? false) && $this->streamBody !== null) {
                return Http::response($this->streamBody, 200, ['Content-Type' => 'application/x-ndjson']);
            }
            if (str_ends_with($request->url(), '/agents')) {
                return Http::response(['agents' => $this->granted ? [['grant_id' => $this->grant, 'slug' => 'product-advisor', 'audience' => $this->audience, 'identify' => 'ai-1', 'name' => $this->grantName, 'scope' => 'personal', 'dataset_ids' => ['fixture'], 'private_token' => 'must-never-be-shared']] : []]);
            }
            if (str_ends_with($request->url(), '/agent_history')) {
                if (! isset($request['conversation_id'])) {
                    return Http::response(['conversations' => [['identify' => '11111111-1111-4111-8111-111111111111', 'title' => '合成会話']]]);
                }

                return Http::response(['messages' => [['role' => 'assistant', 'content' => '履歴の応答']]]);
            }

            return Http::response($this->chatPayload + ['run_id' => 'synthetic-run', 'plugin' => 'studio', 'conversation_id' => '11111111-1111-4111-8111-111111111111', 'result' => ['answer' => '承知しました。']]);
        });
    }

    public function test_connection_lists_only_its_authorized_agents_without_selecting_or_running_them(): void
    {
        $agents = app(FourmixIntelligenceManager::class)->connection('合成アプリ')->forUser(new ToolContext('user:1'))->agents();
        self::assertSame([$this->grant], array_column($agents, 'grant_id'));
        self::assertArrayNotHasKey('private_token', $agents[0]);
        self::assertSame(0, DB::table('fourmix_intelligence_agent_bindings')->count());
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/agents'));
        $this->granted = false;
        self::assertSame([], app(FourmixIntelligenceManager::class)->connection($this->local)->forUser(new ToolContext('user:1'))->agents());
    }

    public function test_connection_agent_listing_uses_current_account_and_rejects_another_account(): void
    {
        $this->actingAs(new GenericUser(['id' => 1]));
        app('request')->setUserResolver(fn () => auth()->user());
        self::assertCount(1, app(FourmixIntelligenceManager::class)->connection('合成アプリ')->agents());
        $this->actingAs(new GenericUser(['id' => 2]));
        try {
            app(FourmixIntelligenceManager::class)->connection($this->local)->agents();
            self::fail('別の利用者の接続を利用できません。');
        } catch (RecordNotFoundException $exception) {
            Http::assertSentCount(1);
        }
    }

    public function test_connection_agent_listing_requires_an_authenticated_owner_without_implicit_fallback(): void
    {
        app('request')->setUserResolver(fn () => null);
        try {
            app(FourmixIntelligenceManager::class)->connection($this->local)->agents();
            self::fail('本人がいない一覧取得は拒否する必要があります。');
        } catch (HttpException $exception) {
            self::assertSame(401, $exception->getStatusCode());
            Http::assertNothingSent();
        }
    }

    private function select(): void
    {
        $this->actingAs(new GenericUser(['id' => 1]))->putJson(route('fourmix-intelligence.agents.select', 'sales-assistant'),
            ['connection_id' => $this->local, 'grant_id' => $this->grant])->assertOk();
    }

    public function test_standard_agent_selection_rejects_customer_ai_without_replacing_the_current_ai(): void
    {
        $this->select();
        $previous = $this->grant;
        $this->audience = 'customer';
        $this->grant = (string) Str::uuid();

        $this->putJson(route('fourmix-intelligence.agents.select', 'sales-assistant'), [
            'connection_id' => $this->local, 'grant_id' => $this->grant,
        ])->assertUnprocessable();
        $this->assertDatabaseHas('fourmix_intelligence_agent_bindings', ['alias' => 'sales-assistant', 'grant_id' => $previous]);

        app(AgentSelection::class)->select(new ToolContext('user:1'), 'customer-assistant', $this->local, $this->grant);
        $result = app(FourmixIntelligenceManager::class)->agent('customer-assistant')
            ->forUser(new ToolContext('user:1'))->forVisitor('verified-customer')->ask('商品についての相談');
        self::assertSame('承知しました。', $result->answer);
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat') && $request['visitor_id'] === 'verified-customer');
    }

    public function test_native_stream_delivers_events_in_order_with_the_same_signed_owner_and_selection(): void
    {
        $this->select();
        $conversation = (string) Str::uuid();
        $events = [
            ['type' => 'run.created', 'data' => ['conversation_id' => $conversation]],
            ['type' => 'run.status', 'data' => ['phase' => 'planning', 'message' => '考えています']],
            ['type' => 'assistant.delta', 'data' => ['text' => '承知しました。']],
            ['type' => 'run.completed', 'data' => ['conversation_id' => $conversation, 'result' => ['answer' => '承知しました。']]],
        ];
        $this->streamBody = implode("\n", array_map(fn (array $event): string => json_encode($event, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $events))."\n";
        $received = [];
        $result = app(FourmixIntelligenceManager::class)->agent('sales-assistant')->forUser(new ToolContext('user:1'))->stream('合成の相談', function (array $event) use (&$received): void {
            $received[] = $event;
        });
        self::assertSame($events, $received);
        self::assertSame('承知しました。', $result->answer);
        self::assertSame($conversation, $result->conversationId);
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat') && $request['stream'] === true
            && $request['binding_id'] === $this->binding && $request['grant_id'] === $this->grant
            && str_starts_with($request->header('X-Fourmix-Signature')[0], 'v1='));
    }

    public function test_a_short_event_is_delivered_before_requesting_the_next_network_chunk(): void
    {
        $this->select();
        $delivered = false;
        $chunks = [
            "{\"type\":\"run.status\",\"data\":{\"phase\":\"planning\"}}\n",
            "{\"type\":\"run.completed\",\"data\":{\"result\":{\"answer\":\"完了\"}}}\n",
        ];
        $this->streamBody = new PumpStream(function (int $length) use (&$chunks, &$delivered): string|false {
            if (count($chunks) === 1) {
                self::assertTrue($delivered, '短いイベントも後続データを待たずに通知する必要があります。');
            }

            return array_shift($chunks) ?? false;
        });
        $result = app(FourmixIntelligenceManager::class)->agent('sales-assistant')->forUser(new ToolContext('user:1'))->stream('合成の相談', function (array $event) use (&$delivered): void {
            if ($event['type'] === 'run.status') {
                $delivered = true;
            }
        });
        self::assertSame('完了', $result->answer);
    }

    #[TestWith(['{"type":"run.completed","data":{"result":{"answer":"途中"}}}'])]
    #[TestWith(["{\"type\":\"assistant.delta\",\"data\":{\"text\":\"途中\"}}\n"])]
    #[TestWith(["{\"type\":\"run.failed\",\"data\":{}}\n"])]
    #[TestWith(["not-json\n"])]
    public function test_incomplete_or_failed_stream_never_retries_a_business_request(string $body): void
    {
        $this->select();
        $this->streamBody = $body;
        $before = count(Http::recorded());
        try {
            app(FourmixIntelligenceManager::class)->agent('sales-assistant')->forUser(new ToolContext('user:1'))->stream('合成の相談', static function (array $event): void {});
            self::fail('完了を確認できない応答は拒否される必要があります。');
        } catch (\Throwable $error) {
            self::assertNotInstanceOf(AssertionFailedError::class, $error);
        }
        $sent = Http::recorded()->slice($before)->filter(fn (array $record): bool => str_ends_with($record[0]->url(), '/agent_chat'));
        self::assertCount(1, $sent);
    }

    public function test_doctor_checks_paired_configuration_without_environment_credentials_or_secrets(): void
    {
        $this->artisan('fi:doctor')->expectsOutputToContain('接続済み: 1')->doesntExpectOutputToContain('user:1')->assertSuccessful();
        Http::assertNothingSent();
        $this->artisan('fi:doctor', ['--connection' => $this->local])->expectsOutputToContain('利用できるAI: 1')
            ->doesntExpectOutputToContain(str_repeat('s', 64))->assertSuccessful();
        Http::assertSentCount(1);
    }

    public function test_named_connection_calls_a_visible_ai_without_creating_a_local_ui_binding(): void
    {
        $agent = app(FourmixIntelligenceManager::class)->connection('合成アプリ')->forUser(new ToolContext('user:1'))->agent('product-advisor');
        $first = $agent->ask('相談');
        $agent->conversation($first->conversationId)->ask('続き');
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
        self::assertSame('承知しました。', $first->answer);
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat') && ($request['conversation_id'] ?? null) === $first->conversationId
            && $request['binding_id'] === $this->binding && $request['grant_id'] === $this->grant && ! isset($request['allowed_operations'], $request['host_agent_alias']));
    }

    public function test_customer_visitors_are_sent_independently_of_the_authorization_owner(): void
    {
        $this->audience = 'customer';
        $agent = app(FourmixIntelligenceManager::class)->connection($this->local)->forUser(new ToolContext('user:1'))->agent($this->grant);
        $agent->forVisitor('visitor-a')->ask('商品相談');
        $agent->forVisitor('visitor-b')->conversations();
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat') && $request['visitor_id'] === 'visitor-a' && $request['binding_id'] === $this->binding);
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_history') && $request['visitor_id'] === 'visitor-b');
        $this->expectException(HttpException::class);
        $agent->ask('利用者未指定');
    }

    public function test_internal_ai_cannot_be_repurposed_for_a_visitor(): void
    {
        $this->expectException(HttpException::class);
        app(FourmixIntelligenceManager::class)->connection($this->local)->forUser(new ToolContext('user:1'))->agent($this->grant)->forVisitor('visitor-a')->ask('不可');
    }

    public function test_customer_file_api_keeps_visitor_and_conversation_boundaries_and_fluent_instances_immutable(): void
    {
        $this->audience = 'customer';
        $id = '11111111-1111-4111-8111-111111111111';
        $attachment = (string) Str::uuid();
        $requestId = (string) Str::uuid();
        $agent = app(FourmixIntelligenceManager::class)->connection($this->local)
            ->forUser(new ToolContext('user:1'))->agent($this->grant)->forVisitor('visitor-a');
        $agent->upload(UploadedFile::fake()->createWithContent('question.txt', '合成の商品相談'), $requestId);
        $agent->files();
        $conversation = $agent->conversation($id);
        $conversation->file($attachment);
        $conversation->deleteFile($attachment);
        $conversation->attachments([$attachment])->ask('添付を確認');
        $agent->ask('別の会話');

        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachment_upload')
            && $request['visitor_id'] === 'visitor-a' && $request['request_id'] === $requestId
            && $request['file']['name'] === 'question.txt' && base64_decode($request['file']['content_base64']) === '合成の商品相談');
        foreach (['agent_attachment_content', 'agent_attachment_delete'] as $action) {
            Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/'.$action)
                && $request['conversation_id'] === $id && $request['attachment_id'] === $attachment
                && $request['visitor_id'] === 'visitor-a' && $request['binding_id'] === $this->binding);
        }
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat')
            && $request['message'] === '添付を確認' && $request['attachment_ids'] === [$attachment] && $request['conversation_id'] === $id);
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat')
            && $request['message'] === '別の会話' && ! isset($request['attachment_ids'], $request['conversation_id']));
    }

    public function test_file_contents_require_an_explicit_conversation_before_any_platform_request(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        try {
            app(FourmixIntelligenceManager::class)->connection($this->local)->forUser(new ToolContext('user:1'))
                ->agent($this->grant)->file((string) Str::uuid());
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_duplicate_connection_names_require_the_local_connection_id(): void
    {
        $row = (array) DB::table('fourmix_intelligence_connections')->where('id', $this->local)->first();
        $row['id'] = (string) Str::uuid();
        $row['remote_connection'] = (string) Str::uuid();
        DB::table('fourmix_intelligence_connections')->insert($row);
        $this->expectException(HttpException::class);
        app(FourmixIntelligenceManager::class)->connection('合成アプリ')->forUser(new ToolContext('user:1'))->agent($this->grant)->ask('曖昧な接続');
    }

    public function test_page_selection_and_facade_use_the_owned_studio_grant_without_environment_credentials(): void
    {
        $this->select();
        $this->getJson(route('fourmix-intelligence.agents', ['connection_id' => $this->local]))->assertOk()->assertJsonPath('agents.0.dataset_ids.0', 'fixture')->assertJsonMissing(['private_token' => 'must-never-be-shared']);
        $this->get(route('fourmix-intelligence.chat', ['surface' => 'page', 'alias' => 'sales-assistant']))->assertOk()->assertSee('fourmix-intelligence-chat')->assertSee('sales-assistant');
        $this->postJson(route('fourmix-intelligence.chat.send'), ['surface' => 'page', 'alias' => 'sales-assistant', 'message' => '合成の相談'])->assertOk()->assertJsonPath('result.answer', '承知しました。');
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat') && $request['binding_id'] === $this->binding && $request['grant_id'] === $this->grant && ! isset($request['allowed_operations'], $request['host_agent_alias']) && $request->header('X-Fourmix-Workspace') === ['']);
        $result = app(FourmixIntelligenceManager::class)->agent('sales-assistant')->forUser(new ToolContext('user:1'))->ask('追加の相談');
        self::assertSame('承知しました。', $result->answer);
    }

    public function test_synchronous_browser_chat_only_returns_display_fields_while_php_retains_the_full_result(): void
    {
        $this->select();
        $this->chatPayload = [
            'customer_token' => 'synthetic-private-token',
            'events' => [['type' => 'tool.started', 'data' => ['arguments' => ['internal_note' => 'service-only']]]],
            'result' => ['answer' => '内容を確認してください。', 'data' => ['run_outcome' => 'confirmation_required', 'internal_note' => 'service-only']],
        ];

        $this->postJson(route('fourmix-intelligence.chat.send'), ['surface' => 'page', 'message' => '合成の依頼'])
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private')
            ->assertExactJson(['run_id' => 'synthetic-run', 'plugin' => 'studio',
                'conversation_id' => '11111111-1111-4111-8111-111111111111',
                'result' => ['answer' => '内容を確認してください。', 'data' => ['run_outcome' => 'confirmation_required']]]);

        $result = app(FourmixIntelligenceManager::class)->agent('sales-assistant')->forUser(new ToolContext('user:1'))->ask('サーバーで処理');
        self::assertSame($this->chatPayload['events'], $result->raw['events']);
        self::assertSame('synthetic-private-token', $result->customerToken);
    }

    public function test_revoked_platform_grant_prevents_the_next_run(): void
    {
        $this->select();
        $this->granted = false;
        $this->postJson(route('fourmix-intelligence.chat.send'), ['surface' => 'page', 'alias' => 'sales-assistant', 'message' => '実行しない'])->assertForbidden();
        Http::assertNotSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat'));
    }

    public function test_removing_a_local_ai_selection_does_not_change_another_users_selection(): void
    {
        $this->select();
        $this->actingAs(new GenericUser(['id' => 2]))->deleteJson(route('fourmix-intelligence.agents.remove', 'sales-assistant'))->assertOk();
        $this->assertDatabaseHas('fourmix_intelligence_agent_bindings', ['subject' => 'user:1', 'alias' => 'sales-assistant']);
        $this->actingAs(new GenericUser(['id' => 1]))->deleteJson(route('fourmix-intelligence.agents.remove', 'sales-assistant'))->assertOk();
        $this->postJson(route('fourmix-intelligence.chat.send'), ['surface' => 'page', 'alias' => 'sales-assistant', 'message' => '利用解除後'])->assertNotFound();
        Http::assertNotSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat'));
    }

    public function test_alias_and_connections_are_isolated_between_users_even_with_shared_manager(): void
    {
        $this->select();
        app(FourmixIntelligenceManager::class);
        $this->actingAs(new GenericUser(['id' => 2]))->postJson(route('fourmix-intelligence.chat.send'), ['surface' => 'page', 'alias' => 'sales-assistant', 'message' => '別の利用者'])->assertNotFound();
        $this->getJson(route('fourmix-intelligence.agents', ['connection_id' => $this->local]))->assertNotFound();
        $this->getJson(route('fourmix-intelligence.state'))->assertJsonCount(0, 'agents');
        Http::assertNotSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat'));
    }

    public function test_history_requires_the_same_current_grant_and_binding(): void
    {
        $this->select();
        $this->postJson(route('fourmix-intelligence.history'), ['surface' => 'page', 'alias' => 'sales-assistant'])->assertOk()->assertJsonPath('conversations.0.title', '合成会話');
        $id = '11111111-1111-4111-8111-111111111111';
        $this->postJson(route('fourmix-intelligence.history'), ['surface' => 'page', 'alias' => 'sales-assistant', 'conversation_id' => $id])->assertOk()->assertJsonPath('messages.0.content', '履歴の応答');
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_history') && ($request['conversation_id'] ?? null) === $id && $request['binding_id'] === $this->binding);
        DB::table('fourmix_intelligence_connections')->where('id', $this->local)->update(['state' => 'revoked']);
        $this->postJson(route('fourmix-intelligence.history'), ['surface' => 'page', 'alias' => 'sales-assistant', 'conversation_id' => $id])->assertForbidden();
    }

    public function test_ai_aliases_only_choose_existing_fi_grants_and_never_inject_host_capabilities(): void
    {
        app(ToolRegistry::class)->register(new StudioGenericToolFixture);
        app(AgentSelection::class)->select(new ToolContext('user:1'), 'researcher', $this->local, $this->grant);
        app(AgentSelection::class)->select(new ToolContext('user:1'), 'operator', $this->local, $this->grant);
        $manager = app(FourmixIntelligenceManager::class);
        $manager->agent('researcher')->forUser(new ToolContext('user:1'))->ask('会話のみ');
        $manager->agent('operator')->forUser(new ToolContext('user:1'))->ask('Studioの許可範囲');
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat') && ! isset($request['host_agent_alias'], $request['allowed_operations']));
        $this->actingAs(new GenericUser(['id' => 1]))->getJson(route('fourmix-intelligence.state'))->assertJsonCount(2, 'agents');
    }

    public function test_browser_cannot_inject_identity_or_widen_operations(): void
    {
        $this->select();
        $this->postJson(route('fourmix-intelligence.chat.send'), ['surface' => 'page', 'alias' => 'sales-assistant', 'message' => '相談', 'binding_id' => 'another-user', 'grant_id' => (string) Str::uuid(), 'allowed_operations' => ['*']])->assertOk();
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat') && $request['binding_id'] === $this->binding && $request['grant_id'] === $this->grant && ! isset($request['allowed_operations'], $request['host_agent_alias']));
        $this->putJson(route('fourmix-intelligence.agents.select', 'sales-assistant'), ['connection_id' => $this->local, 'grant_id' => $this->grant, 'allowed_operations' => ['*']])->assertUnprocessable();
    }

    public function test_a_chat_window_snapshot_cannot_send_a_draft_to_a_reconfigured_ai_or_load_its_files(): void
    {
        $this->select();
        $expected = ['connection_id' => $this->local, 'grant_id' => $this->grant, 'connection_revision' => 1];
        DB::table('fourmix_intelligence_agent_bindings')->where('alias', 'sales-assistant')->update(['grant_id' => (string) Str::uuid()]);
        $input = ['surface' => 'page', 'expected_selection' => $expected];
        $this->postJson(route('fourmix-intelligence.chat.send'), $input + ['message' => '送信前の草稿'])->assertStatus(409);
        $this->postJson(route('fourmix-intelligence.history'), $input)->assertStatus(409);
        $this->getJson(route('fourmix-intelligence.attachments.index', $input))->assertStatus(409);
        Http::assertSentCount(1);
        Http::assertNotSent(fn ($request): bool => str_ends_with($request->url(), '/agent_chat'));
    }

    public function test_changing_the_ui_selection_during_catalog_verification_does_not_send_the_message(): void
    {
        $this->select();
        Http::fake(function ($request) {
            if (str_ends_with($request->url(), '/agents')) {
                DB::table('fourmix_intelligence_agent_bindings')->where('alias', 'sales-assistant')->update(['grant_id' => (string) Str::uuid()]);

                return Http::response(['agents' => [['grant_id' => $this->grant, 'audience' => 'internal']]]);
            }

            self::fail('再設定中の草稿は送信しません。');
        });
        $this->postJson(route('fourmix-intelligence.chat.send'), ['surface' => 'page', 'message' => '草稿'])->assertStatus(409);
    }

    #[TestWith(['select'])]
    #[TestWith(['call'])]
    public function test_a_late_catalog_response_cannot_cross_a_reconnected_generation(string $action): void
    {
        Http::fake(function ($request) {
            if (str_ends_with($request->url(), '/agents')) {
                DB::table('fourmix_intelligence_connections')->where('id', $this->local)->update(['revision' => 2]);
                DB::table('fourmix_intelligence_agent_bindings')->delete();

                return Http::response(['agents' => [['grant_id' => $this->grant, 'audience' => 'internal']]]);
            }

            self::fail('旧接続世代では実行しません。');
        });
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('接続が更新されました');
        try {
            if ($action === 'select') {
                app(AgentSelection::class)->select(new ToolContext('user:1'), 'late-assistant', $this->local, $this->grant);
            } else {
                app(AgentSelection::class)->callConnection(new ToolContext('user:1'), $this->local, $this->grant, 'agent_chat', ['message' => '旧世代']);
            }
        } finally {
            $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 0);
            Http::assertSentCount(1);
        }
    }

    public function test_generic_approval_routes_deny_another_user_and_require_acknowledgement(): void
    {
        $id = (string) Str::uuid();
        $this->actingAs(new GenericUser(['id' => 1]))->getJson(route('fourmix-intelligence.actions.show', $id))->assertNotFound();
        $this->postJson(route('fourmix-intelligence.actions.confirm', $id), [])->assertUnprocessable();
        $this->postJson(route('fourmix-intelligence.actions.confirm', $id), ['acknowledge' => true])->assertNotFound();
    }

    public function test_host_can_override_the_published_chat_component(): void
    {
        $path = sys_get_temp_dir().'/fourmix-sdk-view-'.Str::uuid();
        mkdir($path.'/components', 0777, true);
        file_put_contents($path.'/components/chat.blade.php', '<section>カスタムチャット</section>');
        try {
            app('view')->prependNamespace('fourmix-intelligence', $path);
            $this->actingAs(new GenericUser(['id' => 1]))->get(route('fourmix-intelligence.chat'))
                ->assertOk()->assertSee('カスタムチャット')->assertDontSee('fourmix-intelligence-chat');
        } finally {
            unlink($path.'/components/chat.blade.php');
            rmdir($path.'/components');
            rmdir($path);
        }
    }

    public function test_inertia_hosts_navigate_to_package_pages_without_treating_html_as_an_error(): void
    {
        $this->actingAs(new GenericUser(['id' => 1]));
        foreach (['fourmix-intelligence.manage', 'fourmix-intelligence.chat'] as $name) {
            $this->get(route($name), ['X-Inertia' => 'true'])->assertStatus(409)->assertHeader('X-Inertia-Location', route($name));
        }
    }

    public function test_studio_display_name_comes_from_the_verified_grant_and_state_needs_no_additional_platform_request(): void
    {
        $this->actingAs(new GenericUser(['id' => 1]))->putJson(route('fourmix-intelligence.agents.select', 'assistant'), [
            'connection_id' => $this->local, 'grant_id' => $this->grant,
            'display_name' => '偽の表示名', 'name' => '入力から権限を広げない',
        ])->assertOk();
        $this->getJson(route('fourmix-intelligence.state'))->assertOk()->assertJsonPath('agents.0.alias', 'assistant')
            ->assertJsonPath('agents.0.name', 'アプリ秘書')->assertJsonMissingPath('agents.0.allowed_operations');
        $this->assertDatabaseHas('fourmix_intelligence_agent_bindings', ['subject' => 'user:1', 'alias' => 'assistant', 'display_name' => 'アプリ秘書']);
        Http::assertSentCount(1);
        $this->actingAs(new GenericUser(['id' => 2]))->getJson(route('fourmix-intelligence.state'))->assertJsonCount(0, 'agents');
        Http::assertSentCount(1);
    }

    #[TestWith(['   ', 'AIアシスタント'])]
    #[TestWith([null, 'AIアシスタント'])]
    #[TestWith([['unexpected' => 'object'], 'AIアシスタント'])]
    #[TestWith(['  確認アシスタント  ', '確認アシスタント'])]
    public function test_display_names_are_normalized_without_changing_the_alias_or_permissions(mixed $name, string $expected): void
    {
        $this->grantName = $name;
        app(AgentSelection::class)->select(new ToolContext('user:1'), 'assistant', $this->local, $this->grant);
        $selection = app(AgentSelection::class)->selections(new ToolContext('user:1'))[0];
        $this->assertSame($expected, $selection['name']);
        $this->assertSame('assistant', $selection['alias']);
        $this->assertArrayNotHasKey('allowed_operations', $selection);
        Http::assertSentCount(1);
    }

    public function test_display_name_refresh_keeps_one_selection_and_bounds_multibyte_name_length(): void
    {
        $this->select();
        $this->grantName = str_repeat('あ', 201);
        app(AgentSelection::class)->select(new ToolContext('user:1'), 'sales-assistant', $this->local, $this->grant);
        $this->assertDatabaseCount('fourmix_intelligence_agent_bindings', 1);
        $selection = app(AgentSelection::class)->selections(new ToolContext('user:1'))[0];
        $this->assertSame(str_repeat('あ', 200), $selection['name']);
        $this->assertArrayNotHasKey('allowed_operations', $selection);
    }

    #[TestWith(['https://127.0.0.1:8443'])]
    #[TestWith(['https://10.0.0.1'])]
    #[TestWith(['https://169.254.169.254'])]
    #[TestWith(['https://previously-custom.example.test'])]
    public function test_existing_ready_connection_cannot_call_an_untrusted_platform(string $url): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        DB::table('fourmix_intelligence_connections')->where('id', $this->local)->update(['platform_url' => $url]);
        $this->actingAs(new GenericUser(['id' => 1]))->getJson(route('fourmix-intelligence.agents', ['connection_id' => $this->local]))->assertUnprocessable();
        $this->assertDatabaseHas('fourmix_intelligence_connections', ['id' => $this->local, 'state' => 'ready']);
        Http::assertNothingSent();
    }

    public function test_existing_ready_connection_can_call_an_explicitly_trusted_self_hosted_platform(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        config(['fourmix-intelligence.native.trusted_platform_urls' => ['https://self-hosted.example.test']]);
        DB::table('fourmix_intelligence_connections')->where('id', $this->local)->update(['platform_url' => 'https://self-hosted.example.test']);
        $this->actingAs(new GenericUser(['id' => 1]))->getJson(route('fourmix-intelligence.agents', ['connection_id' => $this->local]))->assertOk();
        Http::assertSent(fn ($request) => str_starts_with($request->url(), 'https://self-hosted.example.test/api/v3/native/laravel/'));
        Http::assertSentCount(1);
    }
}

final class StudioGenericToolFixture
{
    #[FourmixIntelligenceTool(name: 'inventory.lookup', description: '在庫を確認します', scopes: ['inventory:read'])]
    public function lookup(): array
    {
        return ['items' => []];
    }
}
