<?php

namespace FourmixIntelligence\Laravel\Console;

use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Console\Command;

final class ToolsCommand extends Command
{
    protected $signature = 'fi:tools {--json : 機械可読な公開候補一覧を表示する}';

    protected $description = '登録済みの業務ツールを通信や実行なしで確認します';

    public function handle(ToolRegistry $registry): int
    {
        $enabled = array_values(array_filter((array) config('fourmix-intelligence.bridge.enabled_operations', ['*']), 'is_string'));
        $tools = $registry->manifest($enabled);
        if ($this->option('json')) {
            $this->line(json_encode($tools, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

            return self::SUCCESS;
        }
        $this->table(['操作', '業務権限', '種類', '確認', '利用対象'], array_map(static fn (array $tool): array => [
            $tool['name'], implode(', ', $tool['scopes'] ?? []), $tool['read_only'] ? '参照' : '更新',
            ($tool['requires_approval'] ?? false) ? '確認対象（接続の設定に従う）' : '接続の設定に従う', implode(', ', $tool['audiences']),
        ], $tools));
        $this->line('公開候補: '.count($tools).'件。実際に使える業務は、接続の許可とアプリケーションの認可で確認します。');

        return self::SUCCESS;
    }
}
