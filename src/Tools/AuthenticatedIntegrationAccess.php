<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class AuthenticatedIntegrationAccess implements IntegrationAccess
{
    public function context(Request $request): ToolContext
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        return new ToolContext('user:'.$user->getAuthIdentifier());
    }

    public function authorizeSystemConnection(Request $request): void
    {
        Gate::forUser($request->user())->authorize('fourmix-intelligence.system');
        abort(403, 'システム連携には、このアプリケーションの実行アカウントと管理権限を設定する必要があります。');
    }
}
