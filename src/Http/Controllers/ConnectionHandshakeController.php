<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ConnectionHandshakeController
{
    public function __invoke(Request $request, ConnectionManager $connections): JsonResponse
    {
        abort_if(strlen($request->getContent()) > 6144, 413);
        $input = $request->validate(['code' => ['required', 'string', 'size:48'], 'ticket' => ['required', 'string', 'size:64'],
            'platform_url' => ['sometimes', 'required', 'string', 'max:2048'], 'ui_url' => ['sometimes', 'required', 'string', 'max:2048'],
            'tenant' => ['sometimes', 'required', 'string', 'max:128']]);

        return response()->json($connections->complete($input['code'], $input['ticket'], $input))->header('Cache-Control', 'no-store');
    }
}
