<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;

final class SafeCliErrorTest extends TestCase
{
    /** @return array<string, array{string, string, string}> */
    public static function failures(): array
    {
        $cases = [];
        foreach (['doctor', 'sync'] as $command) {
            foreach (['detail' => 'type=api, status=401', 'message' => 'type=api, status=403',
                'non-json' => 'type=api, status=200', 'connection' => 'type=connection',
                'unexpected' => 'type=unexpected', 'missing-token' => 'type=api, status=unknown',
                'invalid-status' => 'type=api, status=unknown'] as $failure => $expected) {
                $cases[$command.' '.$failure] = [$command, $failure, $expected];
            }
        }
        $cases['sync invalid response id'] = ['sync', 'invalid-id', 'type=unexpected'];

        return $cases;
    }

    #[DataProvider('failures')]
    public function test_failures_return_safe_category_without_reporting_or_rendering_sensitive_values(string $command, string $failure, string $expected): void
    {
        Http::preventStrayRequests();
        config(['fourmix-intelligence.url' => 'https://example.test', 'fourmix-intelligence.dataset' => '10000000-0000-4000-8000-000000000001',
            'fourmix-intelligence.token' => $failure === 'missing-token' ? null : 'synthetic-private-token',
            'fourmix-intelligence.sync_token' => $failure === 'missing-token' ? null : 'synthetic-private-token',
            'fourmix-intelligence.retry' => ['times' => 1, 'sleep_ms' => 0]]);
        $url = $command === 'doctor' ? 'https://example.test/api/v3/ai/plugins/metadata'
            : 'https://example.test/api/v3/data/10000000-0000-4000-8000-000000000001/documents/sync';
        $calls = 0;
        Http::fake([$url => function () use ($failure, &$calls) {
            $calls++;

            return match ($failure) {
                'detail' => Http::response(['detail' => 'synthetic-private-error'], 401, ['X-Request-Id' => 'synthetic-private-header']),
                'message' => Http::response(['message' => 'synthetic-private-error'], 403, ['X-Request-Id' => 'synthetic-private-header']),
                'non-json' => Http::response('<html>synthetic-private-error</html>', 200, ['X-Request-Id' => 'synthetic-private-header']),
                'connection' => throw new ConnectionException('synthetic-private-error synthetic-private-token synthetic-private-header'),
                'unexpected' => throw new \RuntimeException('synthetic-private-error synthetic-private-token synthetic-private-header'),
                'invalid-status' => throw new ApiException('synthetic-private-error', -1, 'synthetic-private-header'),
                'invalid-id' => Http::response(['id' => ['synthetic-private-error']], 202),
            };
        }]);
        $file = $command === 'sync' ? tempnam(sys_get_temp_dir(), 'fi-safe-cli-') : null;
        if ($command === 'sync') {
            $this->assertNotFalse($file);
            file_put_contents($file, '{"records":[{"key":"synthetic","text":"synthetic"}]}');
        }
        Exceptions::fake();
        $parameters = $command === 'sync' ? ['file' => $file] : [];
        $name = $command === 'doctor' ? 'fourmix-intelligence:doctor' : 'fourmix-intelligence:knowledge:sync';

        try {
            $this->artisan($name, $parameters)->expectsOutputToContain($expected)
                ->doesntExpectOutputToContain('synthetic-private-error')
                ->doesntExpectOutputToContain('synthetic-private-token')
                ->doesntExpectOutputToContain('synthetic-private-header')
                ->doesntExpectOutputToContain('RuntimeException')->doesntExpectOutputToContain('ConnectionException')
                ->doesntExpectOutputToContain('Array to string conversion')->assertExitCode(1);
            Exceptions::assertNothingReported();
            $this->assertSame($failure === 'missing-token' ? 0 : 1, $calls);
            if ($failure === 'missing-token') {
                Http::assertNothingSent();
            }
        } finally {
            if (is_string($file)) {
                unlink($file);
            }
        }
    }

    public function test_doctor_success_remains_success_without_printing_response_body(): void
    {
        Http::preventStrayRequests();
        config(['fourmix-intelligence.url' => 'https://example.test', 'fourmix-intelligence.token' => 'synthetic-private-token']);
        Http::fake(['https://example.test/api/v3/ai/plugins/metadata' => Http::response(['plugins' => [], 'private' => 'synthetic-private-body'])]);

        $this->artisan('fourmix-intelligence:doctor')->doesntExpectOutputToContain('synthetic-private-body')->assertExitCode(0);
        Http::assertSentCount(1);
    }

    public function test_invalid_local_json_retains_invalid_input_exit_code_without_outputting_file_content(): void
    {
        Http::preventStrayRequests();
        config(['fourmix-intelligence.dataset' => '10000000-0000-4000-8000-000000000001']);
        $file = tempnam(sys_get_temp_dir(), 'fi-safe-cli-');
        $this->assertNotFalse($file);
        file_put_contents($file, '{"synthetic-private-body":');

        try {
            $this->artisan('fourmix-intelligence:knowledge:sync', ['file' => $file])
                ->doesntExpectOutputToContain('synthetic-private-body')->assertExitCode(2);
            Http::assertNothingSent();
        } finally {
            unlink($file);
        }
    }
}
