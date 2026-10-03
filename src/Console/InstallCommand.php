<?php

namespace FourmixIntelligence\Laravel\Console;

use Illuminate\Console\Command;

final class InstallCommand extends Command
{
    protected $signature = 'fi:install {--force : 既存の設定ファイルを上書きする}';

    protected $description = 'Fourmix Intelligence の設定ファイルを公開します';

    public function handle(): int
    {
        $this->call('vendor:publish', ['--tag' => 'fourmix-intelligence-config', '--force' => (bool) $this->option('force')]);
        $this->components->info('Fourmix Intelligence の設定を公開しました。接続情報は '.route('fourmix-intelligence.manage').' の管理画面で設定してください。');

        return self::SUCCESS;
    }
}
