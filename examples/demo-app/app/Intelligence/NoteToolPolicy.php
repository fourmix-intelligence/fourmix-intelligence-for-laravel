<?php

namespace App\Intelligence;

use FourmixIntelligence\Laravel\Tools\BoundUserToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;

final class NoteToolPolicy implements ToolPolicy
{
    public function __construct(private BoundUserToolPolicy $identities, private NoteAccess $notes) {}

    public function resolve(array $identity): ToolContext
    {
        return $this->identities->resolve($identity);
    }

    public function authorize(ToolContext $context, string $operation, array $arguments): void
    {
        $this->notes->user($context);
        abort_unless(in_array($operation, ['notes.list', 'notes.show', 'notes.create'], true), 403, 'この操作は利用できません。');
        if ($operation === 'notes.show') {
            $this->notes->find($context, (int) ($arguments['id'] ?? 0));
        }
        if ($operation === 'notes.create') {
            $this->notes->content((string) ($arguments['title'] ?? ''), (string) ($arguments['body'] ?? ''));
        }
    }

    public function preview(ToolContext $context, string $operation, array $arguments): array
    {
        $this->authorize($context, $operation, $arguments);
        abort_unless($operation === 'notes.create', 403, '確認対象の操作ではありません。');

        return ['操作' => '備忘の新規作成', '登録先' => '本人の備忘のみ', '件名' => $arguments['title'], '本文' => $arguments['body']];
    }

    public function reviewUrl(string $actionId): string
    {
        return '';
    }
}
