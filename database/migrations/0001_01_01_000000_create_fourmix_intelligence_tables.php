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
        Schema::create('fourmix_intelligence_tool_subjects', function (Blueprint $table): void {
            $table->string('subject', 128)->primary();
            $table->timestamp('created_at');
        });
        Schema::create('fourmix_intelligence_tool_permissions', function (Blueprint $table): void {
            $table->string('subject', 128);
            $table->string('operation', 128);
            $table->string('mode', 16);
            $table->string('definition_hash', 64);
            $table->timestamp('updated_at');
            $table->primary(['subject', 'operation'], 'fi_tool_permission_pk');
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
        if (DB::table('fourmix_intelligence_tool_actions')->exists()
            || DB::table('fourmix_intelligence_tool_permissions')->exists()
            || DB::table('fourmix_intelligence_user_bindings')->exists()
            || DB::connection(config('fourmix-intelligence.webhooks.database_connection'))->table('fourmix_intelligence_webhook_receipts')->exists()) {
            throw new LogicException('実行履歴を保持する必要があります。連携を停止してから移行方針を確認してください。');
        }
        foreach (['fourmix_intelligence_user_bindings', 'fourmix_intelligence_tool_actions', 'fourmix_intelligence_tool_permissions', 'fourmix_intelligence_tool_subjects'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::connection(config('fourmix-intelligence.webhooks.database_connection'))->dropIfExists('fourmix_intelligence_webhook_receipts');
    }
};
