<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Auth\GenericUser;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class UiSurfaceTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('cache.default', 'array');
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('s', 32)));
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://platform.example.test']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        Http::preventStrayRequests();
    }

    public function test_each_surface_has_an_independent_binding_and_preferences_belong_to_the_user(): void
    {
        [$page, $pageGrant] = $this->connection('ページ用');
        [$floating, $floatingGrant] = $this->connection('側窓用');
        Http::fake(fn () => Http::response(['agents' => [['grant_id' => $pageGrant, 'name' => '確認アシスタント'], ['grant_id' => $floatingGrant, 'name' => '文章アシスタント']]]));
        $this->actingAs(new GenericUser(['id' => 1]));
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'page'), ['enabled' => true, 'connection_id' => $page, 'grant_id' => $pageGrant, 'alias' => 'forged'])
            ->assertOk()->assertJsonPath('surfaces.0.agent_name', '確認アシスタント');
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'floating'), ['enabled' => true, 'connection_id' => $floating, 'grant_id' => $floatingGrant])->assertOk();
        self::assertSame($page, DB::table('fourmix_intelligence_agent_bindings')->where('alias', 'ui-page')->value('connection_id'));
        self::assertSame($floating, DB::table('fourmix_intelligence_agent_bindings')->where('alias', 'ui-floating')->value('connection_id'));
        self::assertFalse(DB::table('fourmix_intelligence_agent_bindings')->where('alias', 'forged')->exists());
        $before = DB::table('fourmix_intelligence_connections')->pluck('permissions')->all();
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'page'), ['enabled' => false])->assertOk();
        $this->get(route('fourmix-intelligence.chat'))->assertNotFound();
        self::assertSame('', Blade::render('<x-fourmix-intelligence::surface name="page" />'));
        self::assertStringContainsString('surface="floating"', Blade::render('<x-fourmix-intelligence::surface name="floating" />'));
        self::assertSame($before, DB::table('fourmix_intelligence_connections')->pluck('permissions')->all());
        self::assertSame(2, DB::table('fourmix_intelligence_agent_bindings')->count());
        $this->actingAs(new GenericUser(['id' => 2]));
        $this->getJson(route('fourmix-intelligence.state'))->assertOk()->assertJsonPath('surfaces.0.enabled', true)->assertJsonPath('surfaces.0.configured', false);
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'floating'), ['enabled' => true, 'connection_id' => $floating, 'grant_id' => $floatingGrant])->assertNotFound();
    }

    public function test_unknown_disabled_or_incomplete_surface_configuration_does_not_request_an_ai(): void
    {
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'page'), ['enabled' => false])->assertUnauthorized();
        $this->actingAs(new GenericUser(['id' => 1]));
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'missing'), ['enabled' => true])->assertNotFound();
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'page'), ['enabled' => true, 'connection_id' => (string) Str::uuid()])->assertUnprocessable();
        config(['fourmix-intelligence.ui.surfaces.page.enabled' => false]);
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'page'), ['enabled' => true])->assertForbidden();
        self::assertSame('', Blade::render('<x-fourmix-intelligence::surface name="page" />'));
        Http::assertNothingSent();
    }

    public function test_system_only_host_configuration_is_used_in_the_management_form_without_granting_a_system_identity(): void
    {
        config(['fourmix-intelligence.ui.host_modes' => ['system']]);
        $this->actingAs(new GenericUser(['id' => 1]));
        $this->get(route('fourmix-intelligence.manage'))->assertOk()
            ->assertSee('name="host_mode" value="system"', false)->assertDontSee('name="host_mode" value="user"', false);
        $this->postJson(route('fourmix-intelligence.connections.key'), ['name' => '合成システム接続', 'modes' => [], 'host_mode' => 'system'])->assertForbidden();
        self::assertSame(0, DB::table('fourmix_intelligence_connections')->count());
        Http::assertNothingSent();
    }

    public function test_standard_surfaces_do_not_bind_customer_agents_without_a_customer_identity(): void
    {
        [$connection, $grant] = $this->connection('合成接続');
        Http::fake(fn () => Http::response(['agents' => [['grant_id' => $grant, 'name' => 'お客様窓口', 'audience' => 'customer']]]));
        $this->actingAs(new GenericUser(['id' => 1]));
        $this->putJson(route('fourmix-intelligence.surfaces.update', 'page'), ['enabled' => true, 'connection_id' => $connection, 'grant_id' => $grant])
            ->assertUnprocessable()->assertJsonPath('message', '標準チャットでは社内向けAIを設定してください。対外向けAIには開発者APIで顧客の識別が必要です。');
        self::assertSame(0, DB::table('fourmix_intelligence_agent_bindings')->count());
    }

    public function test_disabling_a_surface_prevents_its_alias_from_being_resolved_without_affecting_other_surfaces(): void
    {
        $surfaces = app(UiSurfaces::class);
        $one = new ToolContext('user:1');
        $two = new ToolContext('user:2');
        $surfaces->save($one, 'page', false);
        self::assertSame('ui-floating', $surfaces->resolve($one, 'floating'));
        self::assertSame('ui-page', $surfaces->resolve($two, 'page'));
        try {
            $surfaces->resolve($one, 'page');
            self::fail('無効なチャットはAIを解決できません。');
        } catch (HttpException $exception) {
            self::assertSame(404, $exception->getStatusCode());
        }
        Http::assertNothingSent();
    }

    #[TestWith(['page'])]
    #[TestWith(['floating'])]
    public function test_make_ui_generates_customizable_material_without_registering_routes_or_granting_access(string $type): void
    {
        $path = sys_get_temp_dir().'/fi-ui-'.Str::uuid();
        mkdir($path.'/config', 0777, true);
        mkdir($path.'/resources', 0777, true);
        $oldConfig = $this->app->configPath();
        $oldBase = $this->app->basePath();
        $this->app->setBasePath($path);
        $this->app->useConfigPath($path.'/config');
        $routes = count(app('router')->getRoutes());
        try {
            $this->artisan('fi:make-ui', ['name' => 'support', '--type' => $type, '--no-interaction' => true])
                ->expectsOutputToContain('ルートや画面への配置は変更していません。')->assertExitCode(0);
            $definition = require $path.'/config/fi-ui/support.php';
            self::assertSame($type, $definition['type']);
            self::assertSame('ui-support', $definition['alias']);
            self::assertStringContainsString('surface="support"', file_get_contents($path.'/resources/views/components/fi/support.blade.php'));
            self::assertSame($routes, count(app('router')->getRoutes()));
            self::assertSame(0, DB::table('fourmix_intelligence_agent_bindings')->count());
            $original = file_get_contents($path.'/config/fi-ui/support.php');
            $this->artisan('fi:make-ui', ['name' => 'support', '--type' => $type])->assertExitCode(1);
            self::assertSame($original, file_get_contents($path.'/config/fi-ui/support.php'));
            config(['fi-ui.support' => $definition]);
            self::assertSame('ui-support', app(UiSurfaces::class)->resolve(new ToolContext('user:1'), 'support'));
            Http::assertNothingSent();
        } finally {
            $this->app->setBasePath($oldBase);
            $this->app->useConfigPath($oldConfig);
            app('files')->deleteDirectory($path);
        }
    }

    #[TestWith(['../unsafe', 'page'])]
    #[TestWith(['support', 'unsafe'])]
    public function test_make_ui_rejects_unsafe_names_and_types(string $name, string $type): void
    {
        $this->artisan('fi:make-ui', ['name' => $name, '--type' => $type])->assertExitCode(2);
        self::assertSame(0, DB::table('fourmix_intelligence_ui_surfaces')->count());
        Http::assertNothingSent();
    }

    #[TestWith(['page'])]
    #[TestWith(['floating'])]
    #[TestWith(['existing'])]
    public function test_make_ui_does_not_replace_builtin_or_preconfigured_surfaces(string $name): void
    {
        config(['fourmix-intelligence.ui.surfaces.existing' => ['type' => 'page', 'alias' => 'existing-helper']]);
        $before = app(UiSurfaces::class)->definitions();
        $this->artisan('fi:make-ui', ['name' => $name, '--type' => 'page'])->assertExitCode(1);
        self::assertSame($before, app(UiSurfaces::class)->definitions());
        self::assertFileDoesNotExist(resource_path('views/components/fi/'.$name.'.blade.php'));
        Http::assertNothingSent();
    }

    /** @return array{string,string} */
    private function connection(string $name): array
    {
        $id = (string) Str::uuid();
        $remote = (string) Str::uuid();
        DB::table('fourmix_intelligence_connections')->insert(['id' => $id, 'subject' => 'user:1', 'name' => $name,
            'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic', 'scope' => 'personal',
            'host_mode' => 'user', 'remote_connection' => $remote, 'workspace_id' => '', 'secret' => Crypt::encryptString(str_repeat('s', 64)),
            'state' => 'ready', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('fourmix_intelligence_user_bindings')->insert(['id' => (string) Str::uuid(), 'subject' => 'user:1', 'display_name' => '合成利用者',
            'workspace_id' => '', 'connection_id' => $remote, 'remote_user' => (string) Str::uuid(), 'created_at' => now(), 'updated_at' => now()]);

        return [$id, (string) Str::uuid()];
    }
}
