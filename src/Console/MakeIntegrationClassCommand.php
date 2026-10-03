<?php

namespace FourmixIntelligence\Laravel\Console;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use RuntimeException;

abstract class MakeIntegrationClassCommand extends Command
{
    /** @param array<string, string> $replacements */
    protected function createClass(string $name, string $directory, string $stub, array $replacements = []): int
    {
        $name = str_replace('/', '\\', $name);
        if (! preg_match('/^(?:[A-Z][A-Za-z0-9_]*\\\\)*[A-Z][A-Za-z0-9_]*$/D', $name)) {
            $this->components->error('クラス名は大文字で始まる半角英数字で指定してください。名前空間には / または \\ を使えます。');

            return self::INVALID;
        }
        $root = rtrim($this->laravel->getNamespace(), '\\').'\\';
        $qualified = str_starts_with($name, $root) ? $name : $root.$directory.'\\'.$name;
        $relative = substr($qualified, strlen($root));
        $separator = strrpos($qualified, '\\');
        if ($separator === false) {
            throw new RuntimeException('アプリケーションの名前空間を確認してください。');
        }
        try {
            $tokens = token_get_all('<?php namespace '.substr($qualified, 0, $separator).'; class '.substr($qualified, $separator + 1).' {}', TOKEN_PARSE);
            if ($tokens === []) {
                return self::INVALID;
            }
        } catch (\ParseError) {
            $this->components->error('PHP の予約語はクラス名に使用できません。');

            return self::INVALID;
        }
        $path = app_path(str_replace('\\', '/', $relative).'.php');
        $files = $this->laravel->make(Filesystem::class);
        if ($files->exists($path)) {
            $this->components->error('同じクラスが存在します。既存の実装は上書きしません。');

            return self::FAILURE;
        }
        $custom = base_path('stubs/fi.'.$stub.'.stub');
        $source = $files->exists($custom) ? $custom : __DIR__.'/../../stubs/'.$stub.'.stub';
        $content = strtr($files->get($source), [
            '{{ namespace }}' => substr($qualified, 0, $separator),
            '{{ class }}' => substr($qualified, $separator + 1),
            ...$replacements,
        ]);
        $files->ensureDirectoryExists(dirname($path));
        if ($files->put($path, $content) === false) {
            throw new RuntimeException('クラスを保存できませんでした。出力先の権限を確認してください。');
        }
        $this->components->info('クラスを生成しました。業務処理と認可を実装してから登録してください。');
        $this->line($path);
        $this->line($qualified);

        return self::SUCCESS;
    }
}
