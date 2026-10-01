<?php

return [
    'url' => env('FOURMIX_INTELLIGENCE_URL', 'https://mcp.ai.fourmix.co.jp'),
    'token' => env('FOURMIX_INTELLIGENCE_TOKEN'),
    'agent' => env('FOURMIX_INTELLIGENCE_AGENT'),
    'dataset' => env('FOURMIX_INTELLIGENCE_DATASET'),
    'sync_token' => env('FOURMIX_INTELLIGENCE_SYNC_TOKEN'),
    'timeout' => (int) env('FOURMIX_INTELLIGENCE_TIMEOUT', 60),
    'connect_timeout' => (int) env('FOURMIX_INTELLIGENCE_CONNECT_TIMEOUT', 5),
    'retry' => ['times' => (int) env('FOURMIX_INTELLIGENCE_RETRY_TIMES', 2), 'sleep_ms' => 250],
    'conversation' => ['store' => env('FOURMIX_INTELLIGENCE_CONVERSATION_STORE', 'session')],
    'knowledge' => ['queue' => env('FOURMIX_INTELLIGENCE_QUEUE', 'default')],
    'webhooks' => [
        'secret' => env('FOURMIX_INTELLIGENCE_WEBHOOK_SECRET'),
        'connection_id' => env('FOURMIX_INTELLIGENCE_WEBHOOK_CONNECTION_ID'),
        'database_connection' => env('FOURMIX_INTELLIGENCE_WEBHOOK_DATABASE_CONNECTION'),
        'tolerance_seconds' => (int) env('FOURMIX_INTELLIGENCE_WEBHOOK_TOLERANCE', 300),
    ],
    'bridge' => [
        'enabled' => (bool) env('FOURMIX_INTELLIGENCE_BRIDGE_ENABLED', false),
        'secret' => env('FOURMIX_INTELLIGENCE_BRIDGE_SECRET'),
        'application_id' => env('FOURMIX_INTELLIGENCE_BRIDGE_APPLICATION_ID'),
        'workspace_id' => env('FOURMIX_INTELLIGENCE_BRIDGE_WORKSPACE_ID'),
        'connection_id' => env('FOURMIX_INTELLIGENCE_BRIDGE_CONNECTION_ID'),
        'revision' => (int) env('FOURMIX_INTELLIGENCE_BRIDGE_REVISION', 1),
        // この配列へ登録したクラスだけが公開候補になります。
        'tool_handlers' => [],
        // ['*'] は登録済みの全機能。個別に止める場合は機能名を列挙します。
        'enabled_operations' => ['*'],
    ],
    'logging' => ['channel' => env('FOURMIX_INTELLIGENCE_LOG_CHANNEL')],
];

