<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;

final readonly class FourmixIntelligenceManager
{
    public function __construct(private FourmixIntelligenceClient $client, private ?string $defaultAgent) {}

    public function agent(?string $name = null): Agent
    {
        $resolved = $name ?: $this->defaultAgent;
        if (!is_string($resolved) || $resolved === '') throw new \InvalidArgumentException('利用する AI の識別子を指定してください。');
        return new Agent($this->client, $resolved);
    }

    public function client(): FourmixIntelligenceClient { return $this->client; }
}

