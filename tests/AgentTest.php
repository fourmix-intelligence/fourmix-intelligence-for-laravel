<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\FourmixIntelligenceManager;
use FourmixIntelligence\Laravel\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;

final class AgentTest extends TestCase
{
    public function test_it_keeps_the_server_conversation_contract(): void
    {
        config(['fourmix-intelligence.url' => 'https://example.test', 'fourmix-intelligence.token' => 'secret']);
        $this->app->forgetInstance(\FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient::class);
        $this->app->forgetInstance('fourmix-intelligence');
        Http::fake(['example.test/*' => Http::response([
            'run_id' => 'run-1', 'plugin' => 'sales', 'conversation_id' => 'conversation-1',
            'customer_token' => str_repeat('a', 64), 'conversation_mode' => 'history',
            'result' => ['answer' => '承知しました。', 'data' => ['items' => [['product_url' => '/products/1']]], 'references' => [], 'follow_up_questions' => []],
        ])]);

        $first = $this->app->make(FourmixIntelligenceManager::class)->agent('sales')->ask('相談したい');
        self::assertSame('/products/1', $first->data['items'][0]['product_url']);
        self::assertSame('conversation-1', $first->conversationId);
        self::assertNotNull($first->conversationId);
        self::assertNotNull($first->customerToken);

        $this->app->make(FourmixIntelligenceManager::class)
            ->agent('sales')
            ->conversation($first->conversationId, $first->customerToken)
            ->ask('続けて相談したい');

        Http::assertSentCount(2);
        Http::assertSent(fn ($request): bool => isset($request['conversation_id'], $request['customer_token'])
            && $request['conversation_id'] === 'conversation-1'
            && $request['customer_token'] === str_repeat('a', 64)
            && $request['messages'][0]['content'] === '続けて相談したい');
    }

    public function test_it_does_not_repeat_an_agent_run_when_the_result_is_unknown(): void
    {
        config(['fourmix-intelligence.url' => 'https://example.test', 'fourmix-intelligence.token' => 'secret']);
        $this->app->forgetInstance(\FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient::class);
        $this->app->forgetInstance('fourmix-intelligence');
        Http::fakeSequence()
            ->push(['message' => '処理結果を確認できません。'], 500)
            ->push(['result' => ['answer' => '二重実行']], 200);

        try {
            $this->app->make(FourmixIntelligenceManager::class)->agent('sales')->ask('一度だけ処理してください');
            self::fail('通信失敗を返す必要があります。');
        } catch (ApiException $exception) {
            self::assertSame(500, $exception->getCode());
        }

        Http::assertSentCount(1);
    }
}
