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
FOURMIX_INTELLIGENCE_BRIDGE_ENABLED=false
FOURMIX_INTELLIGENCE_BRIDGE_SECRET=
FOURMIX_INTELLIGENCE_BRIDGE_APPLICATION_ID=
FOURMIX_INTELLIGENCE_BRIDGE_WORKSPACE_ID=
FOURMIX_INTELLIGENCE_BRIDGE_CONNECTION_ID=
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

属性にはモデルへ渡す最小限の入力定義も指定します。登録したクラスだけが候補となり、さらに `bridge.enabled_operations` で公開する機能を絞れます。

```php
#[FourmixIntelligenceTool(
    name: 'orders.change_shipping_date',
    description: '注文の出荷予定日を変更します',
    scopes: ['orders:write'],
    requiresApproval: true,
    readOnly: false,
    inputSchema: [
        'type' => 'object',
        'properties' => [
            'orderNumber' => ['type' => 'string', 'maxLength' => 40],
            'shippingDate' => ['type' => 'string', 'maxLength' => 10],
        ],
        'required' => ['orderNumber', 'shippingDate'],
    ],
    domain: 'orders',
    keywords: ['注文', '出荷', '配送'],
)]
public function changeShippingDate(string $orderNumber, string $shippingDate): array
{
    // Laravel 側でも現在の利用者・組織・注文に対する認可を行います。
}
```

`config/fourmix-intelligence.php` へハンドラーを登録し、管理対象にする操作だけを選びます。

```php
'bridge' => [
    'enabled' => true,
    'secret' => env('FOURMIX_INTELLIGENCE_BRIDGE_SECRET'),
    'tool_handlers' => [App\FourmixTools\OrderTools::class],
    'enabled_operations' => ['orders.lookup', 'orders.change_shipping_date'],
],
```

更新や送信を行うツールは `requiresApproval: true` とします。書込みには UUID の `idempotency_key` が自動追加され、同じ依頼の再送でも同じ値を使用します。共有キーは32文字以上のランダム値にし、Fourmix Intelligence のワークスペース接続と同じ値を登録します。Laravel から Studio AI を呼ぶ既存機能と、この業務公開機能は独立して有効・無効を選べます。

### 利用者・許可・確認画面

次期メジャー版の業務接続は、共有キーだけで業務を実行できません。導入先で `Tools\ToolPolicy` を実装し、サービスプロバイダーでその実装を bind してください。既定の `DenyToolPolicy` はすべて拒否します。

- `resolve()`：署名経路で届いた Fourmix Intelligence 利用者を、`UserBindings` の関連付けと現在のアプリケーション利用者へ解決します。モデルが指定した利用者IDを信頼してはいけません。
- `authorize()`：毎回、現在のアカウント状態、組織、対象レコード、業務権限を検査します。継続許可でもこの検査を省略しません。
- `preview()`：確認する対象・変更前の情報・入力値を返します。実行前に再取得し、変更されていれば新しい依頼を要求します。
- `reviewUrl()`：本人だけが閲覧・確認できるアプリケーションの確認画面を返します。確認用 route は通常のログインと CSRF を必要とし、AI ツールには登録しません。

```sh
php artisan vendor:publish --tag=fourmix-intelligence-business
php artisan migrate
```

導入先のログイン済み画面で、`UserBindings::issue()` により10分有効な関連付けコードを発行します。本人が Fourmix Intelligence の `/connections/laravel-user?connection=<接続ID>` へコードを入力して関連付けます。コードを URL やログへ記録しません。両側の解除画面から解除でき、以後の要求と未実行の確認を拒否します。

`ToolConsent::replace()` は本人の設定画面からのみ呼び、操作ごとに `disabled`、`review`、`automatic` を保存します。初期値はすべて `disabled`。`automatic` は金額・削除・権限変更などへの継続許可を明示確認した場合だけ保存してください。許可の変更も導入先の監査へ記録してください。画面表示用の `modes()` は1回の DB 読取りで取得し、実行時の `mode()` は都度最新の値を確認します。

`ToolExecutor` は関連付け済み利用者、操作許可、現在の業務権限を合わせて検査します。`confirmation_required` の返却は保存完了ではありません。本人の画面で `confirm()` / `reject()` を呼び、`succeeded` を確認してください。確認は15分で期限切れになります。受付番号は利用者ごとに一意で、同じ番号の別入力は409です。`receipt()` と署名付き `POST /fourmix-intelligence/v1/receipts/{受付番号}` は状態だけを読み、再実行しません。

業務保存と実行結果は同じ DB トランザクションで処理します。ハンドラーが外部サービスを更新する場合、そのサービス側にも同じ受付番号による重複排除が必要です。例外・実行途中の停止は `unknown_effect` / `running` として扱い、結果を確認するまで新しい番号で同じ書込みを依頼しないでください。受領記録は自動削除せず、削除を伴う migration の巻戻しも拒否します。DB の履歴と暗号化データを読むための `APP_KEY` を運用方針に沿って維持してください。

操作のスキーマ・説明・版が変われば `automatic` は `review` へ戻り、以前の確認依頼は実行できません。ハンドラーの実装が同じ定義のまま意味を変える場合は、属性の `version` またはコールバック定義の `version` を必ず更新してください。新しい操作を発見しても既存の利用者許可は増えません。

### ネイティブ会話

`Http\NativeApplicationClient` は、サーバーから PHP コントロールプレーンへ会話・履歴・状態を署名付きで送ります。設定は `FOURMIX_INTELLIGENCE_PLATFORM_URL`、`FOURMIX_INTELLIGENCE_TENANT`、必要に応じて `FOURMIX_INTELLIGENCE_UI_URL`。`PLATFORM_URL` は AI Python サービスや MCP の URL ではなく PHP API の URL です。共有キーと関連付けIDはブラウザーへ渡しません。

Fourmix Intelligence 側では関連付け済みの本人・一つの接続・一つの会話に限定した短時間トークンで FinCube を実行します。この経路では個人ノート、他の会話、他のワークスペースの知識、別の接続をモデルへ渡しません。通常の Fourmix Intelligence / MCP 利用では、それぞれの画面で選択した権限に加えて、同じアプリケーションの利用者許可と業務認可を検査します。アプリケーションのブラウザーを閉じても利用できますが、双方のサーバーと接続先 API は稼働している必要があります。

業務の操作名、金額の意味、計算、帳票、画面は導入先へ置きます。SDK へ特定の業務を追加する必要はありません。`ValidationSchema::fromRules()` で既存の Laravel 規則から入力メタデータを作れますが、DB の存在・一意性、条件付き規則、独自ルールをすべて JSON Schema へ変換する機能ではありません。保存時には元の FormRequest と業務処理を必ず実行してください。

## 運用確認

### 業務連携の接続先を固定する

管理者は Fourmix Intelligence のワークスペースIDと、そのワークスペースで発行した接続IDを `FOURMIX_INTELLIGENCE_BRIDGE_WORKSPACE_ID` / `FOURMIX_INTELLIGENCE_BRIDGE_CONNECTION_ID` に設定してください。表示名ではなく API が返す `identify` を使用します。両方の設定が必要です。設定後は `php artisan config:cache` を実行し、常駐プロセスを再起動します。

最初の署名要求による自動固定は行いません。キャッシュを消去しても設定された接続先だけを受け付け、別ワークスペースまたは別接続は拒否します。接続先を変更する際は、業務連携を無効にして旧接続を解除し、共有キーを更新した上で両IDを管理者が変更してから再び有効にしてください。共有キーの変更だけで接続先が自動的に変わることはありません。

```bash
php artisan fourmix-intelligence:doctor
```

会話専用トークン、接続トークン、同期キー、Webhook 秘密はログへ出力しません。HTTP クライアントのログを追加する場合も Authorization と本文中の秘密を必ずマスクしてください。

## ライセンス

MIT License

## Webhook 受信と再送

この SDK の `VerifyFourmixIntelligenceWebhook` は導入先が選んだ受信 route に適用するミドルウェアです。現在のプラットフォームが自動的にこの契約の Webhook を送る設定はありません。ネイティブ業務操作の署名契約とは別の機能です。

導入先と送信元で、次の契約を合わせてください。

- 本文は JSON。トップレベルの `event_id` は英数字、`_`、`.`、`:`、`-` の 1〜128 文字で、同じ接続の全受信 route を通して一意にします。同じ業務イベントの再送では本文のバイト列と ID を変更しません。
- `X-Fourmix-Intelligence-Timestamp` は Unix 時刻、`X-Fourmix-Intelligence-Signature` は `timestamp + "." + 生の本文` の HMAC-SHA256（小文字 hex）です。署名の許容時間は既定 300 秒。再送では時刻と署名だけを更新できます。
- `FOURMIX_INTELLIGENCE_WEBHOOK_CONNECTION_ID` を受信する接続ごとに固定します。別の独立した受信処理には別 ID を使用します。秘密の変更、URL の別名、Cache の削除では受領記録をリセットしません。
- 複数インスタンスが共有する永続 DB を使用します。必要なら `FOURMIX_INTELLIGENCE_WEBHOOK_DATABASE_CONNECTION` に Laravel の接続名を指定します。業務トランザクションの外側にこのミドルウェアを配置してください。

```sh
php artisan vendor:publish --tag=fourmix-intelligence-webhooks
php artisan migrate
```

業務連携の4表と Webhook 受領記録の表は `0001_01_01_000000_create_fourmix_intelligence_tables.php` に初期構造として定義します。両方の公開タグは同じ migration を公開するため、両機能を使う場合も適用は1回です。業務連携の表はアプリケーションの既定 DB、Webhook の表は `webhooks.database_connection` で指定した DB に作成します。どちらの機能も使用しない導入先では公開・適用は不要です。既に適用した業務アプリケーション側の migration 履歴は変更しません。

受信 route は JSON の HTTP 応答（本文 64 KiB 以内）を返すようにしてください。成功済みの再送には保存した本文、status、Content-Type を返し、業務処理を呼び出しません。同じ ID に別の本文を送ると 409、処理中・結果不明の再送も 409 です。例外、5xx、ストリーム、上限を超えた応答は結果不明として残します。送信元は 409 を無条件に繰り返さず、実行結果を確認してください。

受領記録は自動削除せず、接続終了まで保持します。これにより遅い再送でも二重実行を防ぎます。削除が必要な場合は送信元の再送停止を確認し、導入先の運用者が実行結果と保存方針を判断してください。結果不明の行を削除して自動再実行させないでください。ミドルウェアはリダイレクト、Cookie、独自応答ヘッダーの再現を目的としません。
