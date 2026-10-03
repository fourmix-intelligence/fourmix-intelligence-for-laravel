<?php

namespace FourmixIntelligence\Laravel\Tests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

final class InitialMigrationTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('database.connections.webhook_testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('fourmix-intelligence.webhooks.database_connection', 'webhook_testing');
    }

    public function test_business_and_webhook_publish_tags_share_one_initial_migration(): void
    {
        $business = ServiceProvider::pathsToPublish(null, 'fourmix-intelligence-business');
        $webhooks = ServiceProvider::pathsToPublish(null, 'fourmix-intelligence-webhooks');
        $this->assertSame($business, $webhooks);
        $this->assertCount(1, $business);

        $migration = require array_key_first($business);
        $migration->up();

        foreach (['fourmix_intelligence_tool_subjects', 'fourmix_intelligence_connections', 'fourmix_intelligence_agent_bindings', 'fourmix_intelligence_ui_surfaces', 'fourmix_intelligence_tool_actions', 'fourmix_intelligence_user_bindings'] as $table) {
            $this->assertTrue(Schema::hasTable($table));
        }
        $this->assertTrue(Schema::hasColumns('fourmix_intelligence_connections', ['permissions', 'revision']));
        $this->assertFalse(Schema::hasTable('fourmix_intelligence_tool_permissions'));
        $this->assertFalse(Schema::hasColumn('fourmix_intelligence_agent_bindings', 'allowed_operations'));
        $this->assertFalse(Schema::hasTable('fourmix_intelligence_webhook_receipts'));
        $this->assertTrue(Schema::connection('webhook_testing')->hasTable('fourmix_intelligence_webhook_receipts'));

        $migration->down();

        $this->assertFalse(Schema::hasTable('fourmix_intelligence_tool_actions'));
        $this->assertFalse(Schema::connection('webhook_testing')->hasTable('fourmix_intelligence_webhook_receipts'));
    }

    public function test_rollback_retains_webhook_receipts_and_business_schema(): void
    {
        $migration = require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php';
        $migration->up();
        DB::connection('webhook_testing')->table('fourmix_intelligence_webhook_receipts')->insert([
            'id' => str_repeat('a', 64), 'payload_hash' => str_repeat('b', 64), 'status' => 'unknown_effect',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        try {
            $migration->down();
            $this->fail('Webhook の受領履歴がある状態で削除されました。');
        } catch (\LogicException $error) {
            $this->assertSame('実行履歴を保持する必要があります。連携を停止してから移行方針を確認してください。', $error->getMessage());
        }

        $this->assertSame('unknown_effect', DB::connection('webhook_testing')->table('fourmix_intelligence_webhook_receipts')->value('status'));
        $this->assertTrue(Schema::hasTable('fourmix_intelligence_tool_actions'));
    }
}
