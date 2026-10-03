<?php

use App\Intelligence\NoteTools;

return [
    'bridge' => [
        'enabled' => true,
        'tool_handlers' => [NoteTools::class],
        'enabled_operations' => ['notes.list', 'notes.show', 'notes.create'],
    ],
    'ui' => [
        'prefix' => 'fourmix-intelligence',
        'middleware' => ['web', 'auth'],
        'host_modes' => ['user'],
        'surfaces' => [
            'page' => ['type' => 'page', 'enabled' => true, 'alias' => 'ui-page', 'title' => 'AIアシスタント'],
            'floating' => ['type' => 'floating', 'enabled' => true, 'alias' => 'ui-floating', 'title' => 'AIアシスタント'],
        ],
        'domain_labels' => ['notes' => '個人の備忘'],
    ],
];
