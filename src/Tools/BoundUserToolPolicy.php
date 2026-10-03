<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Contracts\Auth\Factory;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Resolve only an explicitly paired, existing application user; no business operation is granted. */
final class BoundUserToolPolicy implements ToolPolicy
{
    public function __construct(private readonly Factory $auth, private readonly BridgeConnections $connections) {}

    /** @param array<string, mixed> $identity */
    public function resolve(array $identity): ToolContext
    {
        $connectionId = $identity['connection_id'] ?? '';
        $remoteUser = $identity['remote_user'] ?? '';
        abort_unless(is_string($connectionId) && $connectionId !== '' && is_string($remoteUser) && Str::isUuid($remoteUser),
            403, '利用者の関連付けを確認できませんでした。');
        $connection = $this->connections->get($connectionId);
        abort_unless($connection['host_mode'] === 'user'
            && ($identity['workspace_id'] ?? '') === $connection['workspace_id'], 403, '利用者の接続範囲を確認できませんでした。');
        $binding = DB::table('fourmix_intelligence_user_bindings')
            ->where('connection_id', $connection['id'])->where('workspace_id', $connection['workspace_id'])
            ->where('remote_user', $remoteUser)->whereNull('revoked_at')->first();
        abort_unless($binding !== null && is_string($binding->subject) && str_starts_with($binding->subject, 'user:'),
            403, '連携対象アプリケーションの利用者を関連付けてください。');
        abort_unless($connection['subject'] === $binding->subject,
            403, '別の利用者の接続は使用できません。');
        $identifier = substr($binding->subject, 5);
        abort_unless($identifier !== '', 403, '利用者の関連付けを確認できませんでした。');

        $guard = $this->auth->guard();
        $provider = method_exists($guard, 'getProvider') ? $guard->getProvider() : null;
        abort_unless($provider instanceof UserProvider, 403, '利用者の認証方式に対応する認可処理を設定してください。');
        $user = $provider->retrieveById($identifier);
        abort_unless($user !== null && (string) $user->getAuthIdentifier() === $identifier,
            403, '関連付けられた利用者は現在利用できません。');

        return new ToolContext($binding->subject, 'fourmix-intelligence', [
            'workspace_id' => $connection['workspace_id'], 'connection_id' => $connection['id'],
            'remote_user' => $remoteUser, 'binding_id' => $binding->id,
        ]);
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
        abort(403, '業務機能の認可処理を設定してください。');
    }

    public function reviewUrl(string $actionId): string
    {
        return '';
    }
}
