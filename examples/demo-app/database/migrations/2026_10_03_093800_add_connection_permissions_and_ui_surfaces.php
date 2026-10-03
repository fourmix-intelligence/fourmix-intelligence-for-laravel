<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('fourmix_intelligence_connections')) {
            return;
        }
        if (! Schema::hasColumn('fourmix_intelligence_connections', 'permissions')) {
            Schema::table('fourmix_intelligence_connections', function (Blueprint $table): void {
                $table->text('permissions')->nullable();
                $table->unsignedInteger('revision')->default(1);
            });
            DB::table('fourmix_intelligence_connections')->update(['permissions' => '{}']);
        }
        if (Schema::hasColumn('fourmix_intelligence_agent_bindings', 'allowed_operations')) {
            Schema::table('fourmix_intelligence_agent_bindings', function (Blueprint $table): void {
                $table->dropColumn('allowed_operations');
            });
        }
        if (! Schema::hasTable('fourmix_intelligence_ui_surfaces')) {
            Schema::create('fourmix_intelligence_ui_surfaces', function (Blueprint $table): void {
                $table->string('subject', 128);
                $table->string('name', 64);
                $table->boolean('enabled')->default(true);
                $table->timestamps();
                $table->primary(['subject', 'name'], 'fi_ui_surface_pk');
            });
        }
    }

    public function down(): void
    {
        throw new LogicException('接続の許可とチャット設定を保持するため、自動で巻き戻せません。');
    }
};
