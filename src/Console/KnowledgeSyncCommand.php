<?php

namespace FourmixIntelligence\Laravel\Console;

use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use Illuminate\Console\Command;

final class KnowledgeSyncCommand extends Command
{
    protected $signature = 'fourmix-intelligence:knowledge:sync {file : 同期する JSON ファイル} {--dataset=} {--key=}';
    protected $description = 'JSON で用意した資料を Fourmix Intelligence へ同期します';

    public function handle(FourmixIntelligenceClient $client): int
    {
        $pathValue = $this->argument('file');
        $path = is_string($pathValue) ? $pathValue : '';
        $datasetOption = $this->option('dataset');
        $datasetConfig = config('fourmix-intelligence.dataset');
        $dataset = is_string($datasetOption) && $datasetOption !== '' ? $datasetOption : (is_string($datasetConfig) ? $datasetConfig : '');
        if (!is_file($path) || $dataset === '') { $this->components->error('ファイルと資料庫を確認してください。'); return self::INVALID; }
        $decoded = json_decode((string) file_get_contents($path), true);
        $records = is_array($decoded['records'] ?? null) ? $decoded['records'] : $decoded;
        if (!is_array($records)) { $this->components->error('JSON の形式を確認してください。'); return self::INVALID; }
        $key = $this->option('key');
        $result = $client->syncDocuments($dataset, $records, is_string($key) && $key !== '' ? $key : null);
        $this->components->info('資料同期を受け付けました。ジョブ: '.($result['job_id'] ?? '受付済み'));
        return self::SUCCESS;
    }
}
