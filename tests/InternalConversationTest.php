<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\FourmixIntelligenceManager;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;

final class InternalConversationTest extends TestCase
{
    private const CONVERSATION = '10000000-0000-4000-8000-000000000003';

    private function manager(): FourmixIntelligenceManager
    {
        return new FourmixIntelligenceManager(new FourmixIntelligenceClient($this->app->make(Factory::class), [
            'url' => 'https://example.test', 'token' => 'synthetic-account-token',
        ]), 'staff');
    }

    public function test_an_internal_conversation_continues_without_a_customer_token(): void
    {
        Http::preventStrayRequests();
        Http::fake(['example.test/*' => Http::response([
            'run_id' => 'synthetic-run', 'plugin' => 'staff',
            'conversation_id' => self::CONVERSATION, 'customer_token' => null,
            'result' => ['answer' => '合成の回答', 'data' => [], 'references' => [], 'follow_up_questions' => []],
        ])]);

        $manager = $this->manager();
        $first = $manager->agent()->ask('合成の相談');
        self::assertSame(self::CONVERSATION, $first->conversationId);
        self::assertNull($first->customerToken);
        $manager->agent()->conversation(self::CONVERSATION)->ask('続けて相談');

        Http::assertSentCount(2);
        Http::assertSent(fn ($request): bool => $request['messages'][0]['content'] === '続けて相談'
            && $request['conversation_id'] === self::CONVERSATION
            && ! array_key_exists('customer_token', $request->data()));
    }

    public function test_an_internal_conversation_does_not_call_external_history(): void
    {
        Http::preventStrayRequests();
        Http::fake();
        try {
            $this->manager()->agent()->conversation(self::CONVERSATION)->history();
            self::fail('外部会話専用 API は呼び出せません。');
        } catch (\LogicException $exception) {
            self::assertStringContainsString('外部会話専用', $exception->getMessage());
        }
        Http::assertNothingSent();
    }
}
