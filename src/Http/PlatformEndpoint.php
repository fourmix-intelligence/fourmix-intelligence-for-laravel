<?php

namespace FourmixIntelligence\Laravel\Http;

/** Configuration URLs never accept credentials, redirects or unencrypted remote transport. */
final class PlatformEndpoint
{
    public static function trusted(string $url): string
    {
        $normalized = self::validate($url);
        $host = strtolower((string) parse_url($normalized, PHP_URL_HOST));
        $local = app()->environment(['local', 'testing']) && in_array($host, ['localhost', '127.0.0.1', 'host.docker.internal'], true);
        $allowed = array_map(static fn (string $endpoint): string => rtrim($endpoint, '/'),
            array_values(array_filter((array) config('fourmix-intelligence.native.trusted_platform_urls', []), 'is_string')));
        abort_unless($local || in_array($normalized, $allowed, true), 422, 'このFourmix Intelligenceの接続先は許可されていません。管理者に確認してください。');

        return $normalized;
    }

    public static function validate(string $url): string
    {
        $parts = parse_url($url);
        $local = app()->environment(['local', 'testing']) && in_array(strtolower((string) ($parts['host'] ?? '')),
            ['localhost', '127.0.0.1', 'host.docker.internal'], true);
        abort_unless(is_array($parts) && isset($parts['host'], $parts['scheme'])
            && array_intersect(array_keys($parts), ['user', 'pass', 'query', 'fragment']) === []
            && ($parts['scheme'] === 'https' || ($local && $parts['scheme'] === 'http')), 422, '接続先URLを確認してください。');

        return rtrim($url, '/');
    }
}
