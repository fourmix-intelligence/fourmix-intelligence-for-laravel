<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** 業務連携と Webhook の初期構造。導入先が明示的に公開・適用する。 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fourmix_intelligence_connections', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('subject', 128);
            $table->string('name', 100);
            $table->string('platform_url', 2048);
            $table->string('ui_url', 2048);
            $table->string('tenant', 128);
            $table->string('scope', 16);
            $table->string('host_mode', 16)->default('user');
            $table->text('permissions')->default(DB::raw("('{}')"));
            $table->unsignedInteger('revision')->default(1);
            $table->string('remote_connection', 128)->nullable()->unique();
            $table->string('workspace_id', 128)->default('');
            $table->text('secret')->nullable();
            $table->string('state', 16)->default('pending');
            $table->string('code_hash', 64)->nullable()->unique();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['subject', 'state'], 'fi_connection_owner_index');
        });
        Schema::create('fourmix_intelligence_agent_bindings', function (Blueprint $table): void {
            $table->string('subject', 128);
            $table->string('alias', 128);
            $table->string('connection_id', 128);
            $table->uuid('grant_id');
            $table->string('display_name', 200)->default('AIアシスタント');
            $table->timestamps();
            $table->primary(['subject', 'alias'], 'fi_agent_binding_pk');
            $table->index('connection_id');
        });
        Schema::create('fourmix_intelligence_tool_subjects', function (Blueprint $table): void {
            $table->string('subject', 128)->primary();
            $table->timestamp('created_at');
        });
        Schema::create('fourmix_intelligence_ui_preferences', function (Blueprint $table): void {
            $table->string('subject', 128)->primary();
            $table->string('chat_entry', 16)->default('floating');
            $table->timestamps();
        });
        Schema::create('fourmix_intelligence_ui_surfaces', function (Blueprint $table): void {
            $table->string('subject', 128);
            $table->string('name', 64);
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            $table->primary(['subject', 'name'], 'fi_ui_surface_pk');
        });
        Schema::create('fourmix_intelligence_tool_actions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('subject', 128);
            $table->uuid('request_id');
            $table->string('operation', 128);
            $table->string('payload_hash', 64);
            $table->string('state', 32);
            $table->string('channel', 32);
            $table->string('authorization', 16)->nullable();
            $table->mediumText('payload');
            $table->mediumText('result')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['subject', 'request_id'], 'fi_tool_request_unique');
            $table->index(['subject', 'state', 'created_at'], 'fi_tool_review_index');
        });
        Schema::create('fourmix_intelligence_user_bindings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('subject', 128);
            $table->string('display_name', 100);
            $table->string('workspace_id', 128);
            $table->string('connection_id', 128);
            $table->string('remote_user', 128)->nullable();
            $table->string('code_hash', 64)->nullable()->unique();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['subject', 'connection_id'], 'fi_binding_subject_index');
            $table->unique(['connection_id', 'remote_user'], 'fi_binding_remote_unique');
        });
        Schema::connection(config('fourmix-intelligence.webhooks.database_connection'))->create('fourmix_intelligence_webhook_receipts', function (Blueprint $table): void {
            $table->string('id', 64)->primary();
            $table->string('payload_hash', 64);
            $table->string('status', 16);
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->mediumText('response_body')->nullable();
            $table->string('content_type')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (DB::table('fourmix_intelligence_agent_bindings')->exists()
            || DB::table('fourmix_intelligence_connections')->exists()
            || DB::table('fourmix_intelligence_tool_actions')->exists()
            || DB::table('fourmix_intelligence_user_bindings')->exists()
            || DB::connection(config('fourmix-intelligence.webhooks.database_connection'))->table('fourmix_intelligence_webhook_receipts')->exists()) {
            throw new LogicException('実行履歴を保持する必要があります。連携を停止してから移行方針を確認してください。');
        }
        foreach (['fourmix_intelligence_ui_surfaces', 'fourmix_intelligence_ui_preferences', 'fourmix_intelligence_agent_bindings', 'fourmix_intelligence_connections', 'fourmix_intelligence_user_bindings', 'fourmix_intelligence_tool_actions', 'fourmix_intelligence_tool_subjects'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::connection(config('fourmix-intelligence.webhooks.database_connection'))->dropIfExists('fourmix_intelligence_webhook_receipts');
    }
};
