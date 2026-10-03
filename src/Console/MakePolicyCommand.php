<?php

namespace FourmixIntelligence\Laravel\Console;

final class MakePolicyCommand extends MakeIntegrationClassCommand
{
    protected $signature = 'fi:make-policy {name=AiToolPolicy : 業務ツールの認可クラス名}';

    protected $description = '既定では業務を許可しない認可アダプターを生成します';

    public function handle(): int
    {
        $name = $this->argument('name');
        if (! is_string($name)) {
            return self::INVALID;
        }
        $result = $this->createClass($name, 'Policies', 'policy');
        if ($result === self::SUCCESS) {
            $this->line('ToolPolicy を生成したクラスへ bind し、既存の Policy・Gate と確認用の表示を実装してください。');
            $this->line('このテンプレートは個人アカウント向けです。システム接続では実行主体の解決も実装してください。');
        }

        return $result;
    }
}
