<?php

namespace FourmixIntelligence\Laravel\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD)]
final readonly class FourmixIntelligenceTool
{
    /**
     * @param  list<string>  $scopes
     * @param  array<string,mixed>  $inputSchema
     * @param  list<string>  $keywords
     * @param  list<string>  $audiences
     */
    public function __construct(
        public string $name,
        public string $description,
        public array $scopes = [],
        public bool $requiresApproval = false,
        public array $inputSchema = ['type' => 'object', 'properties' => []],
        public ?string $domain = null,
        public array $keywords = [],
        public bool $readOnly = true,
        public bool $destructive = false,
        public string $version = '1',
        public array $audiences = ['internal'],
    ) {}
}
