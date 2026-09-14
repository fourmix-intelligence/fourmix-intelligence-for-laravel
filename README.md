# Fourmix Intelligence for Laravel

Fourmix Intelligence の企業向け AI、継続会話、資料同期、業務ツールを Laravel へ自然に組み込む公式パッケージです。Laravel AI SDK を置き換えるものではなく、Fourmix Intelligence で管理された AI と企業データを Laravel の設計に沿って利用できます。

## 対応環境

- PHP 8.3 以降
- Laravel 12 / 13

## インストール

```bash
composer config repositories.fourmix-intelligence vcs https://github.com/fourmix-intelligence/fourmix-intelligence-for-laravel
composer require fourmix-intelligence/laravel
php artisan fourmix-intelligence:install
```

Packagist への登録後は、最初のリポジトリ設定を省略できます。

設定ファイルを公開しない場合も環境変数だけで利用できます。

```dotenv
FOURMIX_INTELLIGENCE_URL=https://mcp.ai.fourmix.co.jp
FOURMIX_INTELLIGENCE_TOKEN=
FOURMIX_INTELLIGENCE_AGENT=
FOURMIX_INTELLIGENCE_DATASET=
FOURMIX_INTELLIGENCE_SYNC_TOKEN=
```

接続トークンと資料同期キーは用途を分けて発行してください。ブラウザーへ渡したり、URLやログへ記録したりしないでください。

## AI を利用する

```php
use FourmixIntelligence\Laravel\Facades\FourmixIntelligence;

$result = FourmixIntelligence::agent('sales-assistant')->ask('展示会向けの記念品を提案してください。');

echo $result->answer;
foreach ($result->data['items'] ?? [] as $item) {
    echo $item['product_url'];
}
```

継続会話では、初回応答の会話 ID と会話専用トークンを一緒に安全なサーバー側ストレージへ保存します。回答文だけでなく `$result->data` も保存すると、商品リンクや生成物を再表示できます。

```php
$next = FourmixIntelligence::agent('sales-assistant')
    ->conversation($result->conversationId, $result->customerToken)
    ->ask('その中で女性向けの展示会に合うものは？');
```

## 資料を同期する

```bash
php artisan fourmix-intelligence:knowledge:sync storage/app/knowledge.json
```

```json
{"records":[{"key":"guide","version":1,"operation":"replace","text":"# ご利用案内\n営業時間は9時から18時です。"}]}
```

外部キーは変えず、内容を更新するときだけ `version` を増やします。同期は非同期で処理されるため、受付応答を完了とみなさず状態も確認してください。

## Laravel の業務機能を AI へ許可する

任意のメソッドを自動公開しません。AI に許可するメソッドだけを属性で明示します。

```php
use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;

final class OrderTools
{
    #[FourmixIntelligenceTool(
        name: 'orders.lookup',
        description: '注文番号から現在の配送状況を確認します',
        scopes: ['orders:read']
    )]
    public function lookup(string $orderNumber): array
    {
        // 組織・利用者の権限を確認してから返します。
    }
}
```

更新や送信を行うツールは `requiresApproval: true` とし、アプリケーション側でも認可、確認、冪等性、監査を実装してください。

## 運用確認

```bash
php artisan fourmix-intelligence:doctor
```

会話専用トークン、接続トークン、同期キー、Webhook 秘密はログへ出力しません。HTTP クライアントのログを追加する場合も Authorization と本文中の秘密を必ずマスクしてください。

## ライセンス

MIT License
