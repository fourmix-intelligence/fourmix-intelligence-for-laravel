<?php

namespace FourmixIntelligence\Laravel\Console;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Throwable;

final class DoctorCommand extends Command
{
    protected $signature = 'fourmix-intelligence:doctor';

    protected $description = 'Fourmix Intelligence の接続設定を確認します';

    public function handle(FourmixIntelligenceClient $client): int
    {
        try {
            $client->json('GET', '/api/v3/ai/plugins/metadata');
            $this->components->info('Fourmix Intelligence に接続できました。');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $type = $exception instanceof ApiException ? 'api' : ($exception instanceof ConnectionException ? 'connection' : 'unexpected');
            $status = $exception instanceof ApiException
                ? ', status='.($exception->status >= 100 && $exception->status <= 599 ? $exception->status : 'unknown') : '';
            $this->components->error('接続を確認できませんでした。 (type='.$type.$status.')');

            return self::FAILURE;
        }
    }
}
