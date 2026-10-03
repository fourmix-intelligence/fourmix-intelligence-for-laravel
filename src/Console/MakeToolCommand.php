<?php

namespace FourmixIntelligence\Laravel\Console;

final class MakeToolCommand extends MakeIntegrationClassCommand
{
    protected $signature = 'fi:make-tool {name : ツールクラス名} {--operation= : 公開する操作名（例: orders.lookup）}';

    protected $description = '属性付きの業務ツールクラスを生成します';

    public function handle(): int
    {
        $operation = $this->option('operation');
        if (! is_string($operation) || ! preg_match('/^[a-z][a-z0-9_.-]{2,127}$/D', $operation)) {
            $this->components->error('--operation に半角小文字の操作名を指定してください。例: orders.lookup');

            return self::INVALID;
        }
        $name = $this->argument('name');
        if (! is_string($name)) {
            return self::INVALID;
        }
        $result = $this->createClass($name, 'Tools', 'tool', [
            '{{ operation }}' => $operation,
            '{{ scope }}' => explode('.', $operation, 2)[0].':read',
        ]);
        if ($result === self::SUCCESS) {
            $this->line('config/fourmix-intelligence.php の bridge.tool_handlers に生成したクラスを登録してください。');
            $this->line('fi:tools で公開候補を確認できます。接続や業務権限は自動付与しません。');
        }

        return $result;
    }
}
