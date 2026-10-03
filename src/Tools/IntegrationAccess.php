<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Http\Request;

/**
 * The host owns identities and may replace this adapter for its account hierarchy.
 * A system adapter must return a dedicated service subject from context(), protect
 * every management request with its own administrative gate, and use the same
 * service subject in ToolPolicy. The creator's personal account is never a proxy.
 */
interface IntegrationAccess
{
    public function context(Request $request): ToolContext;

    public function authorizeSystemConnection(Request $request): void;
}
