<?php

namespace FourmixIntelligence\Laravel\Data;

final readonly class AgentResult
{
    /**
     * @param array<string, mixed> $data
     * @param array<string, mixed> $references
     * @param array<int, array<string, mixed>> $followUpQuestions
     * @param array<string, mixed> $raw
     */
    public function __construct(
        public string $runId,
        public string $agent,
        public string $answer,
        public ?string $conversationId,
        public ?string $customerToken,
        public ?string $conversationMode,
        public array $data,
        public array $references,
        public array $followUpQuestions,
        public array $raw,
    ) {}

    /** @param array<string, mixed> $payload */
    public static function fromArray(array $payload): self
    {
        $result = is_array($payload['result'] ?? null) ? $payload['result'] : [];

        return new self(
            (string) ($payload['run_id'] ?? ''),
            (string) ($payload['plugin'] ?? ''),
            (string) ($result['answer'] ?? ''),
            isset($payload['conversation_id']) ? (string) $payload['conversation_id'] : null,
            isset($payload['customer_token']) ? (string) $payload['customer_token'] : null,
            isset($payload['conversation_mode']) ? (string) $payload['conversation_mode'] : null,
            is_array($result['data'] ?? null) ? $result['data'] : [],
            is_array($result['references'] ?? null) ? $result['references'] : [],
            is_array($result['follow_up_questions'] ?? null) ? $result['follow_up_questions'] : [],
            $payload,
        );
    }
}
