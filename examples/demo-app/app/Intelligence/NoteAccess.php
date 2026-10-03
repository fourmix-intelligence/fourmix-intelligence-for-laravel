<?php

namespace App\Intelligence;

use App\Models\Note;
use App\Models\User;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use Illuminate\Support\Facades\Validator;

final class NoteAccess
{
    public function user(ToolContext $context): User
    {
        abort_unless(preg_match('/^user:([1-9][0-9]*)$/D', $context->subject, $matches) === 1, 403, '利用者を確認できません。');
        $user = User::find($matches[1]);
        abort_unless($user instanceof User, 403, 'このアカウントは利用できません。');

        return $user;
    }

    public function find(ToolContext $context, int $id): Note
    {
        return $this->user($context)->notes()->findOrFail($id);
    }

    /** @return array{title: string, body: string} */
    public function content(string $title, string $body): array
    {
        return Validator::make(['title' => trim($title), 'body' => trim($body)], [
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:5000'],
        ], [
            'title.required' => '件名を入力してください。',
            'title.max' => '件名は120文字以内で入力してください。',
            'body.required' => '本文を入力してください。',
            'body.max' => '本文は5000文字以内で入力してください。',
        ])->validate();
    }

    public function create(ToolContext $context, string $title, string $body): Note
    {
        return $this->user($context)->notes()->create($this->content($title, $body));
    }

    /** @return array{id: int, title: string, body: string, updated_at: string} */
    public function data(Note $note): array
    {
        return ['id' => $note->id, 'title' => $note->title, 'body' => $note->body, 'updated_at' => $note->updated_at->toIso8601String()];
    }
}
