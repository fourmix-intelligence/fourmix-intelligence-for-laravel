<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\Http\UiAssets;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class AssetController
{
    public function __invoke(Request $request, string $asset, UiAssets $assets): BinaryFileResponse
    {
        $type = match (pathinfo($asset, PATHINFO_EXTENSION)) {
            'js' => 'text/javascript',
            'png' => 'image/png',
            'svg' => 'image/svg+xml',
            default => 'text/css',
        };
        $response = response()->file($assets->path($asset), ['Content-Type' => $type,
            'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'public, no-cache, max-age=0, must-revalidate']);
        $response->setEtag($assets->version($asset));
        $response->isNotModified($request);

        return $response;
    }
}
