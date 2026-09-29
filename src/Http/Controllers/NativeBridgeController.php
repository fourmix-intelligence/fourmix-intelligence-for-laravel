<?php

namespace FourmixIntelligence\Laravel\Http\Controllers;

use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

final class NativeBridgeController extends Controller
{
    public function manifest(Request $request, ToolRegistry $tools): JsonResponse
    {
        $this->authorizeRequest($request);

        return response()->json([
            'protocol' => 'fourmix-laravel/1.0',
            'revision' => max(1, (int) config('fourmix-intelligence.bridge.revision', 1)),
            'application' => ['id' => $this->applicationId(), 'version' => app()->version()],
            'capabilities' => $tools->manifest($this->enabledOperations()),
        ]);
    }

    public function execute(Request $request, string $operation, ToolRegistry $tools): JsonResponse
    {
        $this->authorizeRequest($request);
        // 連携要求は Fourmix Intelligence 側から届くため、接続元IPで数えると
        // 複数組織が同じ上限を共有する。署名で検証済みの接続単位で制限する。
        $limit = 'fourmix-native:'.hash('sha256', implode("\n", [
            (string) $request->header('X-Fourmix-Workspace', ''),
            (string) $request->header('X-Fourmix-Connection', ''),
        ]));
        abort_if(RateLimiter::tooManyAttempts($limit, 120), 429, '処理が混み合っています。');
        RateLimiter::hit($limit, 60);
        $arguments = $request->input('arguments', []);
        abort_unless(is_array($arguments), 422, 'arguments の形式を確認してください。');

        return response()->json(['data' => $tools->execute($operation, $arguments, $this->enabledOperations())]);
    }

    private function authorizeRequest(Request $request): void
    {
        $secret = (string) config('fourmix-intelligence.bridge.secret');
        abort_unless(strlen($secret) >= 32, 503, 'Fourmix Intelligence 連携は設定されていません。');
        $timestamp = (string) $request->header('X-Fourmix-Timestamp', '');
        $nonce = (string) $request->header('X-Fourmix-Nonce', '');
        $workspace = (string) $request->header('X-Fourmix-Workspace', '');
        $connection = (string) $request->header('X-Fourmix-Connection', '');
        $provided = (string) $request->header('X-Fourmix-Signature', '');
        abort_unless(ctype_digit($timestamp) && abs(time() - (int) $timestamp) <= 300, 403, '署名の有効期限が切れています。');
        abort_unless($nonce !== '' && strlen($nonce) <= 100 && $workspace !== '' && $connection !== '', 403, '署名情報が不足しています。');
        $canonical = implode("\n", [
            $timestamp, $nonce, strtoupper($request->method()), '/'.$request->path(),
            $workspace, $connection, hash('sha256', $request->getContent()),
        ]);
        abort_unless(hash_equals('v1='.hash_hmac('sha256', $canonical, $secret), $provided), 403, '署名を確認できませんでした。');
        abort_unless(Cache::add('fourmix-native-nonce:'.hash('sha256', $nonce), true, 600), 403, '同じ要求は再実行できません。');

        $bindingKey = 'fourmix-native-binding';
        $binding = Cache::get($bindingKey);
        $current = hash('sha256', $workspace."\n".$connection);
        abort_if(is_string($binding) && ! hash_equals($binding, $current), 409, '別の Fourmix Intelligence 接続には変更できません。');
        Cache::forever($bindingKey, $current);
    }

    /** @return list<string> */
    private function enabledOperations(): array
    {
        $configured = config('fourmix-intelligence.bridge.enabled_operations', ['*']);

        return is_array($configured) ? array_values(array_filter($configured, 'is_string')) : [];
    }

    private function applicationId(): string
    {
        $configured = trim((string) config('fourmix-intelligence.bridge.application_id'));
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $configured)) {
            return strtolower($configured);
        }
        $hex = hash('sha256', (string) config('app.key').'|'.(string) config('app.url'));

        return substr($hex, 0, 8).'-'.substr($hex, 8, 4).'-5'.substr($hex, 13, 3).'-a'.substr($hex, 17, 3).'-'.substr($hex, 20, 12);
    }
}
