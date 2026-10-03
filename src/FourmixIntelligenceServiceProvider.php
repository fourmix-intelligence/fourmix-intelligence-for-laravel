<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Console\DoctorCommand;
use FourmixIntelligence\Laravel\Console\InstallCommand;
use FourmixIntelligence\Laravel\Console\KnowledgeSyncCommand;
use FourmixIntelligence\Laravel\Console\MakePolicyCommand;
use FourmixIntelligence\Laravel\Console\MakeToolCommand;
use FourmixIntelligence\Laravel\Console\MakeUiCommand;
use FourmixIntelligence\Laravel\Console\ToolsCommand;
use FourmixIntelligence\Laravel\Http\Controllers\AssetController;
use FourmixIntelligence\Laravel\Http\Controllers\AttachmentController;
use FourmixIntelligence\Laravel\Http\Controllers\ConnectionHandshakeController;
use FourmixIntelligence\Laravel\Http\Controllers\ManagementController;
use FourmixIntelligence\Laravel\Http\Controllers\NativeBridgeController;
use FourmixIntelligence\Laravel\Http\Controllers\SurfaceController;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use FourmixIntelligence\Laravel\Tools\AuthenticatedIntegrationAccess;
use FourmixIntelligence\Laravel\Tools\BoundUserToolPolicy;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
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
        $this->app->bindIf(ToolPolicy::class, BoundUserToolPolicy::class);
        $this->app->bindIf(IntegrationAccess::class, AuthenticatedIntegrationAccess::class);
    }

    public function boot(): void
    {
        Route::post('fourmix-intelligence/v1/handshake', ConnectionHandshakeController::class)->middleware('throttle:6,1');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'fourmix-intelligence');
        $this->callAfterResolving('blade.compiler', function ($blade): void {
            $blade->componentNamespace('FourmixIntelligence\\Laravel\\View\\Components', 'fourmix-intelligence');
            $blade->anonymousComponentNamespace('fourmix-intelligence::components', 'fourmix-intelligence');
        });
        $this->publishes([__DIR__.'/../resources/views' => resource_path('views/vendor/fourmix-intelligence')], 'fourmix-intelligence-views');
        $this->publishes([__DIR__.'/../stubs/tool.stub' => base_path('stubs/fi.tool.stub'),
            __DIR__.'/../stubs/policy.stub' => base_path('stubs/fi.policy.stub')], 'fourmix-intelligence-stubs');
        $this->publishes([__DIR__.'/../resources/dist' => public_path('vendor/fourmix-intelligence'),
            __DIR__.'/../resources/brand' => public_path('vendor/fourmix-intelligence')], 'fourmix-intelligence-assets');
        $this->publishes([__DIR__.'/../resources/js' => resource_path('vendor/fourmix-intelligence/js'),
            __DIR__.'/../resources/css' => resource_path('vendor/fourmix-intelligence/css')], 'fourmix-intelligence-sources');
        Route::prefix((string) config('fourmix-intelligence.ui.prefix', 'fourmix-intelligence'))->name('fourmix-intelligence.')->group(function (): void {
            Route::get('assets/{asset}', AssetController::class)->name('assets');
            Route::middleware((array) config('fourmix-intelligence.ui.middleware', ['web', 'auth']))->group(function (): void {
                Route::get('/', [ManagementController::class, 'index'])->name('manage');
                Route::get('state', [ManagementController::class, 'state'])->name('state');
                Route::get('chat', [SurfaceController::class, 'page'])->name('chat');
                Route::get('agents', [ManagementController::class, 'agents'])->name('agents');
                Route::put('agents/{alias}', [ManagementController::class, 'selectAgent'])->where('alias', '[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}')->name('agents.select');
                Route::delete('agents/{alias}', [ManagementController::class, 'removeAgent'])->where('alias', '[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}')->name('agents.remove');
                Route::post('chat', [ManagementController::class, 'chat'])->middleware('throttle:20,1')->name('chat.send');
                Route::post('history', [ManagementController::class, 'history'])->name('history');
                Route::get('attachments', [AttachmentController::class, 'index'])->name('attachments.index');
                Route::post('attachments', [AttachmentController::class, 'store'])->middleware('throttle:12,1')->name('attachments.store');
                Route::get('attachments/{conversation}/{attachment}/content', [AttachmentController::class, 'show'])->whereUuid('conversation')->whereUuid('attachment')->name('attachments.content');
                Route::delete('attachments/{conversation}/{attachment}', [AttachmentController::class, 'destroy'])->whereUuid('conversation')->whereUuid('attachment')->name('attachments.destroy');
                Route::get('actions/{id}', [ManagementController::class, 'action'])->whereUuid('id')->name('actions.show');
                Route::post('actions/{id}/confirm', [ManagementController::class, 'confirm'])->whereUuid('id')->name('actions.confirm');
                Route::post('actions/{id}/reject', [ManagementController::class, 'reject'])->whereUuid('id')->name('actions.reject');
                Route::post('connections/key', [ManagementController::class, 'issueKey'])->middleware('throttle:6,1')->name('connections.key');
                Route::delete('connections/{id}', [ManagementController::class, 'revoke'])->whereUuid('id')->name('connections.revoke');
                Route::patch('connections/{id}', [ManagementController::class, 'rename'])->whereUuid('id')->name('connections.rename');
                Route::put('connections/{id}/permissions', [ManagementController::class, 'permissions'])->whereUuid('id')->name('connections.permissions');
                Route::put('surfaces/{name}', [SurfaceController::class, 'update'])->where('name', '[a-z][a-z0-9-]{0,63}')->name('surfaces.update');
                Route::put('preferences', [ManagementController::class, 'preferences'])->name('preferences');
            });
        });
        $this->publishes([__DIR__.'/../config/fourmix-intelligence.php' => config_path('fourmix-intelligence.php')], 'fourmix-intelligence-config');
        $this->publishes([__DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php' => database_path('migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')], 'fourmix-intelligence-business');
        $this->publishes([__DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php' => database_path('migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')], 'fourmix-intelligence-webhooks');
        $registry = $this->app->make(ToolRegistry::class);
        foreach ((array) config('fourmix-intelligence.bridge.tool_handlers', []) as $handler) {
            if (is_string($handler) && class_exists($handler)) {
                $registry->register($handler);
            }
        }
        if ((bool) config('fourmix-intelligence.bridge.enabled', true)) {
            Route::prefix('fourmix-intelligence/v1')->group(function (): void {
                Route::get('manifest', [NativeBridgeController::class, 'manifest']);
                Route::post('receipts/{requestId}', [NativeBridgeController::class, 'receipt'])->whereUuid('requestId');
                Route::post('bindings/{action}', [NativeBridgeController::class, 'binding'])->where('action', 'preview|claim|context|revoke');
                Route::post('actions/{operation}', [NativeBridgeController::class, 'execute'])->where('operation', '[a-z][a-z0-9_.-]{2,127}');
            });
        }
        if ($this->app->runningInConsole()) {
            $this->commands([InstallCommand::class, DoctorCommand::class, KnowledgeSyncCommand::class, MakeUiCommand::class,
                MakeToolCommand::class, MakePolicyCommand::class, ToolsCommand::class]);
        }
    }
}
