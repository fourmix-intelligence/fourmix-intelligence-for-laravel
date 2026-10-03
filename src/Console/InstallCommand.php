<?php

namespace FourmixIntelligence\Laravel\Console;

use Illuminate\Console\Command;

final class InstallCommand extends Command
{
    protected $signature = 'fi:install {--force : 既存の設定ファイルを上書きする} {--with-migration : 新規導入用のマイグレーションも公開する}';

    protected $description = 'Fourmix Intelligence の設定ファイルを公開します';

    public function handle(): int
    {
        $result = $this->call('vendor:publish', ['--tag' => 'fourmix-intelligence-config', '--force' => (bool) $this->option('force')]);
        if ($result !== self::SUCCESS) {
            return $result;
        }
        if ($this->option('with-migration')) {
            $result = $this->call('vendor:publish', ['--tag' => 'fourmix-intelligence-business', '--force' => false]);
            if ($result !== self::SUCCESS) {
                return $result;
            }
            $this->line('既存のマイグレーションは上書きしません。新規導入時は php artisan migrate を実行してください。');
        }
        $this->components->info('Fourmix Intelligence の設定を公開しました。接続情報は '.route('fourmix-intelligence.manage').' の管理画面で設定してください。');

        return self::SUCCESS;
    }
}
