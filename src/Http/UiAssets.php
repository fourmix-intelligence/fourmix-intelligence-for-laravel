<?php

namespace FourmixIntelligence\Laravel\Http;

/** Version the actual published or packaged content, including host customizations. */
final class UiAssets
{
    public function path(string $asset): string
    {
        $brand = in_array($asset, ['brand-icon.png', 'brand-wordmark.svg'], true);
        abort_unless($brand || in_array($asset, ['sdk.js', 'sdk.css'], true) || preg_match('/^[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]{6,}\.js$/D', $asset) === 1, 404);
        $published = public_path('vendor/fourmix-intelligence/'.$asset);
        clearstatcache(true, $published);
        $path = is_file($published) ? $published : __DIR__.'/../../resources/'.($brand ? 'brand/' : 'dist/').$asset;
        clearstatcache(true, $path);
        abort_unless(is_file($path), 404);

        return $path;
    }

    public function version(string $asset): string
    {
        $version = hash_file('sha256', $this->path($asset));
        abort_unless(is_string($version), 503);

        return $version;
    }

    public function url(string $asset): string
    {
        return route('fourmix-intelligence.assets', ['asset' => $asset, 'v' => $this->version($asset)]);
    }
}
