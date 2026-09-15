<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Support\Facades\Cache;

final class NativeBridgeTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('fourmix-intelligence.bridge.enabled', true);
        $app['config']->set('fourmix-intelligence.bridge.secret', str_repeat('s', 32));
        $app['config']->set('fourmix-intelligence.bridge.enabled_operations', ['orders.lookup']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->app->make(ToolRegistry::class)->register(new NativeBridgeFixture);
    }

    public function test_it_exposes_and_executes_only_enabled_registered_operations(): void
    {
        $manifest = $this->signed('GET', '/fourmix-intelligence/v1/manifest');
        self::assertSame(200, $manifest->status(), $manifest->getContent());
        $manifest->assertJsonPath('protocol', 'fourmix-laravel/1.0')->assertJsonCount(1, 'capabilities');
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.lookup', ['arguments' => ['number' => 'A-1']])
            ->assertOk()->assertJsonPath('data.number', 'A-1');
        $this->signed('POST', '/fourmix-intelligence/v1/actions/orders.cancel', ['arguments' => ['number' => 'A-1']])
            ->assertForbidden();
    }

    public function test_it_rejects_replayed_requests(): void
    {
        $nonce = 'fixed-nonce';
        $this->signed('GET', '/fourmix-intelligence/v1/manifest', [], $nonce)->assertOk();
        $this->signed('GET', '/fourmix-intelligence/v1/manifest', [], $nonce)->assertForbidden();
    }

    private function signed(string $method, string $path, array $body = [], ?string $nonce = null)
    {
        $timestamp = (string) time();
        $nonce ??= fake()->uuid();
        $raw = $body === [] ? '' : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $canonical = implode("\n", [$timestamp, $nonce, $method, $path, 'workspace-1', 'connection-1', hash('sha256', $raw)]);
        $headers = [
            'X-Fourmix-Timestamp' => $timestamp,
            'X-Fourmix-Nonce' => $nonce,
            'X-Fourmix-Workspace' => 'workspace-1',
            'X-Fourmix-Connection' => 'connection-1',
            'X-Fourmix-Signature' => 'v1='.hash_hmac('sha256', $canonical, str_repeat('s', 32)),
        ];

        $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];
        foreach ($headers as $name => $value) $server['HTTP_'.strtoupper(str_replace('-', '_', $name))] = $value;

        return $this->call($method, $path, [], [], [], $server, $raw);
    }
}

final class NativeBridgeFixture
{
    #[FourmixIntelligenceTool(name: 'orders.lookup', description: '注文を確認します', inputSchema: [
        'type' => 'object', 'properties' => ['number' => ['type' => 'string']], 'required' => ['number'],
    ], domain: 'orders', keywords: ['注文'])]
    public function lookup(string $number): array { return ['number' => $number]; }

    #[FourmixIntelligenceTool(name: 'orders.cancel', description: '注文を取消します', requiresApproval: true, readOnly: false, inputSchema: [
        'type' => 'object', 'properties' => ['number' => ['type' => 'string']], 'required' => ['number'],
    ])]
    public function cancel(string $number): array { return ['number' => $number]; }
}
