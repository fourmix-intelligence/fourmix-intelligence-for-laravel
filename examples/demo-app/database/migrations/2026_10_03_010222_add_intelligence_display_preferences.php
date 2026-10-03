<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('fourmix_intelligence_agent_bindings', 'display_name')) {
            Schema::table('fourmix_intelligence_agent_bindings', function (Blueprint $table): void {
                $table->string('display_name', 200)->default('AIアシスタント');
            });
        }
        if (! Schema::hasTable('fourmix_intelligence_ui_preferences')) {
            Schema::create('fourmix_intelligence_ui_preferences', function (Blueprint $table): void {
                $table->string('subject', 128)->primary();
                $table->string('chat_entry', 16)->default('floating');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fourmix_intelligence_ui_preferences');
        Schema::table('fourmix_intelligence_agent_bindings', function (Blueprint $table): void {
            $table->dropColumn('display_name');
        });
    }
};
