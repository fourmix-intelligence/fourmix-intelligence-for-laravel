<?php

namespace FourmixIntelligence\Laravel\Tests;

use Illuminate\Support\Facades\Http;

final class KnowledgeSyncCommandTest extends TestCase
{
    public function test_it_displays_the_real_sync_response_id(): void
    {
        $this->assertDisplayedJob(['id' => '10000000-0000-4000-8000-000000000002', 'status' => 'queued']);
    }

    public function test_it_retains_the_legacy_job_id_fallback(): void
    {
        $this->assertDisplayedJob(['job_id' => '10000000-0000-4000-8000-000000000002', 'status' => 'queued']);
    }

    /** @param array<string, mixed> $response */
    private function assertDisplayedJob(array $response): void
    {
        Http::preventStrayRequests();
        config([
            'fourmix-intelligence.url' => 'https://example.test',
            'fourmix-intelligence.dataset' => '10000000-0000-4000-8000-000000000001',
            'fourmix-intelligence.sync_token' => 'fmsync.synthetic-test-key',
        ]);
        Http::fake(['example.test/*' => Http::response($response, 202)]);
        $file = tempnam(sys_get_temp_dir(), 'fourmix-contract-');
        self::assertNotFalse($file);
        file_put_contents($file, json_encode(['records' => [
            ['key' => 'synthetic-guide', 'version' => 1, 'operation' => 'replace', 'text' => '合成の案内文'],
        ]], JSON_THROW_ON_ERROR));

        try {
            $this->artisan('fourmix-intelligence:knowledge:sync', ['file' => $file, '--key' => 'synthetic-idempotency-key'])
                ->expectsOutputToContain('ジョブ: 10000000-0000-4000-8000-000000000002')
                ->assertExitCode(0);
            Http::assertSentCount(1);
        } finally {
            unlink($file);
        }
    }
}
