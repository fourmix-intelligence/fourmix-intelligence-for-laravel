<?php

namespace FourmixIntelligence\Laravel\Tools;

use FourmixIntelligence\Laravel\Http\PlatformEndpoint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/** A short-lived user gesture plus a platform back-channel establishes each independent connection. */
final class ConnectionManager
{
    /** @param array<string, string> $modes
     * @return array{id: string, code: string, expires_at: string}
     */
    public function issue(ToolContext $context, string $name, array $modes, string $hostMode = 'user'): array
    {
        $name = trim($name);
        abort_unless($name !== '' && mb_strlen($name) <= 100, 422, '接続名は1〜100文字で入力してください。');
        abort_unless(in_array($hostMode, ['user', 'system'], true), 422);
        $permissions = app(ToolConsent::class)->encode($modes);
        $code = Str::random(48);
        $id = (string) Str::uuid();
        $expires = now()->addMinutes(10);
        DB::table('fourmix_intelligence_connections')->insert([
            'id' => $id, 'subject' => $context->subject, 'name' => $name,
            'platform_url' => '', 'ui_url' => '', 'tenant' => '', 'scope' => 'pending', 'host_mode' => $hostMode,
            'permissions' => $permissions, 'revision' => 1,
            'code_hash' => hash('sha256', $code), 'expires_at' => $expires, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return ['id' => $id, 'code' => $code, 'expires_at' => $expires->toIso8601String()];
    }

    /** @return list<array<string, mixed>> */
    public function connections(ToolContext $context): array
    {
        return array_values(DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->orderBy('created_at')->get([
            'id', 'name', 'scope', 'host_mode', 'platform_url', 'ui_url', 'tenant', 'remote_connection', 'workspace_id', 'state', 'permissions', 'revision', 'expires_at',
        ])->map(function (object $row): array {
            $item = (array) $row;
            $item['permissions'] = app(ToolConsent::class)->decode($row->permissions);

            return $item;
        })->all());
    }

    public function owned(ToolContext $context, string $id): \stdClass
    {
        return DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('id', $id)->firstOrFail();
    }

    public function revoke(ToolContext $context, string $id): void
    {
        DB::transaction(function () use ($context, $id): void {
            app(ToolConsent::class)->lock($context->subject);
            $record = $this->owned($context, $id);
            DB::table('fourmix_intelligence_agent_bindings')->where('connection_id', $id)->delete();
            if ($record->remote_connection !== null) {
                DB::table('fourmix_intelligence_user_bindings')->where('connection_id', $record->remote_connection)->delete();
            }
            DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('id', $id)->delete();
        });
    }

    public function rename(ToolContext $context, string $id, string $name): void
    {
        $name = trim($name);
        abort_unless($name !== '' && mb_strlen($name) <= 100, 422, '接続名は1〜100文字で入力してください。');
        DB::transaction(function () use ($context, $id, $name): void {
            app(ToolConsent::class)->lock($context->subject);
            $this->owned($context, $id);
            DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('id', $id)
                ->update(['name' => $name, 'updated_at' => now()]);
        });
    }

    /** @param array<string, string> $modes
     * @return array{id: string, code: string, expires_at: string, revision: int}
     */
    public function renew(ToolContext $context, string $id, array $modes): array
    {
        $permissions = app(ToolConsent::class)->encode($modes);

        return DB::transaction(function () use ($context, $id, $permissions): array {
            app(ToolConsent::class)->lock($context->subject);
            $record = DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('id', $id)->lockForUpdate()->firstOrFail();
            $code = Str::random(48);
            $expires = now()->addMinutes(10);
            $revision = (int) $record->revision + 1;
            DB::table('fourmix_intelligence_agent_bindings')->where('connection_id', $id)->delete();
            if ($record->remote_connection !== null) {
                DB::table('fourmix_intelligence_user_bindings')->where('connection_id', $record->remote_connection)->delete();
            }
            DB::table('fourmix_intelligence_connections')->where('id', $id)->update([
                'permissions' => $permissions, 'revision' => $revision, 'state' => 'pending', 'secret' => null,
                'code_hash' => hash('sha256', $code), 'expires_at' => $expires,
                'platform_url' => '', 'ui_url' => '', 'tenant' => '', 'scope' => 'pending', 'workspace_id' => '', 'updated_at' => now(),
            ]);

            return ['id' => $id, 'code' => $code, 'expires_at' => $expires->toIso8601String(), 'revision' => $revision];
        });
    }

    /** @param array<string, mixed> $endpoint
     * @return array<string, string>
     */
    public function complete(string $code, string $ticket, array $endpoint = []): array
    {
        abort_unless(preg_match('/^[a-zA-Z0-9]{48}$/D', $code) === 1 && preg_match('/^[a-zA-Z0-9]{64}$/D', $ticket) === 1, 422);
        $hash = hash('sha256', $code);
        $pending = DB::table('fourmix_intelligence_connections')->where('code_hash', $hash)->where('state', 'pending')->where('expires_at', '>', now())->firstOrFail();
        abort_unless(is_string($endpoint['platform_url'] ?? null) && is_string($endpoint['ui_url'] ?? null)
            && is_string($endpoint['tenant'] ?? null) && preg_match('/^[a-zA-Z0-9_-]{1,128}$/D', $endpoint['tenant']) === 1, 422, '接続元の情報を確認できません。');
        $pending->platform_url = PlatformEndpoint::trusted($endpoint['platform_url']);
        $pending->ui_url = PlatformEndpoint::validate($endpoint['ui_url']);
        $pending->tenant = $endpoint['tenant'];
        $reply = Http::acceptJson()->withoutRedirecting()->connectTimeout(5)->timeout(15)
            ->post(PlatformEndpoint::trusted($pending->platform_url).'/api/v3/native/laravel/handshake/'.rawurlencode($pending->tenant).'/verify',
                ['ticket' => $ticket, 'code_hash' => $hash]);
        abort_unless($reply->successful() && is_array($reply->json()), 403, 'Fourmix Intelligenceの接続確認に失敗しました。');
        $grant = $reply->json();
        abort_unless(($grant['code_hash'] ?? '') === $hash && ($grant['tenant'] ?? '') === $pending->tenant
            && in_array($grant['scope'] ?? '', ['personal', 'organization', 'workspace'], true)
            && Str::isUuid((string) ($grant['connection_id'] ?? ''))
            && Str::isUuid((string) ($grant['remote_user'] ?? '')) && is_string($grant['workspace_id'] ?? null)
            && ($grant['scope'] === 'workspace' ? Str::isUuid($grant['workspace_id']) : $grant['workspace_id'] === ''), 403, '承認した接続の利用範囲が一致しません。');

        return DB::transaction(function () use ($pending, $grant, $hash): array {
            app(ToolConsent::class)->lock($pending->subject);
            $row = DB::table('fourmix_intelligence_connections')->where('id', $pending->id)->where('state', 'pending')
                ->where('code_hash', $hash)->where('revision', $pending->revision)->where('expires_at', '>', now())->lockForUpdate()->firstOrFail();
            abort_if(DB::table('fourmix_intelligence_connections')->where('remote_connection', $grant['connection_id'])->where('id', '!=', $row->id)->exists(), 409);
            $secret = Str::random(64);
            $bindingId = (string) Str::uuid();
            DB::table('fourmix_intelligence_connections')->where('id', $row->id)->update(['remote_connection' => $grant['connection_id'],
                'platform_url' => $pending->platform_url, 'ui_url' => $pending->ui_url, 'tenant' => $pending->tenant, 'scope' => $grant['scope'],
                'workspace_id' => $grant['workspace_id'], 'secret' => Crypt::encryptString($secret), 'state' => 'ready',
                'code_hash' => null, 'expires_at' => null, 'updated_at' => now()]);
            DB::table('fourmix_intelligence_user_bindings')->insert(['id' => $bindingId, 'subject' => $row->subject,
                'display_name' => $row->name, 'workspace_id' => $grant['workspace_id'], 'connection_id' => $grant['connection_id'],
                'remote_user' => $grant['remote_user'], 'created_at' => now(), 'updated_at' => now()]);

            return ['binding_id' => $bindingId, 'subject' => $row->subject, 'display_name' => $row->name,
                'connection_id' => $grant['connection_id'], 'secret' => $secret, 'connection_revision' => (string) $row->revision];
        });
    }
}
