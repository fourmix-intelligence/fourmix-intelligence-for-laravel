<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Tools\ToolContext;

/** A host-owned connection selects the FI AI without changing its capabilities. */
final readonly class Connection
{
    public function __construct(private string $name, private ?ToolContext $context = null) {}

    /** Only trusted host code may choose the authorization owner. */
    public function forUser(ToolContext $context): self
    {
        return new self($this->name, $context);
    }

    public function agent(string $name): Agent
    {
        $agent = (new Agent($name))->onConnection($this->name);

        return $this->context === null ? $agent : $agent->forUser($this->context);
    }
}
