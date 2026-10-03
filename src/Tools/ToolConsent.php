<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Support\Facades\DB;

/** 接続ごとの業務許可。本人と業務データの権限は宿主が最後に確認します。 */
final class ToolConsent
{
    public function __construct(private ToolRegistry $tools) {}

    public function mode(ToolContext $context, string $operation): string
    {
        return $this->modes($context)[$operation] ?? 'disabled';
    }

    /** @return array<string, string> */
    public function modes(ToolContext $context): array
    {
        return $this->decode($this->connection($context)->permissions);
    }

    /** @return array<string, string> */
    public function forConnection(ToolContext $context, string $id): array
    {
        $record = DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('id', $id)->firstOrFail();

        return $this->decode($record->permissions);
    }

    /** @param array<array-key, mixed> $modes */
    public function encode(array $modes): string
    {
        $enabled = (array) config('fourmix-intelligence.bridge.enabled_operations', ['*']);
        $permissions = [];
        abort_unless(count($modes) <= 500, 422, '公開する業務の件数を確認してください。');
        foreach ($modes as $operation => $mode) {
            abort_unless(is_string($operation) && isset($this->tools->all()[$operation])
                && (in_array('*', $enabled, true) || in_array($operation, $enabled, true))
                && in_array($mode, ['disabled', 'review', 'automatic'], true), 422, '操作と許可方法を確認してください。');
            $permissions[$operation] = ['mode' => $mode, 'definition_hash' => $this->tools->fingerprint($operation)];
        }

        return json_encode($permissions === [] ? (object) [] : $permissions, JSON_THROW_ON_ERROR);
    }

    /** @return array<string, string> */
    public function decode(string $encoded): array
    {
        $permissions = json_decode($encoded, true, 512, JSON_THROW_ON_ERROR);
        abort_unless(is_array($permissions), 403, '接続の業務許可を確認できません。');
        $modes = [];
        $enabled = (array) config('fourmix-intelligence.bridge.enabled_operations', ['*']);
        foreach ($this->tools->all() as $operation => $tool) {
            $permission = $permissions[$operation] ?? null;
            $mode = is_array($permission) ? ($permission['mode'] ?? 'disabled') : 'disabled';
            if (! in_array($mode, ['disabled', 'review', 'automatic'], true)) {
                $mode = 'disabled';
            }
            if (! in_array('*', $enabled, true) && ! in_array($operation, $enabled, true)) {
                $mode = 'disabled';
            }
            if ($mode === 'automatic' && (! is_string($permission['definition_hash'] ?? null)
                || ! hash_equals($permission['definition_hash'], $this->tools->fingerprint($operation)))) {
                $mode = 'review';
            }
            $modes[$operation] = $mode;
        }

        return $modes;
    }

    public function bind(ToolContext $context): ToolContext
    {
        $record = $this->connection($context);

        return new ToolContext($context->subject, $context->channel, [...$context->identity, 'connection_revision' => (string) $record->revision]);
    }

    private function connection(ToolContext $context): \stdClass
    {
        $remote = $context->identity['connection_id'] ?? '';
        abort_unless($remote !== '', 403, '業務操作には接続の指定が必要です。');
        $query = DB::table('fourmix_intelligence_connections')->where('remote_connection', $remote)->where('state', 'ready')->whereNotNull('secret');
        if (DB::connection()->transactionLevel() > 0) {
            $query->lockForUpdate();
        }
        $record = $query->first();
        abort_unless($record !== null, 403, '接続は利用できません。');
        abort_unless($record->subject === $context->subject, 403, '別の利用者の接続は使用できません。');
        $expected = $context->identity['connection_revision'] ?? null;
        abort_unless($expected === null || (string) $expected === (string) $record->revision, 403, '接続の許可が変更されています。新しい接続で依頼してください。');
        abort_unless(DB::table('fourmix_intelligence_user_bindings')->where('subject', $context->subject)->where('connection_id', $remote)
            ->whereNull('revoked_at')->whereNotNull('remote_user')->exists(), 403, '本人のアカウントを関連付けてください。');

        return $record;
    }

    /** MySQLで同時要求のロック昇格を避け、権限変更と実行を同じ順序で直列化します。 */
    public function lock(string $subject): void
    {
        DB::table('fourmix_intelligence_tool_subjects')->upsert([['subject' => $subject, 'created_at' => now()]], ['subject'], ['subject']);
        DB::table('fourmix_intelligence_tool_subjects')->where('subject', $subject)->lockForUpdate()->firstOrFail();
    }
}
