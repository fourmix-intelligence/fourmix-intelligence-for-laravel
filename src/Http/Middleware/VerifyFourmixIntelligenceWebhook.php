<?php

namespace FourmixIntelligence\Laravel\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class VerifyFourmixIntelligenceWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('fourmix-intelligence.webhooks.secret', '');
        $timestamp = (string) $request->header('X-Fourmix-Intelligence-Timestamp', '');
        $signature = (string) $request->header('X-Fourmix-Intelligence-Signature', '');
        $tolerance = (int) config('fourmix-intelligence.webhooks.tolerance_seconds', 300);
        if ($secret === '' || !ctype_digit($timestamp) || abs(time() - (int) $timestamp) > $tolerance) abort(401);
        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);
        if (!hash_equals($expected, $signature)) abort(401);
        return $next($request);
    }
}

