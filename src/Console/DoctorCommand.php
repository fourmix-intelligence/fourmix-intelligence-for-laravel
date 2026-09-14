<?php

namespace FourmixIntelligence\Laravel\Console;

use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use Illuminate\Console\Command;

final class DoctorCommand extends Command
{
    protected $signature = 'fourmix-intelligence:doctor';
    protected $description = 'Fourmix Intelligence の接続設定を確認します';

    public function handle(FourmixIntelligenceClient $client): int
    {
        try {
            $client->json('GET', '/api/v3/ai/plugins/metadata');
            $this->components->info('Fourmix Intelligence へ接続できました。');
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->components->error('接続を確認できませんでした: '.$e->getMessage());
            return self::FAILURE;
        }
    }
}

