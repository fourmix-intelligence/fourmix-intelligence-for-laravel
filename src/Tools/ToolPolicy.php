<?php

namespace FourmixIntelligence\Laravel\Tools;

interface ToolPolicy
{
    /** @param array<string, string> $identity Resolve the current user from a verified identity. */
    public function resolve(array $identity): ToolContext;

    /** @param array<string, mixed> $arguments Recheck current application permissions without side effects. */
    public function authorize(ToolContext $context, string $operation, array $arguments): void;

    /**
     * Return a human-readable, secret-free preview; never invoke the operation.
     *
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    public function preview(ToolContext $context, string $operation, array $arguments): array;

    public function reviewUrl(string $actionId): string;
}
