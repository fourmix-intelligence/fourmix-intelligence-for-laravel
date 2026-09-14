<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Console\DoctorCommand;
use FourmixIntelligence\Laravel\Console\InstallCommand;
use FourmixIntelligence\Laravel\Console\KnowledgeSyncCommand;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\ServiceProvider;

final class FourmixIntelligenceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/fourmix-intelligence.php', 'fourmix-intelligence');
        $this->app->singleton(FourmixIntelligenceClient::class, fn ($app) => new FourmixIntelligenceClient($app->make(Factory::class), (array) $app['config']->get('fourmix-intelligence', [])));
        $this->app->singleton(FourmixIntelligenceManager::class, fn ($app) => new FourmixIntelligenceManager($app->make(FourmixIntelligenceClient::class), $app['config']->get('fourmix-intelligence.agent')));
        $this->app->alias(FourmixIntelligenceManager::class, 'fourmix-intelligence');
        $this->app->singleton(ToolRegistry::class);
    }

    public function boot(): void
    {
        $this->publishes([__DIR__.'/../config/fourmix-intelligence.php' => config_path('fourmix-intelligence.php')], 'fourmix-intelligence-config');
        if ($this->app->runningInConsole()) $this->commands([InstallCommand::class, DoctorCommand::class, KnowledgeSyncCommand::class]);
    }
}
