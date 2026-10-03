<?php

namespace App\Intelligence;

use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\Tools\ToolContext;

final class NoteTools
{
    public function __construct(private NoteAccess $notes) {}

    #[FourmixIntelligenceTool(
        name: 'notes.list',
        description: 'ログイン中の本人が所有する備忘を新しい順に取得します。他の利用者の備忘は取得できません。',
        scopes: ['notes:read'],
        domain: 'notes',
        keywords: ['個人の備忘'],
        inputSchema: ['type' => 'object', 'properties' => ['limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50]], 'additionalProperties' => false],
    )]
    public function listNotes(ToolContext $context, int $limit = 10): array
    {
        abort_unless($limit >= 1 && $limit <= 50, 422, '取得件数は1件から50件まで指定できます。');

        return ['notes' => $this->notes->user($context)->notes()->latest('id')->limit($limit)->get()->map(fn ($note): array => $this->notes->data($note))->all()];
    }

    #[FourmixIntelligenceTool(
        name: 'notes.show',
        description: '本人の備忘をIDで取得します。他の利用者が所有するIDは指定できません。',
        scopes: ['notes:read'],
        domain: 'notes',
        keywords: ['個人の備忘'],
        inputSchema: ['type' => 'object', 'properties' => ['id' => ['type' => 'integer', 'minimum' => 1]], 'required' => ['id'], 'additionalProperties' => false],
    )]
    public function showNote(ToolContext $context, int $id): array
    {
        return $this->notes->data($this->notes->find($context, $id));
    }

    #[FourmixIntelligenceTool(
        name: 'notes.create',
        description: '本人の備忘を作成します。件名と本文を確認してから保存します。所有者を変更することはできません。',
        scopes: ['notes:write'],
        requiresApproval: true,
        readOnly: false,
        domain: 'notes',
        keywords: ['個人の備忘'],
        inputSchema: ['type' => 'object', 'properties' => ['title' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 120], 'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 5000]], 'required' => ['title', 'body'], 'additionalProperties' => false],
    )]
    public function createNote(ToolContext $context, string $title, string $body): array
    {
        $note = $this->notes->create($context, $title, $body);

        return ['saved' => true, 'message' => '備忘を保存しました。', 'url' => route('notes.show', $note), 'note' => $this->notes->data($note)];
    }
}
