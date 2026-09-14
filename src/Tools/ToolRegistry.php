<?php

namespace FourmixIntelligence\Laravel\Tools;

use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use ReflectionClass;

final class ToolRegistry
{
    /** @var array<string, array<string, mixed>> */ private array $tools = [];

    /** @param object|class-string<object> $handler */
    public function register(object|string $handler): void
    {
        $reflection = new ReflectionClass($handler);
        foreach ($reflection->getMethods() as $method) {
            $attribute = $method->getAttributes(FourmixIntelligenceTool::class)[0] ?? null;
            if ($attribute === null || !$method->isPublic()) continue;
            $tool = $attribute->newInstance();
            if (isset($this->tools[$tool->name])) throw new \LogicException("ツール名が重複しています: {$tool->name}");
            $this->tools[$tool->name] = ['handler' => $handler, 'method' => $method->getName(), 'description' => $tool->description, 'scopes' => $tool->scopes, 'requires_approval' => $tool->requiresApproval];
        }
    }

    /** @return array<string, array<string, mixed>> */ public function all(): array { return $this->tools; }
}
