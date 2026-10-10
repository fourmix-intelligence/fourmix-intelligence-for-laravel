<?php

namespace FourmixIntelligence\Laravel\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ApiException extends FourmixIntelligenceException
{
    public function __construct(string $message, public readonly int $status = 0, public readonly ?string $requestId = null)
    {
        parent::__construct($message, $status);
    }

    public function render(Request $request): JsonResponse|false
    {
        if (! $request->expectsJson()) {
            return false;
        }
        $status = in_array($this->status, [403, 404, 409, 410, 413, 415, 422, 429, 503], true) ? $this->status : 502;
        $message = match ($status) {
            403 => 'この機能を利用できません。接続と利用設定を確認してください。',
            404, 410 => '対象が見つからないか、利用できなくなっています。会話履歴を確認してください。',
            409 => '接続または設定が変更されました。現在の設定を確認してください。',
            413, 415, 422 => '送信内容を確認してください。',
            429 => '処理が混み合っています。少し待ってからもう一度お試しください。',
            503 => '接続先との通信を完了できませんでした。会話履歴と操作結果を確認してください。',
            default => '応答を完了できませんでした。会話履歴と操作結果を確認してください。',
        };

        return response()->json(['message' => $message], $status)->header('Cache-Control', 'private, no-store');
    }
}
