<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Data\AgentResult;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;

final class Agent
{
    /** @var array<string, mixed> */
    private array $options = [];

    private ?Conversation $conversation = null;

    public function __construct(private readonly FourmixIntelligenceClient $client, private readonly string $name) {}

    public function conversation(string $id, ?string $customerToken = null): self
    {
        $clone = clone $this;
        $clone->conversation = new Conversation($id, $customerToken);

        return $clone;
    }

    /** @param array<string, mixed> $context */
    public function context(array $context): self
    {
        $clone = clone $this;
        $clone->options['context'] = $context;

        return $clone;
    }

    /** @param array<string, mixed> $options */
    public function options(array $options): self
    {
        $clone = clone $this;
        $clone->options = array_replace_recursive($clone->options, $options);

        return $clone;
    }

    public function ask(string $message): AgentResult
    {
        return $this->client->run($this->name, [['role' => 'user', 'content' => $message]], $this->options, $this->conversation?->id, $this->conversation?->token);
    }

    /** @return array<string, mixed> */
    public function history(?int $beforeId = null): array
    {
        if ($this->conversation === null) {
            throw new \LogicException('会話履歴を取得するには conversation() を指定してください。');
        }
        if ($this->conversation->token === null) {
            throw new \LogicException('この履歴 API は外部会話専用です。会話専用トークンを指定してください。');
        }

        return $this->client->history($this->name, $this->conversation->id, $this->conversation->token, $beforeId);
    }
}
