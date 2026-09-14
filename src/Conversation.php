<?php

namespace FourmixIntelligence\Laravel;

final readonly class Conversation
{
    public function __construct(public string $id, public string $token) {}

    /** @return array{conversation_id:string, customer_token:string} */
    public function toArray(): array
    {
        return ['conversation_id' => $this->id, 'customer_token' => $this->token];
    }
}

