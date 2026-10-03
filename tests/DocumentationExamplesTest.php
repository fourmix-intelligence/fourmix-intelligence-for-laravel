<?php

namespace FourmixIntelligence\Laravel\Tests;

use PHPUnit\Framework\TestCase;

final class DocumentationExamplesTest extends TestCase
{
    public function test_japanese_guide_php_examples_parse_and_local_document_links_exist(): void
    {
        $files = glob(__DIR__.'/../docs/*.md');
        self::assertNotEmpty($files);
        $examples = 0;
        foreach ($files as $file) {
            $markdown = file_get_contents($file);
            preg_match_all('/```php\n(.*?)\n```/s', $markdown, $blocks);
            foreach ($blocks[1] as $code) {
                $withoutComments = preg_replace('/^\s*\/\/[^\n]*$/m', '', $code);
                if (preg_match('/^\s*\x27[a-z_]+\x27\s*=>/', $withoutComments)) {
                    $code = 'return ['.$code.'];';
                } elseif (str_contains($code, 'public function') && ! str_contains($code, 'class ')) {
                    preg_match_all('/^use [^;]+;\s*$/m', $code, $imports);
                    $body = preg_replace('/^use [^;]+;\s*$/m', '', $code);
                    $code = implode("\n", $imports[0])."\nclass DocumentationExample {\n".$body."\n}";
                }
                self::assertNotEmpty(token_get_all('<?php '.$code, TOKEN_PARSE), basename($file));
                $examples++;
            }
            preg_match_all('/\]\(([^)]+)\)/', $markdown, $links);
            foreach ($links[1] as $link) {
                if (str_contains($link, '://') || str_starts_with($link, '#')) {
                    continue;
                }
                $target = explode('#', $link, 2)[0];
                self::assertFileExists(dirname($file).'/'.$target, basename($file).': '.$link);
            }
        }
        self::assertGreaterThanOrEqual(15, $examples);
    }
}
