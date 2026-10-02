<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Console\DoctorCommand;
use FourmixIntelligence\Laravel\Console\InstallCommand;
use FourmixIntelligence\Laravel\Console\KnowledgeSyncCommand;
use FourmixIntelligence\Laravel\Http\Controllers\NativeBridgeController;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use FourmixIntelligence\Laravel\Tools\DenyToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

final class FourmixIntelligenceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if (! $this->app->configurationIsCached()) {
            $defaults = require __DIR__.'/../config/fourmix-intelligence.php';
            $configuration = $this->app->make(Repository::class);
            $configured = (array) $configuration->get('fourmix-intelligence', []);
            foreach ($configured as $key => $value) {
                $defaults[$key] = is_array($value) && is_array($defaults[$key] ?? null)
                    ? array_replace($defaults[$key], $value) : $value;
            }
            $configuration->set('fourmix-intelligence', $defaults);
        }
        $this->app->singleton(FourmixIntelligenceClient::class, fn ($app) => new FourmixIntelligenceClient($app->make(Factory::class), (array) $app['config']->get('fourmix-intelligence', [])));
        $this->app->singleton(FourmixIntelligenceManager::class, fn ($app) => new FourmixIntelligenceManager($app->make(FourmixIntelligenceClient::class), $app['config']->get('fourmix-intelligence.agent')));
        $this->app->alias(FourmixIntelligenceManager::class, 'fourmix-intelligence');
        $this->app->singleton(ToolRegistry::class);
        $this->app->bindIf(ToolPolicy::class, DenyToolPolicy::class);
    }

    public function boot(): void
    {
        $this->publishes([__DIR__.'/../config/fourmix-intelligence.php' => config_path('fourmix-intelligence.php')], 'fourmix-intelligence-config');
        $this->publishes([__DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php' => database_path('migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')], 'fourmix-intelligence-business');
        $this->publishes([__DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php' => database_path('migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')], 'fourmix-intelligence-webhooks');
        $registry = $this->app->make(ToolRegistry::class);
        foreach ((array) config('fourmix-intelligence.bridge.tool_handlers', []) as $handler) {
            if (is_string($handler) && class_exists($handler)) {
                $registry->register($handler);
            }
        }
        if ((bool) config('fourmix-intelligence.bridge.enabled', false)) {
            Route::prefix('fourmix-intelligence/v1')->group(function (): void {
                Route::get('manifest', [NativeBridgeController::class, 'manifest']);
                Route::post('receipts/{requestId}', [NativeBridgeController::class, 'receipt'])->whereUuid('requestId');
                Route::post('bindings/{action}', [NativeBridgeController::class, 'binding'])->where('action', 'preview|claim|context|revoke');
                Route::post('actions/{operation}', [NativeBridgeController::class, 'execute'])->where('operation', '[a-z][a-z0-9_.-]{2,127}');
            });
        }
        if ($this->app->runningInConsole()) {
            $this->commands([InstallCommand::class, DoctorCommand::class, KnowledgeSyncCommand::class]);
        }
    }
}
