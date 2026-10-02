<?php

namespace FourmixIntelligence\Laravel\Console;

use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Throwable;

final class KnowledgeSyncCommand extends Command
{
    protected $signature = 'fourmix-intelligence:knowledge:sync {file : 同期対象の JSON ファイル} {--dataset=} {--key=}';

    protected $description = 'JSON で用意した知識を Fourmix Intelligence に同期します';

    public function handle(FourmixIntelligenceClient $client): int
    {
        try {
            $pathValue = $this->argument('file');
            $path = is_string($pathValue) ? $pathValue : '';
            $datasetOption = $this->option('dataset');
            $datasetConfig = config('fourmix-intelligence.dataset');
            $dataset = is_string($datasetOption) && $datasetOption !== '' ? $datasetOption : (is_string($datasetConfig) ? $datasetConfig : '');
            if (! is_file($path) || $dataset === '') {
                $this->components->error('ファイルと同期先を確認してください。');

                return self::INVALID;
            }
            $decoded = json_decode((string) file_get_contents($path), true);
            $records = is_array($decoded['records'] ?? null) ? $decoded['records'] : $decoded;
            if (! is_array($records)) {
                $this->components->error('JSON の形式を確認してください。');

                return self::INVALID;
            }
            $key = $this->option('key');
            $result = $client->syncDocuments($dataset, $records, is_string($key) && $key !== '' ? $key : null);
            $this->components->info('知識同期を受け付けました。ジョブ: '.($result['id'] ?? $result['job_id'] ?? '受付済み'));

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $type = $exception instanceof ApiException ? 'api' : ($exception instanceof ConnectionException ? 'connection' : 'unexpected');
            $status = $exception instanceof ApiException
                ? ', status='.($exception->status >= 100 && $exception->status <= 599 ? $exception->status : 'unknown') : '';
            $this->components->error('知識同期を受け付けられませんでした。 (type='.$type.$status.')');

            return self::FAILURE;
        }
    }
}
