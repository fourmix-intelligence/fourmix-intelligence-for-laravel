# UI と Artisan

[ガイド一覧](README.md)

## 標準の二つの UI

標準 UI は、チャットページ `page` と右下の側窓 `floating` を各一つ提供します。管理画面でそれぞれの接続・AI・表示可否を本人ごとに設定します。二つは同じ AI にも別の AI にも設定できます。

```blade
<a href="{{ route('fourmix-intelligence.chat') }}">AIアシスタント</a>
<x-fourmix-intelligence::surface name="floating" />
```

利用中の UI は設定された AI を使い、チャット中に AI を切り替える選択メニューを表示しません。ページの履歴は側面パネル、側窓はコンパクトな履歴メニューです。側窓は背景の操作を妨げず、閉じても草稿・会話・添付を保持します。

全アカウントで UI を無効にする場合は、構成の `ui.surfaces.page.enabled` / `ui.surfaces.floating.enabled` を `false` にします。本人の表示設定はこれを越えて有効化できません。UI を無効にしても、Fourmix Intelligence 側の AI を削除したり他の用途の利用許可を消したりしません。

## 用途ごとの UI を生成する

```bash
php artisan fi:make-ui admin-assistant --type=page --no-interaction
php artisan fi:make-ui help-desk --type=floating --no-interaction
```

生成するのは次の材料です。

- `resources/views/components/fi/<name>.blade.php`
- `config/fi-ui/<name>.php`

既存ファイル、既存の定義、標準の `page` / `floating` は上書きしません。ルート追加、画面への挿入、接続、AI の利用許可、業務権限の自動付与は行いません。

```blade
<x-fourmix-intelligence::surface name="admin-assistant" />
<x-fourmix-intelligence::surface name="help-desk" id="help-chat" />
```

生成後に構成キャッシュを更新し、管理画面で各 UI の AI を設定します。複数の floating コンポーネントを同時に配置する場合は、位置や開き方を調整し、ランチャーが重ならないレイアウトをアプリ側で決めます。

独自ページのルートはアプリケーション側で作成します。

```php
Route::view('/assistant', 'assistant')
    ->middleware(['web', 'auth'])->name('assistant');
```

この例は既存の `routes/web.php` に置く場合、`web` の重複指定を省けます。`resources/views/assistant.blade.php` は既存のレイアウト内に surface を配置します。標準 UI は社内向けです。対外向け UI は顧客認証を実装して API を利用します。

## 見た目と配置を調整する

```bash
php artisan vendor:publish --tag=fourmix-intelligence-views --no-interaction
php artisan vendor:publish --tag=fourmix-intelligence-assets --no-interaction
php artisan vendor:publish --tag=fourmix-intelligence-sources --no-interaction
```

| 公開タグ | 用途 |
| --- | --- |
| `fourmix-intelligence-views` | アプリの Blade override、ブランド、レイアウト |
| `fourmix-intelligence-assets` | 配布済み JS/CSS・図形ロゴ・文字ロゴ |
| `fourmix-intelligence-sources` | 自社ビルドへ組み込む JS/CSS ソース |
| `fourmix-intelligence-stubs` | ツール・認可クラスの生成テンプレート |

標準はブランドの図形ロゴと文字ロゴを使用し、Tailwind は `fi:` 接頭辞でアプリとの衝突を抑えています。公開済みのファイルはアプリの管理対象になるため、SDK 更新時に差分を確認します。`--force` でカスタマイズを上書きしないでください。

ソースを編集する場合は自社のビルドに取り込み、生成物を一式配布します。ハッシュ付き JS の参照先や依存のライセンスを残してください。SDK 自体を開発する場合は固定 lockfile と指定の Node.js バージョンでビルドします。

低レベルの Blade コンポーネントでは表示を直接指定できます。

```blade
<x-fourmix-intelligence::chat alias="document-reviewer" layout="fill" />
<x-fourmix-intelligence::floating-chat
    alias="document-reviewer" id="review-chat"
    label="AIに相談" title="文章の相談" position="right"
    :launcher-hidden="true" />
```

この alias は本人の設定が存在することが前提です。surface と低レベル alias コンポーネントを混同せず、管理画面で設定する UI は `surface` を推奨します。`initial-prompt` は明示した業務文脈の入力補助で、system prompt の上書きではありません。通常の入口では空のままにします。

```javascript
const chat = document.getElementById('review-chat');
await chat.open();
chat.close();
```

要素の初期化は module の読み込み後に行います。側窓の `fourmix:floating-open` / `fourmix:floating-close` イベントで、アプリのボタン表示などを同期できます。

## 回答の表示と添付

標準 UI は Markdown の表・コード・画像、Mermaid、会話添付、確認依頼に対応します。表は横スクロール、履歴は会話内容と独立して表示します。HTML や危険な URL、Mermaid の外部読み込みなどは制限します。画像の外部取得には明示操作または信頼する提供元の設定が必要です。

アップロードの上限はアプリ設定と Fourmix Intelligence の許可の共通範囲を使用します。会話添付を資料庫へ自動登録しません。独自の描画処理ではユーザー入力と AI 出力を信用せず、標準と同等のサニタイズを維持してください。

## 独自 UI

Vue / Inertia などから PHP の公開 API を呼ぶ独自の認証済み API を作成できます。標準 Web Components を使う場合は `window.FourmixIntelligenceSDK.Client` と標準の管理・会話 API も利用できます。CSRF、セッション、用途別認可を省略しません。詳細な既存 HTTP API は [API・設定リファレンス](reference.md) を参照してください。

確認表示のカスタマイズは `fourmix:review` イベントでできます。確認本文を描画し直しても、サーバーの本人確認、`acknowledge`、実行前再認可は省略しません。`fourmix:action-changed` を受けた後に対象の業務一覧を再取得する設計にできます。

## Artisan リファレンス

| コマンド | 動作 |
| --- | --- |
| `fi:install [--with-migration] [--force]` | 構成公開。新規初期 migration は既存を上書きしない |
| `fi:make-tool <name> --operation=<operation>` | 属性付きの未実装ツールを生成 |
| `fi:make-policy [name]` | 既定では拒否する個人向け認可アダプターを生成 |
| `fi:tools [--json]` | 登録済み公開候補。通信・実行・権限付与なし |
| `fi:make-ui <name> [--type=page\|floating]` | 名前付きコンポーネントと構成を生成 |
| `fi:doctor [--connection=<UUID>]` | 既定は DB 構造と接続件数。UUID 指定時は AI 許可確認の通信を行う |
| `fi:doctor --api` | 明示構成した低レベル API の接続確認 |
| `fi:knowledge:sync <file> [--dataset=] [--key=]` | 明示した資料庫へ知識同期を送る |

生成クラス名は大文字で始まる半角英数字・`_`、名前空間は `/` または `\` です。`Notes/LookupNote` は `App\Tools\Notes\LookupNote`、`App/Services/LookupNote` はその名前空間に生成します。既存クラスは上書きしません。コマンドは自動でツール登録や認可 bind を行いません。

```bash
php artisan vendor:publish --tag=fourmix-intelligence-stubs --no-interaction
```

公開後の `stubs/fi.tool.stub` と `stubs/fi.policy.stub` を組織の規約へ合わせます。置換変数は `{{ namespace }}`、`{{ class }}`、ツールでは `{{ operation }}` と `{{ scope }}` です。変更したスタブにも未認可の実行を防ぐ初期値を維持してください。
