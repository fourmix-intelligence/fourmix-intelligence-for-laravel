<?php

namespace FourmixIntelligence\Laravel\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\UniqueConstraintViolationException;
use Symfony\Component\HttpFoundation\Response;

final class VerifyFourmixIntelligenceWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('fourmix-intelligence.webhooks.secret', '');
        $timestamp = (string) $request->header('X-Fourmix-Intelligence-Timestamp', '');
        $signature = (string) $request->header('X-Fourmix-Intelligence-Signature', '');
        $tolerance = (int) config('fourmix-intelligence.webhooks.tolerance_seconds', 300);
        if ($secret === '' || !ctype_digit($timestamp) || abs(time() - (int) $timestamp) > $tolerance) abort(401);
        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);
        if (!hash_equals($expected, $signature)) abort(401);
        abort_unless($request->isJson(), 422);
        // イベント ID も署名対象の本文から取得する。未署名ヘッダーは重複判定に使わない。
        $event = $request->json('event_id');
        abort_unless(is_string($event) && preg_match('/\A[a-zA-Z0-9_.:-]{1,128}\z/D', $event), 422);
        $connection = trim((string) config('fourmix-intelligence.webhooks.connection_id'));
        abort_if($connection === '', 503, 'Webhook の接続識別子を設定してください。');
        $db = DB::connection(config('fourmix-intelligence.webhooks.database_connection'));
        abort_if($db->transactionLevel() > 0, 503, 'Webhook の重複判定は業務トランザクションの外側に配置してください。');
        $key = hash('sha256', json_encode([$connection, $event], JSON_THROW_ON_ERROR));
        $digest = hash('sha256', $request->getContent());
        try {
            $db->table('fourmix_intelligence_webhook_receipts')->insert([
                'id' => $key, 'payload_hash' => $digest, 'status' => 'processing',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        } catch (UniqueConstraintViolationException) {
            $receipt = $db->table('fourmix_intelligence_webhook_receipts')->where('id', $key)->first();
            abort_unless($receipt && hash_equals($receipt->payload_hash, $digest), 409, '同じイベント ID の内容が一致しません。');
            abort_unless($receipt->status === 'completed', 409, '処理中または結果確認が必要なイベントです。');
            return response($receipt->response_body, $receipt->response_status, ['Content-Type' => $receipt->content_type]);
        }
        try {
            $response = $next($request);
            $body = $response->getContent();
            // ストリーム、巨大な応答、失敗応答は結果不明として保持し、自動再実行しない。
            $completed = is_string($body) && strlen($body) <= 65536 && $response->getStatusCode() < 500;
            $db->table('fourmix_intelligence_webhook_receipts')->where('id', $key)->update([
                'status' => $completed ? 'completed' : 'unknown',
                'response_status' => $completed ? $response->getStatusCode() : null,
                'response_body' => $completed ? $body : null,
                'content_type' => $completed ? $response->headers->get('Content-Type', 'application/json') : null,
                'updated_at' => now(),
            ]);
            return $response;
        } catch (\Throwable $exception) {
            $db->table('fourmix_intelligence_webhook_receipts')->where('id', $key)->update(['status' => 'unknown', 'updated_at' => now()]);
            throw $exception;
        }
    }
}

