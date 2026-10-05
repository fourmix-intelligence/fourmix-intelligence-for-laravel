# 資料同期とWebhook受信

[ガイド一覧](README.md)

## 三つの接続を区別する

管理画面で作成するネイティブ接続、資料庫専用の同期、独自ルートで受けるWebhookは別の契約です。ネイティブ接続があるだけでは同期キーを取得したりWebhookが自動配信されたりしません。会話の添付も共有資料庫の登録とは別です。

## 資料同期の準備

1. Fourmix Intelligenceで同期先の文章資料庫と専用同期キーを用意します。利用するAIにもその資料庫を割り当てます。
2. アプリの秘密管理で `fourmix-intelligence.url`、`dataset`、`sync_token` を構成します。設定ファイルの環境変数は `FOURMIX_INTELLIGENCE_URL`、`FOURMIX_INTELLIGENCE_DATASET`、`FOURMIX_INTELLIGENCE_SYNC_TOKEN` です。キーをソースやブラウザーへ含めません。
3. アプリが公開してよい文書だけをJSONへ出力します。文書の `key` は同じ文書で維持し、変更時には `version` を増やします。

```json
{"records":[{"key":"opening-hours","version":1,"operation":"replace","text":"# 営業時間\n平日9時から18時です。"}]}
```

```bash
php artisan fi:knowledge:sync storage/app/knowledge.json --dataset=<資料庫ID> --key=<受付UUID> --no-interaction
```

`--key` は同じ受付を再送するとき維持します。文書の外部キーとは別です。コマンドの成功は同期受付で、検索への反映完了ではありません。

```php
use FourmixIntelligence\Laravel\Facades\FourmixIntelligence;

$client = FourmixIntelligence::client();
$receipt = $client->syncDocuments($datasetId, $authorizedRecords, $requestId);
$jobId = $receipt['id'] ?? $receipt['job_id'] ?? null;
if (is_string($jobId)) {
    $status = $client->syncStatus($datasetId, $jobId);
}
```

応答の状態とエラーを確認し、受付だけで登録済みと表示しません。削除・公開範囲の変更も運用手順に含め、不要な文書が検索に残らないよう確認します。資料庫と同期キーの対象が一致しない場合、キーの権限・有効性を確認してください。

## Webhook受信ルート

`FourmixIntelligence\Laravel\Http\Middleware\VerifyFourmixIntelligenceWebhook` は、アプリが用意する受信ルートへ適用する独立したミドルウェアです。現在のプラットフォームがこの契約のWebhookを自動配信する機能ではありません。送信側と契約を合わせてから利用します。ブラウザー向けのCSRF対象ルートと分け、アプリのLaravel版に合わせて受信ルートを登録してください。

| 項目 | 契約 |
| --- | --- |
| 本文 | JSON。`event_id` は英数字・`_ . : -`、1～128文字 |
| 時刻 | `X-Fourmix-Intelligence-Timestamp` にUnix時刻 |
| 署名 | `X-Fourmix-Intelligence-Signature` に `timestamp + "." + 生の本文` のHMAC-SHA256、小文字hex |
| 時刻差 | 既定300秒。送受信サーバーの時計を合わせる |
| 境界 | `webhooks.connection_id` などの構成で固定。利用者の本文から切り替えない |
| 応答 | 64 KiB以内のJSON HTTP応答。ストリームは不可 |

構成の `webhooks.secret` と `webhooks.connection_id` は秘密管理から設定し、複数インスタンスで永続DBを共有します。必要なら `webhooks.database_connection` を指定し、業務トランザクションの外側へ受領記録を置きます。新規導入は初期migrationを一度だけ適用し、既存導入は増分migrationで移行します。

## 再送と結果不明

同じ接続の受信ルート全体で `event_id` を一意にし、再送で本文とIDを変更しません。成功した再送には保存済み本文・HTTP status・Content-Typeを返し、業務処理を再実行しません。同じIDの別本文、処理中、結果不明は409です。例外・5xx・ストリーム・応答上限超過は結果不明として残ります。

409を無条件に再送せず、受領記録と実データを照合してください。秘密の変更、URL別名、キャッシュ削除では受領履歴を初期化しません。外部APIに副作用がある処理では、相手側の重複排除・受付ID・結果照会も設計します。

## 導入先での確認

同期は合成文書で受付・完了・更新・削除・権限拒否を確認します。Webhookは正しい署名、異なる本文、古い時刻、同じIDの再送、処理中、例外、応答上限をHTTPテストで確認し、モデル課金や実顧客への更新を使いません。送信元、本文、秘密をログへ出さず、受付IDと状態を調査に使います。
