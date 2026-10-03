<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Support\Facades\DB;

/** Personal UI choices do not grant access to an AI or to business operations. */
final class UiPreferences
{
    /** @return array{chat_entry: string} */
    public function for(ToolContext $context): array
    {
        return ['chat_entry' => DB::table('fourmix_intelligence_ui_preferences')->where('subject', $context->subject)->value('chat_entry') ?? 'floating'];
    }

    public function save(ToolContext $context, string $entry): void
    {
        abort_unless(in_array($entry, ['header', 'floating', 'both', 'hidden'], true), 422, 'AIチャットの表示方法を選択してください。');
        DB::table('fourmix_intelligence_ui_preferences')->upsert([
            ['subject' => $context->subject, 'chat_entry' => $entry, 'created_at' => now(), 'updated_at' => now()],
        ], ['subject'], ['chat_entry', 'updated_at']);
    }
}
