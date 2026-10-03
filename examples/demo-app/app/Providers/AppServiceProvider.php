<?php

namespace App\Providers;

use App\Intelligence\NoteToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ToolPolicy::class, NoteToolPolicy::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('demo-login', fn (Request $request): Limit => Limit::perMinute(6)->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));
    }
}
