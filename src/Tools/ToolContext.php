<?php

namespace FourmixIntelligence\Laravel\Tools;

final readonly class ToolContext
{
    /** @param array<string, string> $identity */
    public function __construct(public string $subject, public string $channel = 'application', public array $identity = []) {}
}
