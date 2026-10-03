<?php

namespace FourmixIntelligence\Laravel\Tests;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

final class InstallPublicationTest extends TestCase
{
    private string $scratch;

    protected function defineEnvironment($app): void
    {
        $this->scratch = sys_get_temp_dir().'/fi-install-'.Str::uuid();
        foreach (['app', 'config', 'database/migrations', 'public', 'resources'] as $path) {
            mkdir($this->scratch.'/'.$path, 0777, true);
        }
        $app->setBasePath($this->scratch);
        $app->useConfigPath($this->scratch.'/config');
        $app->useDatabasePath($this->scratch.'/database');
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
    }

    protected function tearDown(): void
    {
        app('files')->deleteDirectory($this->scratch);
        parent::tearDown();
    }

    public function test_install_publishes_fresh_structure_without_running_migrations_or_connecting(): void
    {
        Http::preventStrayRequests();
        $this->artisan('fi:install', ['--with-migration' => true, '--no-interaction' => true])->assertSuccessful();
        self::assertFileExists($this->scratch.'/config/fourmix-intelligence.php');
        self::assertFileExists($this->scratch.'/database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php');
        self::assertFalse(Schema::hasTable('fourmix_intelligence_connections'));
        Http::assertNothingSent();
    }

    public function test_force_only_replaces_configuration_and_never_an_existing_migration(): void
    {
        file_put_contents($this->scratch.'/config/fourmix-intelligence.php', '<?php return [];');
        $migration = $this->scratch.'/database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php';
        file_put_contents($migration, '<?php // 既存の増分に依存する履歴');
        $this->artisan('fi:install', ['--with-migration' => true, '--force' => true])->assertSuccessful();
        self::assertSame('<?php // 既存の増分に依存する履歴', file_get_contents($migration));
        self::assertNotSame('<?php return [];', file_get_contents($this->scratch.'/config/fourmix-intelligence.php'));
        self::assertFalse(Schema::hasTable('fourmix_intelligence_connections'));
    }

    public function test_publishable_stubs_preserve_project_customizations(): void
    {
        $this->artisan('vendor:publish', ['--tag' => 'fourmix-intelligence-stubs'])->assertSuccessful();
        $tool = $this->scratch.'/stubs/fi.tool.stub';
        self::assertFileExists($tool);
        self::assertFileExists($this->scratch.'/stubs/fi.policy.stub');
        file_put_contents($tool, '<?php // アプリケーションのテンプレート');
        $this->artisan('vendor:publish', ['--tag' => 'fourmix-intelligence-stubs'])->assertSuccessful();
        self::assertSame('<?php // アプリケーションのテンプレート', file_get_contents($tool));
    }
}
