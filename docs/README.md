# 開発者ガイド（日本語）

Fourmix Intelligence for Laravel は、接続・AI 呼出し・業務ツール・確認・チャット UI を組み込む SDK です。アプリケーションの業務モデルや権限は持ちません。次の順に導入すると、チャットだけの利用から双方向の業務連携まで進められます。

| ガイド | 内容 |
| --- | --- |
| [導入と接続](getting-started.md) | インストール、握手、複数接続、AI の許可と選択 |
| [AI API](ai-api.md) | 接続×AI、会話、ストリーミング応答、添付、ジョブ、対外向け AI |
| [業務ツールと認可](business-tools.md) | 属性、登録、スキーマ、Policy、確認と重複実行防止 |
| [UI と Artisan](ui-and-artisan.md) | 標準 UI、独立した設定、生成、配置、カスタマイズ |
| [テストと運用](testing-and-operations.md) | 合成データ、通信を偽装したテスト、移行、監視、障害対応 |
| [資料同期とWebhook受信](sync-and-webhooks.md) | 同期キー、JSON、受付と完了、署名、再送と結果不明 |
| [API・設定リファレンス](reference.md) | 公開メソッド、拡張インターフェース、設定、低レベル API |

## どこまで SDK が担当するか

SDK は、Fourmix Intelligence と Laravel の通信、接続単位の許可、本人の関連付け、公開ツールのメタデータ、確認依頼と実行履歴を担当します。開発者は、既存のログイン、アカウントの有効性、レコードの所有者、入力規則、業務処理、外部サービスの副作用を担当します。

ツール一覧は、登録された属性から自動生成します。全コントローラーや全ルートを自動公開する仕組みではありません。属性の `scopes` は権限の宣言であり、認可の実装ではありません。

## 二つの方向と二つの権限

| 方向 | AI | 許可を決める側 |
| --- | --- | --- |
| Fourmix Intelligence → Laravel | Fourmix Intelligence の個人・組織・ワークスペースの FinCube、または許可された Studio AI | Laravel が公開業務・実行主体・確認方法を決定 |
| Laravel → Fourmix Intelligence | 接続へ利用を許可された AI Studio の AI | Fourmix Intelligence が AI と資料・外部サービスの利用を決定し、Laravel が用途ごとに AI を選択 |

Fourmix Intelligence の組織やワークスペースと、Laravel 側の部署・組織は自動対応しません。Fourmix Intelligence 内で利用できる範囲が広くても、Laravel の実行主体の権限は増えません。ChatGPT などからの利用は Fourmix Intelligence の MCP を経由し、同じ Laravel の認可と確認を適用します。

## サンプルについて

例中の `App\Models\Note`、`App\Models\User`、既存 Policy は説明用です。SDK がこれらのテーブルや業務を追加することはありません。実際のアプリケーションの業務サービスと認可へ置き換えてください。

このガイドは現在のソースと公開 API に対応します。導入する版の [CHANGELOG](../CHANGELOG.md) と一緒に確認してください。
