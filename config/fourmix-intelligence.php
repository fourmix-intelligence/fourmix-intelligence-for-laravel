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
        'enabled' => true,
        // この配列へ登録したクラスだけが公開候補になります。
        'tool_handlers' => [],
        // ['*'] は登録済みの全機能。個別に止める場合は機能名を列挙します。
        'enabled_operations' => ['*'],
    ],
    'ui' => ['prefix' => 'fourmix-intelligence', 'middleware' => ['web', 'auth'], 'host_modes' => ['user'],
        'surfaces' => ['page' => ['type' => 'page', 'enabled' => true, 'alias' => 'ui-page', 'title' => 'AIアシスタント'],
            'floating' => ['type' => 'floating', 'enabled' => true, 'alias' => 'ui-floating', 'title' => 'AIアシスタント']]],
    // 会話専用添付。FI の上限より厳しい値だけを適用し、共有資料庫へは同期しません。
    'attachments' => [
        'max_bytes' => 10 * 1024 * 1024,
        'max_files' => 5,
        'extensions' => ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'txt', 'md', 'csv', 'tsv', 'docx', 'xlsx', 'pptx'],
    ],
    'logging' => ['channel' => env('FOURMIX_INTELLIGENCE_LOG_CHANNEL')],
    'native' => [
        'trusted_platform_urls' => ['https://platform.ai.fourmix.co.jp', 'https://demo.platform.ai.fourmix.co.jp'],
        'timeout' => (int) env('FOURMIX_INTELLIGENCE_NATIVE_TIMEOUT', 250),
    ],
];
