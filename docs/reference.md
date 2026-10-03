# API・設定リファレンス

[ガイド一覧](README.md)

## Facade と接続

名前空間は `FourmixIntelligence\Laravel\Facades\FourmixIntelligence` です。

| メソッド | 戻り値・用途 |
| --- | --- |
| `connection(string $name)` | 接続名または UUID を指定した `Connection` |
| `agent(?string $name = null)` | 本人の設定済み呼び出し名を使う `Agent` |
| `client()` | 明示構成用の低レベル `Http\FourmixIntelligenceClient` |

| Connection | 用途 |
| --- | --- |
| `forUser(ToolContext $context)` | 信頼できるアプリコードから実行主体を指定 |
| `agents()` | その接続に現在許可された AI のメタデータ一覧 |
| `agent(string $name)` | Fourmix Intelligence の slug・identify・grant_id で `Agent` を取得 |

## Agent

| メソッド | 用途 |
| --- | --- |
| `onConnection(string $connection)` | 接続を明示する。通常は `connection()->agent()` を使用 |
| `forUser(ToolContext $context)` | HTTP 以外の信頼できる処理で主体を指定 |
| `forVisitor(string $id)` | 対外向け AI の検証済み顧客識別 |
| `conversation(string $id)` | 継続する会話 UUID |
| `context(array $context)` | 相談の補足情報。認可や system prompt ではない |
| `attachments(array $ids)` | この送信で使用する会話専用の添付 UUID |
| `ask(string $message)` | `Data\AgentResult` を取得 |
| `stream(string $message, callable $onEvent)` | イベントを受け取り、完了時に AgentResult を取得 |
| `conversations()` | 会話一覧の配列 |
| `history(?int $beforeId = null)` | 指定済み会話の履歴配列 |
| `upload(UploadedFile $file, string $requestId)` | 検証済み添付のアップロード。受付 UUID 必須 |
| `files()` | 指定済み会話の添付一覧 |
| `file(string $id)` | 指定済み会話の添付取得 |
| `deleteFile(string $id)` | 指定済み会話の添付削除 |
| `expectSelection(?array $selection)` | 独自 UI で接続 ID・grant ID・revision の変更を検出するための前提 |

連鎖用メソッドは元の Agent を変更せず、新しいインスタンスを返します。設定済み呼び出し名と接続内 AI の識別子は別です。接続を指定しない `agent()` は本人の保存済み呼び出し名として解決します。

## 拡張インターフェース

すべて `FourmixIntelligence\Laravel\Tools` 名前空間です。

| 型 | 主な役割 |
| --- | --- |
| `ToolContext` | `subject`、`channel`、検証済み `identity` を保持する読み取り専用値 |
| `IntegrationAccess` | 管理・チャット要求の主体解決とシステム接続作成の認可 |
| `ToolPolicy` | 接続の本人解決、業務認可、副作用のない確認表示、確認 URL |
| `BoundUserToolPolicy` | 関連付け済みの個人を解決。業務の authorize/preview は既定で拒否 |
| `DenyToolPolicy` | 本人解決を含めた拒否 |
| `ToolRegistry` | 明示登録、属性 Reflection、manifest、入力メタデータ検証 |
| `ToolExecutor` | 確認・実行・履歴と実行前の現在の認可 |
| `ValidationSchema` | Laravel 入力規則から限定的なスキーマ補助 |

`IntegrationAccess::context(Request): ToolContext` はブラウザーからの ID ではなくアプリの認証から解決します。`authorizeSystemConnection(Request): void` は独立したサービス主体を使う設定でのみ実装します。既定では Gate が許可されてもシステム接続を拒否します。

システム接続を有効にする場合は `ui.host_modes` に `system` を追加し、独自 IntegrationAccess と ToolPolicy をセットで実装します。Fourmix Intelligence の organization 接続を選ぶこととは別です。

## ツール属性

`Attributes\FourmixIntelligenceTool` はメソッド属性です。

| 引数 | 既定・意味 |
| --- | --- |
| `name`, `description` | 必須。固有操作名と AI・人が理解できる説明 |
| `scopes` | `[]`。アプリが解釈する業務権限の宣言 |
| `inputSchema` | 空の object。実際の入力項目を明示 |
| `readOnly` | `true`。書込みは false |
| `requiresApproval` | `false`。確認対象とし、更新として登録 |
| `destructive` | `false`。削除などの表示用区分 |
| `domain`, `keywords` | 一覧の分類・検索 |
| `version` | `'1'`。業務の意味が変わる場合も更新 |
| `audiences` | `['internal']`。顧客向けは customer を明示 |

`registerCallback(string $name, array $definition, Closure $callback)` は、属性の代わりに明示カタログを登録します。キーは `input_schema`、`read_only`、`requires_approval` など snake_case です。callback は入力配列と ToolContext を受け取ります。

## 主な構成

`config/fourmix-intelligence.php` は公開可能な構成を管理し、個々の接続秘密は DB へ保存します。

| 設定 | 用途 |
| --- | --- |
| `bridge.enabled` | 業務連携経路の有効性 |
| `bridge.tool_handlers` | 属性を確認するクラスの明示リスト |
| `bridge.enabled_operations` | コード側で公開候補にする操作。`['*']` は登録済み全候補 |
| `ui.prefix` | 標準ルートの URL prefix |
| `ui.middleware` | 既定 web/auth。独自ガードでは適切に変更 |
| `ui.host_modes` | アプリの実行主体方式。既定は user のみ |
| `ui.domain_labels` | ツール分類の日本語表示 |
| `ui.surfaces` | 標準・追加の UI 定義 |
| `native.trusted_platform_urls` | 握手先 API の完全一致 allowlist |
| `native.timeout` | native 通信待ち。既定 250 秒 |
| `attachments.max_bytes`, `max_files`, `extensions` | アプリ側の会話添付制限 |
| `url`, `token`, `dataset`, `sync_token` | 明示的な低レベル API・資料同期用。管理画面の複数接続とは別 |
| `webhooks.*` | 別途構成する低レベル Webhook の検証・保存 |

設定済み接続を増やすために環境変数を追加する必要はありません。DB の connection UUID、Fourmix Intelligence 範囲、Laravel subject は SDK の管理画面と握手で扱います。

## 低レベル API と資料同期

管理画面の native 接続とは別に、明示的なサービス API を使用する場合は `client()` を利用できます。専用の URL・トークン・資料庫の権限を構成します。native Agent はトークン不足時にこの方式へ自動切替しません。

```bash
php artisan fi:knowledge:sync storage/app/knowledge.json --dataset=<資料庫ID> --no-interaction
```

資料同期は会話添付とは別で、指定した資料庫へ情報を送ります。送信対象、所有者、削除・更新の運用はアプリケーションが決めます。`--key` は同期の重複排除キーです。

Webhook の署名・重複検証、受信イベント、資料同期の詳細は [README](../README.md) の該当節を参照してください。AI 利用許可や Laravel の業務認可を低レベルのトークン設定で迂回することはできません。

