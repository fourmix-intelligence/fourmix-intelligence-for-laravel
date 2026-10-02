<?php

namespace FourmixIntelligence\Laravel\Tools;

final class DenyToolPolicy implements ToolPolicy
{
    /** @param array<string, string> $identity */
    public function resolve(array $identity): ToolContext
    {
        abort(403, '連携対象アプリケーションの利用者を関連付けてください。');
    }

    /** @param array<string, mixed> $arguments */
    public function authorize(ToolContext $context, string $operation, array $arguments): void
    {
        abort(403, '業務機能の認可処理を設定してください。');
    }

    /** @param array<string, mixed> $arguments
     * @return array<string, mixed>
     */
    public function preview(ToolContext $context, string $operation, array $arguments): array
    {
        return [];
    }

    public function reviewUrl(string $actionId): string
    {
        return '';
    }
}
