<?php

namespace FourmixIntelligence\Laravel\Console;

use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Throwable;

final class MakeUiCommand extends Command
{
    protected $signature = 'fi:make-ui {name : 半角小文字・数字・ハイフンの固有名} {--type=page : page または floating}';

    protected $description = 'カスタマイズできる名前付きチャット画面と設定を生成します';

    public function handle(Filesystem $files): int
    {
        $name = $this->argument('name');
        $type = $this->option('type');
        if (! is_string($name) || ! is_string($type) || ! preg_match('/^[a-z][a-z0-9-]{0,63}$/D', $name) || ! in_array($type, ['page', 'floating'], true)) {
            $this->components->error('名前は小文字で始まる半角英数字・ハイフン64文字以内、種類はpageまたはfloatingを指定してください。');

            return self::INVALID;
        }
        $viewPath = resource_path('views/components/fi/'.$name.'.blade.php');
        $configPath = config_path('fi-ui/'.$name.'.php');
        if (isset(app(UiSurfaces::class)->definitions()[$name]) || $files->exists($viewPath) || $files->exists($configPath)) {
            $this->components->error('同じ名前のテンプレートまたは設定が存在します。別の名前を指定してください。');

            return self::FAILURE;
        }
        $component = $type === 'page' ? 'chat' : 'floating-chat';
        $layout = $type === 'page' ? ' layout="fill"' : '';
        $template = "{{-- 自由に変更できるチャットUIです。AIの選択は接続管理で行います。 --}}\n<x-fourmix-intelligence::{$component} surface=\"{$name}\" :alias=\"\$alias\" :initial-prompt=\"\$initialPrompt\"{$layout} {{ \$attributes }} />\n";
        $definition = ['type' => $type, 'alias' => 'ui-'.$name, 'enabled' => true, 'title' => 'AIアシスタント', 'view' => 'components.fi.'.$name];
        $config = "<?php\n\n// チャットの種類・表示・テンプレートを設定します。接続とAIは管理画面で設定します。\nreturn ".var_export($definition, true).";\n";
        try {
            $files->ensureDirectoryExists(dirname($viewPath));
            $files->ensureDirectoryExists(dirname($configPath));
            $files->put($viewPath, $template);
            $files->put($configPath, $config);
        } catch (Throwable $exception) {
            $files->delete($viewPath, $configPath);
            throw $exception;
        }
        $this->components->info('チャットのテンプレートと設定を生成しました。ルートや画面への配置は変更していません。');
        $this->line($viewPath);
        $this->line($configPath);
        $this->line('<x-fourmix-intelligence::surface name="'.$name.'" /> を必要な場所に配置してください。');
        $this->line('接続管理でこの画面の接続とAIを設定してください。設定をキャッシュしている場合はconfig:clearが必要です。');

        return self::SUCCESS;
    }
}
