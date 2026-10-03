<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Tools\BoundUserToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DeveloperCommandsTest extends TestCase
{
    private string $scratch;

    private string $oldBase;

    private string $oldApp;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->scratch = sys_get_temp_dir().'/fi-developer-'.Str::uuid();
        app('files')->ensureDirectoryExists($this->scratch.'/app');
        file_put_contents($this->scratch.'/composer.json', json_encode(['autoload' => ['psr-4' => ['App\\' => 'app/']]], JSON_THROW_ON_ERROR));
        $this->oldBase = $this->app->basePath();
        $this->oldApp = $this->app->path();
        $this->app->setBasePath($this->scratch);
        $this->app->useAppPath($this->scratch.'/app');
    }

    protected function tearDown(): void
    {
        $this->app->setBasePath($this->oldBase);
        $this->app->useAppPath($this->oldApp);
        app('files')->deleteDirectory($this->scratch);
        parent::tearDown();
    }

    public function test_generated_tool_is_reflectable_but_cannot_execute_unimplemented_business_logic(): void
    {
        $name = 'Lookup'.str_replace('-', '', (string) Str::uuid());
        $before = config('fourmix-intelligence.bridge.tool_handlers');
        $this->artisan('fi:make-tool', ['name' => 'Notes/'.$name, '--operation' => 'notes.lookup', '--no-interaction' => true])->assertSuccessful();
        $path = $this->scratch.'/app/Tools/Notes/'.$name.'.php';
        require_once $path;
        $registry = new ToolRegistry($this->app);
        $registry->register('App\\Tools\\Notes\\'.$name);
        $manifest = $registry->manifest();
        self::assertSame('notes.lookup', $manifest[0]['name']);
        self::assertSame(['notes:read'], $manifest[0]['scopes']);
        self::assertTrue($manifest[0]['read_only']);
        self::assertSame($before, config('fourmix-intelligence.bridge.tool_handlers'));
        Http::assertNothingSent();
        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('業務ツールの処理を実装してください。');
        $registry->execute('notes.lookup', [], ['*'], new ToolContext('user:1'));
    }

    #[TestWith(['../Outside', 'notes.lookup'])]
    #[TestWith(['lowercase', 'notes.lookup'])]
    #[TestWith(['Class', 'notes.lookup'])]
    #[TestWith(['SafeTool', "notes.'unsafe"])]
    #[TestWith(['SafeTool', ''])]
    public function test_generator_rejects_unsafe_names_and_operations(string $name, string $operation): void
    {
        $this->artisan('fi:make-tool', ['name' => $name, '--operation' => $operation])->assertExitCode(2);
        self::assertSame([], app('files')->allFiles($this->scratch.'/app'));
        Http::assertNothingSent();
    }

    public function test_generation_uses_custom_stubs_and_preserves_existing_classes(): void
    {
        app('files')->ensureDirectoryExists($this->scratch.'/stubs');
        file_put_contents($this->scratch.'/stubs/fi.tool.stub', '<?php // {{ namespace }} {{ class }} {{ operation }}');
        $this->artisan('fi:make-tool', ['name' => 'App\\Tools\\CustomLookup', '--operation' => 'notes.lookup'])->assertSuccessful();
        $path = $this->scratch.'/app/Tools/CustomLookup.php';
        self::assertSame('<?php // App\\Tools CustomLookup notes.lookup', file_get_contents($path));
        $this->artisan('fi:make-tool', ['name' => 'CustomLookup', '--operation' => 'notes.other'])->assertExitCode(1);
        self::assertSame('<?php // App\\Tools CustomLookup notes.lookup', file_get_contents($path));
    }

    public function test_generated_policy_denies_unimplemented_authorization_and_preview(): void
    {
        $name = 'Policy'.str_replace('-', '', (string) Str::uuid());
        $this->artisan('fi:make-policy', ['name' => $name])->assertSuccessful();
        require_once $this->scratch.'/app/Policies/'.$name.'.php';
        $class = 'App\\Policies\\'.$name;
        $policy = new $class(app(BoundUserToolPolicy::class));
        foreach (['authorize', 'preview'] as $method) {
            try {
                $policy->$method(new ToolContext('user:1'), 'notes.lookup', []);
                self::fail('未実装の認可で業務を許可できません。');
            } catch (HttpException $exception) {
                self::assertSame(403, $exception->getStatusCode());
            }
        }
        Http::assertNothingSent();
    }

    public function test_tools_command_lists_filtered_metadata_without_executing_or_exposing_handlers(): void
    {
        $registry = app(ToolRegistry::class);
        foreach (['notes.lookup', 'notes.hidden'] as $operation) {
            $registry->registerCallback($operation, ['description' => '合成ツール', 'scopes' => ['notes:read'], 'read_only' => true,
                'requires_approval' => false, 'input_schema' => ['type' => 'object', 'properties' => []]], static fn () => throw new \LogicException('実行してはいけません。'));
        }
        config(['fourmix-intelligence.bridge.enabled_operations' => ['notes.lookup']]);
        self::assertSame(0, Artisan::call('fi:tools', ['--json' => true]));
        $tools = json_decode(Artisan::output(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['notes.lookup'], array_column($tools, 'name'));
        self::assertArrayNotHasKey('handler', $tools[0]);
        self::assertArrayNotHasKey('callback', $tools[0]);
        $this->artisan('fi:tools')->expectsOutputToContain('公開候補: 1件。')->assertSuccessful();
        Http::assertNothingSent();
    }

    public function test_tools_command_supports_minimal_callback_definitions(): void
    {
        app(ToolRegistry::class)->registerCallback('notes.minimal', ['read_only' => true, 'input_schema' => ['type' => 'object', 'properties' => []]],
            static fn () => throw new \LogicException('実行してはいけません。'));
        config(['fourmix-intelligence.bridge.enabled_operations' => ['notes.minimal']]);
        $this->artisan('fi:tools')->expectsOutputToContain('notes.minimal')->assertSuccessful();
        Http::assertNothingSent();
    }
}
