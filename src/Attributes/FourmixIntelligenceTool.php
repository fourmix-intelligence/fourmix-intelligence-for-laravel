<?php

namespace FourmixIntelligence\Laravel\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD)]
final readonly class FourmixIntelligenceTool
{
    /** @param list<string> $scopes */
    public function __construct(public string $name, public string $description, public array $scopes = [], public bool $requiresApproval = false) {}
}

