<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\FourmixIntelligenceManager;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use Illuminate\Support\Facades\Http;

final class AgentTest extends TestCase
{
    public function test_it_keeps_the_server_conversation_contract(): void
    {
        config(['fourmix-intelligence.url' => 'https://example.test', 'fourmix-intelligence.token' => 'secret']);
        $this->app->forgetInstance(FourmixIntelligenceClient::class);
        $this->app->forgetInstance('fourmix-intelligence');
        Http::fake(['example.test/*' => Http::response([
            'run_id' => 'run-1', 'plugin' => 'sales', 'conversation_id' => 'conversation-1',
            'customer_token' => str_repeat('a', 64), 'conversation_mode' => 'history',
            'result' => ['answer' => '承知しました。', 'data' => ['items' => [['product_url' => '/products/1']]], 'references' => [], 'follow_up_questions' => []],
        ])]);

        $first = $this->app->make(FourmixIntelligenceManager::class)->client()->run('sales', [['role' => 'user', 'content' => '相談したい']]);
        self::assertSame('/products/1', $first->data['items'][0]['product_url']);
        self::assertSame('conversation-1', $first->conversationId);
        self::assertNotNull($first->conversationId);
        self::assertNotNull($first->customerToken);

        $this->app->make(FourmixIntelligenceManager::class)->client()->run('sales', [['role' => 'user', 'content' => '続けて相談したい']], [], $first->conversationId, $first->customerToken);

        Http::assertSentCount(2);
        Http::assertSent(fn ($request): bool => isset($request['conversation_id'], $request['customer_token'])
            && $request['conversation_id'] === 'conversation-1'
            && $request['customer_token'] === str_repeat('a', 64)
            && $request['messages'][0]['content'] === '続けて相談したい');
    }

    public function test_it_does_not_repeat_an_agent_run_when_the_result_is_unknown(): void
    {
        config(['fourmix-intelligence.url' => 'https://example.test', 'fourmix-intelligence.token' => 'secret']);
        $this->app->forgetInstance(FourmixIntelligenceClient::class);
        $this->app->forgetInstance('fourmix-intelligence');
        Http::fakeSequence()
            ->push(['message' => '処理結果を確認できません。'], 500)
            ->push(['result' => ['answer' => '二重実行']], 200);

        try {
            $this->app->make(FourmixIntelligenceManager::class)->client()->run('sales', [['role' => 'user', 'content' => '一度だけ処理してください']]);
            self::fail('通信失敗を返す必要があります。');
        } catch (ApiException $exception) {
            self::assertSame(500, $exception->getCode());
        }

        Http::assertSentCount(1);
    }

    public function test_missing_host_account_never_falls_back_to_environment_credentials(): void
    {
        config(['fourmix-intelligence.token' => 'synthetic']);
        Http::preventStrayRequests();
        $this->expectException(\LogicException::class);
        $this->app->make(FourmixIntelligenceManager::class)->connection('shopfront')->agent('product-advisor')->ask('実行しない');
    }
}
