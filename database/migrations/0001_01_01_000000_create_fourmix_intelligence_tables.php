<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 連携パッケージの初期構造。Webhook を利用する導入先が明示的に公開・適用する。
return new class extends Migration
{
    public function up(): void
    {
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
        Schema::connection(config('fourmix-intelligence.webhooks.database_connection'))->dropIfExists('fourmix_intelligence_webhook_receipts');
    }
};
