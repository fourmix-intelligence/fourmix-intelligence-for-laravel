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
        'tolerance_seconds' => (int) env('FOURMIX_INTELLIGENCE_WEBHOOK_TOLERANCE', 300),
    ],
    'logging' => ['channel' => env('FOURMIX_INTELLIGENCE_LOG_CHANNEL')],
];

