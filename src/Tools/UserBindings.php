<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Short-lived pairing codes bind a logged-in application user to a logged-in platform user. */
final class UserBindings
{
    /** @return array{code: string, expires_at: string} */
    public function issue(ToolContext $context, string $displayName): array
    {
        $workspace = (string) config('fourmix-intelligence.bridge.workspace_id');
        $connection = (string) config('fourmix-intelligence.bridge.connection_id');
        abort_unless($workspace !== '' && $connection !== '', 503, '接続先を設定してください。');
        $code = Str::random(48);
        DB::transaction(function () use ($context, $displayName, $workspace, $connection, $code): void {
            app(ToolConsent::class)->lock($context->subject);
            DB::table('fourmix_intelligence_user_bindings')->where('subject', $context->subject)->whereNull('remote_user')->delete();
            DB::table('fourmix_intelligence_user_bindings')->insert(['id' => (string) Str::uuid(), 'subject' => $context->subject, 'display_name' => mb_substr($displayName, 0, 100),
                'workspace_id' => $workspace, 'connection_id' => $connection, 'code_hash' => hash('sha256', $code), 'expires_at' => now()->addMinutes(10), 'created_at' => now(), 'updated_at' => now()]);
        });

        return ['code' => $code, 'expires_at' => now()->addMinutes(10)->toIso8601String()];
    }

    /** @return array{binding_id: string, display_name: string} */
    public function preview(string $code): array
    {
        $row = $this->pending($code)->firstOrFail();

        return ['binding_id' => $row->id, 'display_name' => $row->display_name];
    }

    /** @return array{binding_id: string, subject: string, display_name: string} */
    public function claim(string $code, string $remoteUser): array
    {
        abort_unless(Str::isUuid($remoteUser), 422);

        return DB::transaction(function () use ($code, $remoteUser): array {
            $subject = $this->pending($code)->value('subject');
            abort_unless(is_string($subject), 404);
            app(ToolConsent::class)->lock($subject);
            $row = $this->pending($code)->lockForUpdate()->firstOrFail();
            if ($row->remote_user !== null) {
                abort_unless(hash_equals($row->remote_user, $remoteUser), 409, 'この関連付けは使用済みです。');

                return ['binding_id' => $row->id, 'subject' => $row->subject, 'display_name' => $row->display_name];
            }
            abort_if(DB::table('fourmix_intelligence_user_bindings')->where('subject', $row->subject)->whereNotNull('remote_user')->whereNull('revoked_at')->exists(), 409, '既存の関連付けを解除してからやり直してください。');
            abort_if(DB::table('fourmix_intelligence_user_bindings')->where('connection_id', $row->connection_id)->where('remote_user', $remoteUser)->exists(), 409, 'このアカウントは関連付け済みです。');
            DB::table('fourmix_intelligence_user_bindings')->where('id', $row->id)->update(['remote_user' => $remoteUser, 'updated_at' => now()]);

            return ['binding_id' => $row->id, 'subject' => $row->subject, 'display_name' => $row->display_name];
        });
    }

    public function revoke(ToolContext $context): void
    {
        DB::transaction(function () use ($context): void {
            app(ToolConsent::class)->lock($context->subject);
            DB::table('fourmix_intelligence_user_bindings')->where('subject', $context->subject)->whereNull('revoked_at')
                ->update(['revoked_at' => now(), 'remote_user' => null, 'code_hash' => null, 'updated_at' => now()]);
        });
    }

    /** @return array{binding_id: string, subject: string, display_name: string} */
    public function context(string $bindingId, string $remoteUser): array
    {
        $row = DB::table('fourmix_intelligence_user_bindings')->where('id', $bindingId)
            ->where('workspace_id', (string) config('fourmix-intelligence.bridge.workspace_id'))
            ->where('connection_id', (string) config('fourmix-intelligence.bridge.connection_id'))
            ->where('remote_user', $remoteUser)->whereNull('revoked_at')->firstOrFail();

        return ['binding_id' => $row->id, 'subject' => $row->subject, 'display_name' => $row->display_name];
    }

    private function pending(string $code): Builder
    {
        abort_unless(preg_match('/^[a-zA-Z0-9]{48}$/D', $code) === 1, 422);

        return DB::table('fourmix_intelligence_user_bindings')->where('code_hash', hash('sha256', $code))
            ->where('workspace_id', (string) config('fourmix-intelligence.bridge.workspace_id'))
            ->where('connection_id', (string) config('fourmix-intelligence.bridge.connection_id'))
            ->whereNull('revoked_at')->where('expires_at', '>', now());
    }
}
