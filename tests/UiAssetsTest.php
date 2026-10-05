<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Http\UiAssets;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Auth\GenericUser;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class UiAssetsTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
    }

    public function test_pages_version_assets_and_unchanged_content_can_be_revalidated(): void
    {
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        app(UiSurfaces::class)->save(new ToolContext('user:1'), 'page', true);
        $assets = app(UiAssets::class);
        $url = $assets->url('sdk.js');
        self::assertStringContainsString('v='.$assets->version('sdk.js'), $url);
        $response = $this->get($url)->assertOk()->assertHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, public');
        $etag = $response->headers->get('ETag');
        self::assertSame('"'.$assets->version('sdk.js').'"', $etag);
        $this->get($url, ['If-None-Match' => $etag])->assertStatus(304);
        $this->actingAs(new GenericUser(['id' => 1]))->get(route('fourmix-intelligence.chat'))
            ->assertOk()->assertSee($url, false)->assertSee($assets->url('sdk.css'), false);
    }

    public function test_official_brand_assets_are_served_and_displayed_as_images(): void
    {
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        app(UiSurfaces::class)->save(new ToolContext('user:1'), 'page', true);
        $assets = app(UiAssets::class);
        $page = $this->actingAs(new GenericUser(['id' => 1]))->get(route('fourmix-intelligence.chat'))->assertOk();
        foreach (['brand-icon.png' => 'image/png', 'brand-wordmark.svg' => 'image/svg+xml'] as $name => $mime) {
            $page->assertSee($assets->url($name), false);
            $response = $this->get($assets->url($name))->assertOk()->assertHeader('Content-Type', $mime)->assertHeader('X-Content-Type-Options', 'nosniff');
            $this->get($assets->url($name), ['If-None-Match' => $response->headers->get('ETag')])->assertStatus(304);
        }
        $this->get(route('fourmix-intelligence.assets', 'unregistered.svg'))->assertNotFound();
    }

    public function test_published_content_changes_the_url_and_invalidates_an_old_etag(): void
    {
        $file = public_path('vendor/fourmix-intelligence/sdk.js');
        $original = is_file($file) ? file_get_contents($file) : null;
        if (! is_dir(dirname($file))) {
            mkdir(dirname($file), 0777, true);
        }
        try {
            file_put_contents($file, 'console.log("synthetic-version-one");');
            $assets = app(UiAssets::class);
            $oldUrl = $assets->url('sdk.js');
            $first = $this->get($oldUrl)->assertOk();
            self::assertSame($file, $first->baseResponse->getFile()->getPathname());
            $oldEtag = $first->headers->get('ETag');
            file_put_contents($file, 'console.log("synthetic-version-two");');
            $newUrl = $assets->url('sdk.js');
            self::assertNotSame($oldUrl, $newUrl);
            $next = $this->get($oldUrl, ['If-None-Match' => $oldEtag])->assertOk();
            self::assertNotSame($oldEtag, $next->headers->get('ETag'));
            self::assertSame('"'.hash_file('sha256', $file).'"', $next->headers->get('ETag'));
            $this->get(route('fourmix-intelligence.assets', 'sdk.js'))->assertHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, public');
        } finally {
            if (is_string($original)) {
                file_put_contents($file, $original);
            } else {
                unlink($file);
            }
        }
    }

    public function test_install_guides_to_the_management_page_without_provisioning_or_migration(): void
    {
        Http::preventStrayRequests();
        $this->artisan('fi:install', ['--no-interaction' => true])
            ->expectsOutputToContain('管理画面で設定してください。')
            ->doesntExpectOutputToContain('環境変数へ接続情報')
            ->assertExitCode(0);
        self::assertFalse(Schema::hasTable('fourmix_intelligence_connections'));
        Http::assertNothingSent();
    }

    public function test_hashed_lazy_chunks_are_served_from_actual_assets_and_revalidated(): void
    {
        $name = 'diagram-Synthetic123.js';
        $file = public_path('vendor/fourmix-intelligence/'.$name);
        if (! is_dir(dirname($file))) {
            mkdir(dirname($file), 0777, true);
        }
        $original = is_file($file) ? file_get_contents($file) : null;
        try {
            file_put_contents($file, 'export const diagram = "synthetic";');
            $assets = app(UiAssets::class);
            $response = $this->get($assets->url($name))->assertOk()
                ->assertHeader('Content-Type')
                ->assertHeader('X-Content-Type-Options', 'nosniff');
            self::assertSame('text/javascript', explode(';', $response->headers->get('Content-Type'))[0]);
            self::assertSame($file, $response->baseResponse->getFile()->getPathname());
            self::assertSame('"'.hash_file('sha256', $file).'"', $response->headers->get('ETag'));
            $this->get($assets->url($name), ['If-None-Match' => $response->headers->get('ETag')])->assertStatus(304);
            $this->get(route('fourmix-intelligence.assets', 'missing-Synthetic123.js'))->assertNotFound();
        } finally {
            if (is_string($original)) {
                file_put_contents($file, $original);
            } else {
                unlink($file);
            }
        }
    }

    public function test_asset_delivery_rejects_traversal_and_arbitrary_files_even_when_published(): void
    {
        $file = public_path('vendor/fourmix-intelligence/arbitrary.js');
        if (! is_dir(dirname($file))) {
            mkdir(dirname($file), 0777, true);
        }
        $original = is_file($file) ? file_get_contents($file) : null;
        try {
            file_put_contents($file, 'throw new Error("must not be served");');
            $this->get(route('fourmix-intelligence.assets', 'arbitrary.js'))->assertNotFound();
            foreach (['../sdk.js', '/sdk.js', '%2e%2e/sdk.js', 'diagram-Synthetic123.js/../../sdk.js', 'diagram-short.js', 'diagram-Synthetic123.js.map', 'LICENSE.mermaid.txt', 'diagram-Synthetic123.js?x=1'] as $name) {
                try {
                    app(UiAssets::class)->path($name);
                    self::fail('許可されていない資源を取得しました。');
                } catch (HttpExceptionInterface $exception) {
                    self::assertSame(404, $exception->getStatusCode());
                }
            }
        } finally {
            if (is_string($original)) {
                file_put_contents($file, $original);
            } else {
                unlink($file);
            }
        }
    }
}
