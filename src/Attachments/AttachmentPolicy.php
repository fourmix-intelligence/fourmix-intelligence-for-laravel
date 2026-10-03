<?php

namespace FourmixIntelligence\Laravel\Attachments;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use ZipArchive;

/** 会話添付だけを許可します。最終的な内容検証と非公開保管は FI が行います。 */
final class AttachmentPolicy
{
    private const TYPES = [
        'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp',
        'pdf' => 'application/pdf', 'txt' => 'text/plain', 'md' => 'text/plain', 'csv' => 'text/csv', 'tsv' => 'text/tab-separated-values',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    /** @return array{extensions: list<string>, max_bytes: int, max_files: int} */
    public function local(): array
    {
        $maxBytes = max(1, min(20 * 1024 * 1024, (int) config('fourmix-intelligence.attachments.max_bytes', 10 * 1024 * 1024)));
        $uploadBytes = $this->phpLimit((string) ini_get('upload_max_filesize'));
        $postBytes = $this->phpLimit((string) ini_get('post_max_size'));
        if ($uploadBytes > 0) {
            $maxBytes = min($maxBytes, $uploadBytes);
        }
        if ($postBytes > 0) {
            $maxBytes = min($maxBytes, max(1, $postBytes - 65536));
        }

        return ['extensions' => array_values(array_intersect(array_keys(self::TYPES), (array) config('fourmix-intelligence.attachments.extensions', array_keys(self::TYPES)))),
            'max_bytes' => $maxBytes,
            'max_files' => max(1, min(8, (int) config('fourmix-intelligence.attachments.max_files', 5)))];
    }

    /** @param array<string, mixed> $remote
     * @return array<string, mixed>
     */
    public function intersect(array $remote): array
    {
        $local = $this->local();
        $extensions = array_map(static fn (mixed $value): string => is_string($value) ? ltrim(strtolower($value), '.') : '', (array) ($remote['extensions'] ?? []));

        return ['extensions' => array_values(array_intersect($local['extensions'], $extensions)),
            'max_bytes' => min($local['max_bytes'], max(0, (int) ($remote['max_bytes'] ?? 0))),
            'max_files' => min($local['max_files'], max(0, (int) ($remote['max_files'] ?? 0))),
            'context_bytes' => max(0, min(40 * 1024 * 1024, (int) ($remote['context_bytes'] ?? 0))),
            'retention_days' => isset($remote['retention_days']) ? max(1, (int) $remote['retention_days']) : null];
    }

    /** @return array{name: string, content_base64: string} */
    public function encode(UploadedFile $file): array
    {
        $name = basename(str_replace('\\', '/', $file->getClientOriginalName()));
        $name = preg_replace('/[\x00-\x1f\x7f]/u', '', $name) ?? '';
        abort_unless($name !== '' && strlen($name) <= 240, 422, 'ファイル名を確認してください。');
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $policy = $this->local();
        if (! in_array($extension, $policy['extensions'], true)) {
            throw ValidationException::withMessages(['file' => 'この形式は添付できません。画像・PDF・Office文書・テキストを選んでください。']);
        }
        abort_unless($file->isValid() && $file->getSize() > 0 && $file->getSize() <= $policy['max_bytes'], 413, 'ファイルが空、または添付サイズの上限を超えています。');
        $stream = fopen($file->getPathname(), 'rb');
        abort_unless(is_resource($stream), 422, 'ファイルを読み取れません。');
        try {
            $body = stream_get_contents($stream, $policy['max_bytes'] + 1);
        } finally {
            fclose($stream);
        }
        abort_unless(is_string($body) && $body !== '' && strlen($body) <= $policy['max_bytes'], 413, '添付のサイズが上限を超えています。');
        $this->validateContent($file->getPathname(), $extension, $body);

        return ['name' => $name, 'content_base64' => base64_encode($body)];
    }

    public function mime(string $extension): ?string
    {
        return self::TYPES[strtolower($extension)] ?? null;
    }

    private function phpLimit(string $value): int
    {
        if (preg_match('/^([0-9]+(?:\.[0-9]+)?)\s*([KMG]?)$/i', trim($value), $matches) !== 1) {
            return 0;
        }
        $multiplier = match (strtoupper($matches[2])) {
            'K' => 1024, 'M' => 1024 * 1024, 'G' => 1024 * 1024 * 1024, default => 1,
        };

        return (int) ((float) $matches[1] * $multiplier);
    }

    private function validateContent(string $path, string $extension, string $body): void
    {
        $valid = false;
        if (in_array($extension, ['png', 'jpg', 'jpeg', 'webp'], true)) {
            $image = @getimagesizefromstring($body);
            $valid = is_array($image) && $image['mime'] === self::TYPES[$extension]
                && (float) $image[0] * $image[1] <= 40_000_000;
        } elseif ($extension === 'pdf') {
            $valid = str_starts_with($body, '%PDF-') && str_contains(substr($body, -2048), '%%EOF');
        } elseif (in_array($extension, ['docx', 'xlsx', 'pptx'], true)) {
            abort_unless(class_exists(ZipArchive::class), 503, 'Office文書の検証には PHP の zip 拡張が必要です。');
            $archive = new ZipArchive;
            if ($archive->open($path) === true) {
                try {
                    $expected = ['docx' => 'word/document.xml', 'xlsx' => 'xl/workbook.xml', 'pptx' => 'ppt/presentation.xml'];
                    $valid = $archive->numFiles <= 3000 && $archive->locateName('[Content_Types].xml') !== false && $archive->locateName($expected[$extension]) !== false;
                    $expanded = 0;
                    for ($index = 0; $valid && $index < $archive->numFiles; $index++) {
                        $entry = $archive->statIndex($index);
                        if ($entry === false) {
                            $valid = false;
                            break;
                        }
                        $expanded += $entry['size'];
                        $valid = $expanded <= 50 * 1024 * 1024 && $entry['encryption_method'] === 0 && ! str_contains(strtolower($entry['name']), 'vbaproject');
                    }
                } finally {
                    $archive->close();
                }
            }
        } else {
            $text = preg_match('//u', $body) === 1 ? $body : (function_exists('iconv') ? @iconv('CP932', 'UTF-8', $body) : false);
            $valid = is_string($text) && ! str_contains($body, "\0") && preg_match('/[\x01-\x08\x0b\x0e-\x1f]/', $body) !== 1;
        }
        if (! $valid) {
            throw ValidationException::withMessages(['file' => 'ファイルの拡張子と内容が一致しません。形式・破損・暗号化の有無を確認してください。']);
        }
    }
}
