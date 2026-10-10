# Fourmix Intelligence for Laravel

Fourmix Intelligence への接続、双方向通信、AI の選択、会話、業務ツール、承認を Laravel に組み込む公式 SDK です。特定の業務アプリケーションの処理や権限体系を持たず、導入先の既存の認証・認可・業務サービスを利用します。Laravel AI SDK を置き換えるものではありません。

## 対応環境

- PHP 8.3 / 8.4
- Laravel 12 / 13
- 標準画面は Blade と Tailwind CSS。Vue / Inertia などの独自画面からも同じ API を利用できます。

## 日本語の開発者ガイド

- [導入と接続](docs/getting-started.md)：新規導入、握手、複数接続、AI の許可と選択。
- [AI API](docs/ai-api.md)：接続×AI、会話、ストリーミング、添付、ジョブ、対外向け AI。
- [業務ツールと認可](docs/business-tools.md)：属性による一覧生成、入力、Policy、確認、重複防止。
- [UI と Artisan](docs/ui-and-artisan.md)：標準画面、独立した設定、生成と配置、カスタマイズ。
- [テストと運用](docs/testing-and-operations.md)：合成データによる検証、移行、監視、障害対応。
- [API・設定リファレンス](docs/reference.md)：公開メソッド、拡張インターフェース、構成。

## 二つの利用方向

| 利用方向 | 使用する AI | 接続・許可の意味 |
| --- | --- | --- |
| Fourmix Intelligence から Laravel を操作 | 接続範囲の FinCube | Laravel が公開した業務ツールを、個人・組織・ワークスペースのどこで使用できるかを指定 |
| Laravel 内で AI を使用 | AI Studio で作成したアプリケーション向け AI | Fourmix Intelligence が許可した AI とその能力を、Laravel の標準または独自 UI で使用 |

Fourmix Intelligence の個人・組織・ワークスペースは、Fourmix Intelligence 内の利用範囲です。アプリケーションの部署やワークスペースとは別の概念であり、自動的な権限の対応付けは行いません。同じ業務ツールでも、返すデータと許可する操作はアプリケーションの実行主体と業務認可によって変わります。

Laravel 内の AI は FinCube への自動切替を行いません。AI Studio 側で明示的にこの接続への利用を許可した AI を選びます。資料庫や外部サービスの利用可否は、その AI の設定と Fourmix Intelligence の許可に従います。アプリケーションは接続キーの発行時に、その接続へ公開する業務操作と確認方法を選択します。片方向の許可だけで、もう片方向の権限は増えません。

どちらの方向も、アプリケーションのブラウザーを開いておく必要はありません。双方のサーバーと API は稼働し、通信できる必要があります。

### ChatGPT などの外部 AI から利用する

外部 AI は Fourmix Intelligence の MCP を通じて、許可された Laravel 接続の業務ツールを利用します。SDK を導入しただけで接続や業務データが外部へ公開されることはありません。Fourmix Intelligence 側で発行する MCP の利用許可と接続範囲に加え、アプリケーション側の本人確認、現在の業務権限、操作ごとの確認ルールを毎回適用します。

組織の Laravel 接続には、明示的な `organization` コンテキストと専用の `organization.connections.use` 許可が必要です。この許可は Fourmix Intelligence の既存の組織管理者ルールに従い、管理権限が解除された場合は利用できません。従来の `connections.use` やワークスペースの許可だけで、組織の接続を利用することはできません。Fourmix Intelligence の組織管理権限を持つ場合も、アプリケーションのシステム権限や別の利用者の業務権限は取得しません。

## インストールと初期構造

```bash
composer config repositories.fourmix-intelligence vcs https://github.com/fourmix-intelligence/fourmix-intelligence-for-laravel
composer require fourmix-intelligence/laravel
php artisan fi:install --with-migration --no-interaction
php artisan migrate --no-interaction
```

接続、利用者の関連付け、AI の選択、操作許可、確認依頼、実行結果はデータベースで管理します。接続の秘密と確認・実行データは暗号化して保持するため、`APP_KEY` を維持してください。接続の秘密とトークンはブラウザーへ渡しません。一度限りの接続キーを本人の管理ページで発行し、Fourmix Intelligence のサービス接続でアプリ URL とともに入力します。本人の関連付けは握手で行うため、別の関連付けコードは不要です。キーや秘密を URL・ログへ記録しないでください。

`fourmix-intelligence-business` と `fourmix-intelligence-webhooks` は同じ初期 migration を公開します。両機能を利用する場合も適用は一度です。SDK の新規導入用初期構造を、既に適用済みのアプリケーション migration に上書きしてはいけません。導入先に既存の SDK 表がある場合は、アプリケーションの増分 migration で必要な差分を適用してください。利用履歴がある初期 migration の巻戻しは拒否します。

## 管理ページから接続する

標準の管理ページは `/fourmix-intelligence`、会話ページは `/fourmix-intelligence/chat` です。名前付きルートは `fourmix-intelligence.manage` と `fourmix-intelligence.chat`。既定で `web` と `auth` ミドルウェアを使用し、更新には CSRF 検証が必要です。

1. アプリケーションへログインし、管理ページの「新しい接続を作成」で接続名と公開する業務を選びます。操作ごとの参照・毎回確認・継続許可を設定し、一度だけ使える10分有効の接続キーを発行します。未選択の操作は許可しません。
2. Fourmix Intelligence の「サービス接続」で Laravel アプリケーションの URL と接続キーを入力します。FinCube で使用する個人・組織・ワークスペースの範囲は Fourmix Intelligence 側で選びます。
3. サーバー間の握手で、Fourmix Intelligence の本人・利用範囲とアプリケーションでキーを発行した本人を関連付けます。接続キーは消費され、暗号化した接続ごとの秘密を保存します。Fourmix Intelligence の利用範囲を広げても、アプリケーションの本人権限は広がりません。
4. Laravel 内のチャットも使う場合は、Fourmix Intelligence の AI Studio でこの接続に AI の利用を許可します。アプリケーションの「チャットの設定」でページと側窓それぞれの接続・AIを設定します。二つは別のAIを使用でき、独立して表示を停止できます。利用中のチャットにAI選択メニューは表示しません。
5. 公開業務を変更するときは接続カードの「権限を変更してキーを再発行」を使用します。古い署名鍵・本人関連付け・AI設定を無効にし、FIでの接続確認と必要なチャット設定をやり直します。変更を既存会話へ黙って流用しません。

握手のコールバック先は `native.trusted_platform_urls` の完全一致で制限します。既定では公式の本番・デモ API を許可します。自社運用の Fourmix Intelligence は構成ファイルで信頼する URL を明示してください。任意の URL をブラウザーから指定して、アプリケーションサーバーを内部ネットワークへの中継に使うことはできません。`local` / `testing` 環境では、localhost・127.0.0.1・host.docker.internal へのローカル接続を許可します。

チャットの有効・無効は、本人のページ・側窓ごとに保存します。表示設定は業務権限の付与やFI側のAI削除を行いません。標準ページは公式の図形ロゴと文字ロゴを使用し、公開したビューとアセットでアプリケーションのブランドへ変更できます。

新しい接続には Fourmix Intelligence 専用の環境変数による接続 ID、ワークスペース ID、共有キーの設定は不要です。複数の利用者、接続、AI を独立して管理できます。初回に届いた任意の署名要求を接続として自動登録する仕組みではありません。

### アプリケーションの実行主体

既定の `IntegrationAccess` はログイン済み利用者を `user:<認証ID>` として扱い、`ui.host_modes` は `['user']` のみです。独自のアカウント体系を持つアプリケーションでは、`Tools\IntegrationAccess` を実装してサービスプロバイダーで bind します。

- `context(Request)`：管理・会話・承認を行う、アプリケーションの認証済み実行主体を返します。ブラウザーから渡された利用者 ID を採用しません。
- `authorizeSystemConnection(Request)`：システム接続の作成をアプリケーションの管理権限で認可します。

システム接続を提供する場合は、`ui.host_modes` へ `system` を明示設定したうえで、専用の `IntegrationAccess` と `ToolPolicy` を実装してください。`context()` は作成者の個人アカウントではなく、アプリケーションが定義した独立したサービス実行主体を返し、すべての管理要求を適切に保護する必要があります。`ToolPolicy` も同じ主体へ解決し、許可されたデータ・操作のみを実行します。

既定の `AuthenticatedIntegrationAccess` は、`fourmix-intelligence.system` Gate が許可されてもシステム接続を拒否します。Gate を追加するだけで作成者の個人権限をシステム権限として代理実行しません。Fourmix Intelligence の組織接続を選ぶこととも別の設定です。

## 業務ツールとアプリケーションの認可

公開するメソッドを属性で明示します。次の `OrderLookup` はアプリケーション側で実装する業務処理の例です。

```php
use App\Actions\OrderLookup;
use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\Tools\ToolContext;

final class OrderTools
{
    #[FourmixIntelligenceTool(
        name: 'orders.lookup',
        description: '注文番号から現在の配送状況を確認します',
        scopes: ['orders:read'],
        inputSchema: [
            'type' => 'object',
            'properties' => ['orderNumber' => ['type' => 'string', 'maxLength' => 40]],
            'required' => ['orderNumber'],
        ],
        domain: 'orders',
        keywords: ['注文', '配送'],
    )]
    public function lookup(string $orderNumber, ToolContext $context): array
    {
        return app(OrderLookup::class)->handle($context, $orderNumber);
    }
}
```

`config/fourmix-intelligence.php` では、公開候補となるハンドラーと操作だけを指定します。

```php
'bridge' => [
    'enabled' => true,
    'tool_handlers' => [App\FourmixTools\OrderTools::class],
    'enabled_operations' => ['orders.lookup'],
],
'ui' => [
    'prefix' => 'fourmix-intelligence',
    'middleware' => ['web', 'auth'],
    'host_modes' => ['user'],
    'domain_labels' => ['orders' => '注文管理'],
],
```

属性の `scopes` はアプリケーションが認可で解釈する業務権限の宣言です。Fourmix Intelligence の個人・組織・ワークスペースを指定する項目ではなく、宣言だけで業務権限を与えるものでもありません。

### 内部向け・顧客向けの公開区分

業務ツールの `audiences` は既定で `['internal']` です。既存の属性やコールバックを登録するだけでは、顧客向けの AI へ公開されません。外部利用者に提供する機能だけ、`customer` を明示します。

```php
#[FourmixIntelligenceTool(
    name: 'orders.my_status',
    description: '本人の注文の配送状況を確認します',
    scopes: ['orders:read'],
    audiences: ['customer'],
)]
```

両方に提供する場合は `['internal', 'customer']` を指定します。`ToolRegistry::registerCallback()` の定義では同じ項目を `'audiences' => ['customer']` として指定します。許容値は `internal` と `customer` の非空リストのみで、ワイルドカードはありません。区分は manifest と操作定義の指紋に含まれ、区分変更後は以前の継続許可や確認依頼をそのまま再利用できません。

標準の認証済み管理・チャット画面では `internal` のAIだけを設定できます。`customer` のAIを使う対外画面は、アプリケーションが顧客の本人確認を行う独自APIとUIを実装し、信頼できるサーバーコードから `forUser($ownerContext)->forVisitor($verifiedCustomerId)` を使用してください。接続を所有するFI利用者と、会話する顧客の識別子は別です。`forVisitor()` にブラウザーが自由に指定した値をそのまま渡してはいけません。

公開区分だけでは顧客の本人確認や注文の所有者検証を行いません。アプリケーションは `ToolPolicy` で検証済みの顧客主体を解決し、`authorize()` と業務処理で本人に属するレコードだけを扱ってください。ブラウザーやモデルに `audience` や所有者IDを自由に指定させて認可してはいけません。顧客向けAIも、FIの利用許可、接続ごとの業務許可、操作ごとの確認方法、アプリケーションの現在の認可をすべて満たす必要があります。顧客向けの書込みにも確認と重複実行防止が適用されます。

業務ツールを提供する場合は、内部向け・顧客向けのどちらでも以下の認可アダプターが必要です。

アプリケーションの `Tools\ToolPolicy` を bind してください。既定の `BoundUserToolPolicy` は、署名確認済みの接続と明示的な本人の関連付けを照合し、現在の Laravel 認証ガードの `UserProvider` で利用者を毎回取得します。整数・UUID の利用者 ID に対応し、削除済みの利用者、別の接続所有者、システム接続を拒否します。チャットだけを使うプロジェクトでは、この既定処理で本人の Studio AI を使用でき、業務ツール用の認可処理は不要です。業務操作の `authorize()` と `preview()` はすべて拒否するため、操作を公開するにはアプリケーションの認可処理が必要です。複数の認証方式、無効化などの独自状態、システム主体の解決もアプリケーションが実装してください。本人の解決も含めてすべて拒否したい場合は、`DenyToolPolicy` を明示的に bind できます。

| メソッド | アプリケーションが実装する内容 |
| --- | --- |
| `resolve()` | 署名確認済みの接続・Fourmix Intelligence 利用者を、現在有効な関連付けとアプリケーションの主体へ解決 |
| `authorize()` | 利用者やサービス主体の状態、組織、対象レコード、業務権限を毎回検査 |
| `preview()` | 実行せずに対象、入力、現在の内容を取得し、秘密を含まない確認表示を返す |
| `reviewUrl()` | 本人だけが利用できるアプリケーションの確認画面を返す。標準コンポーネントは同一オリジンの URL を優先して案内 |

既存の FormRequest、ポリシー、業務サービスを使って保存時にも入力と認可を検証します。`ValidationSchema::fromRules()` は入力メタデータの作成を補助しますが、DB の存在・一意性、条件付き規則、独自ルール、業務認可をすべて代替するものではありません。

## 操作の許可・承認・実行結果

操作ごとの初期値は `disabled` です。管理ページで参照を許可し、更新は `review`（毎回確認）または明示的に確認した `automatic`（継続許可）を選びます。継続許可でもアプリケーションの業務認可は省略しません。操作許可は接続ごとに保存し、初期状態では業務操作を許可しません。

更新ツールは `readOnly: false` とし、確認が必要なものは `requiresApproval: true` を指定します。書込みの入力には UUID の `idempotency_key` が追加されます。`ToolExecutor` は公開操作、利用者の許可、接続ごとの許可、現在の業務認可を確認し、確認時と実行直前にも検査します。別の接続・利用者・AI へ許可を流用しません。

`confirmation_required` は未実行です。本人が内容を確認して承認し、`succeeded` を確認して初めて完了として扱います。標準の確認 API は `acknowledge: true` を要求します。確認は 15 分で期限切れになり、対象内容や操作定義が変わった場合は新しい依頼が必要です。

同じ利用者・受付 UUID の別入力は 409 です。結果照会は再実行しません。`running` / `unknown_effect` は完了と扱わず、結果を確認してから次の依頼を判断してください。業務保存と結果記録は同じ DB トランザクションで処理しますが、外部サービスへの変更には相手側の重複排除も必要です。

操作定義が変わると `automatic` は `review` に戻り、以前の確認依頼は無効になります。実装の意味が変わる場合は属性またはコールバック定義の `version` を更新してください。

## Laravel 内から Studio AI を使う

開発者は接続名とFI側AIの識別子を指定できます。標準画面の設定済みAIを使う場合は、画面固有の呼び出し名を指定します。同じ名前でも、現在の利用者に属する接続とFIの利用許可から解決し、共有の認証主体として保存しません。AIの選択画面からFIの利用許可を新規発行したり、資料庫や外部サービスの権限を増やしたりすることはできません。

```php
use FourmixIntelligence\Laravel\Facades\FourmixIntelligence;

$result = FourmixIntelligence::agent('ui-page')->ask('本日の対応状況を確認してください。');
$answer = $result->answer;

// 実際に届いた表示イベントを、自作のチャットやレスポンスへ渡せます。
$streamed = FourmixIntelligence::agent('ui-page')->stream(
    '本日の対応状況を確認してください。',
    function (array $event): void {
        // run.status は作業状態、assistant.delta は回答の追加部分です。
        // 画面へ渡す場合も通常の回答と同じく安全に描画してください。
    },
);

$next = FourmixIntelligence::agent('ui-page')
    ->conversation($result->conversationId)
    ->ask('その中で未対応の項目を教えてください。');

$conversations = FourmixIntelligence::agent('ui-page')->conversations();
$history = FourmixIntelligence::agent('ui-page')
    ->conversation($result->conversationId)
    ->history();

if ($history['has_more'] ?? false) {
    $older = FourmixIntelligence::agent('ui-page')
        ->conversation($result->conversationId)
        ->history((int) $history['before_id']);
}
```

ネイティブ会話の履歴・会話一覧は現在の本人、接続、Studio AI の許可に限定します。毎回 Fourmix Intelligence の許可を確認し、呼び出し時と業務ツールの呼戻し時にアプリケーションの現在の接続の許可を検査します。会話の途中で AI を変更したり業務範囲を拡大したりする場合は、新しい会話を開始してください。

接続を明示する公開APIでは、接続名は現在の本人が所有する接続から解決し、FIがその接続へ許可したAIだけを使用します。AI Studio固有のモデル・能力・設定をアプリケーションの実行オプションで上書きすることはできません。

```php
$agent = FourmixIntelligence::connection('お問い合わせ窓口')
    ->agent('support-assistant');
$result = $agent->ask('確認したい内容を入力します。');

// upload() は検証済み UploadedFile と受付UUIDを受け取ります。
$uploaded = $agent->upload($validatedUpload, (string) Illuminate\Support\Str::uuid());
$conversation = $agent->conversation($uploaded['conversation_id']);
$files = $conversation->files();
$content = $conversation->file($attachmentId);
$answer = $conversation->attachments([$attachmentId])->ask('添付を確認してください。');
$conversation->deleteFile($attachmentId);

// 対外向けAIにはアプリケーションで本人確認した顧客の安定した識別子を指定します。
$customer = $agent->forUser($ownerContext)->forVisitor($verifiedCustomerId);
```

添付のアップロード・一覧・取得・削除も会話する本人とAIの許可を再確認します。`customer` のAIではすべての呼出しに同じ検証済み `forVisitor()` を引き継いでください。

ジョブなど HTTP ログインとは別の処理では、信頼できるアプリケーションコードで `->forUser(new ToolContext($verifiedSubject))` を指定します。`$verifiedSubject` をモデルやブラウザーが入力した文字列から作ってはいけません。`context()` の補足情報も実行主体や認可の代わりにはなりません。

## 標準 UI と開発用テンプレート

標準ではチャットページ `page` と右下の側窓 `floating` を1つずつ定義します。各画面は独立して有効・無効を切り替え、別の接続とAIを設定できます。利用中のチャットにはAI選択の選択メニューを出さず、設定済みのAIの表示名を示します。内部の呼び出し名は表示しません。時刻はアプリケーションの `app.timezone` に従います。

標準ページは `fourmix-intelligence.chat` で開きます。側窓はアプリケーションの必要なレイアウトへ次を配置してください。パッケージがアプリケーションの全ページへ勝手に挿入することはありません。

```blade
<x-fourmix-intelligence::surface name="floating" />
```

サーバー側で本人の表示設定を確認し、無効な画面にはチャット要素を生成しません。アプリ全体で無効にする場合は `ui.surfaces.page.enabled` または `ui.surfaces.floating.enabled` を `false` にします。両方とも不要なら `ui.surfaces` を空配列にできます。

ページの履歴は左側のパネル、側窓の履歴はコンパクトなメニューで開きます。側窓は右下に表示する非モーダルの `dialog.show()` を使用し、背景の業務画面を引き続き操作できます。既定の幅は最大30rem、高さは画面上下に1remずつ余白を残すサイズです。スマートフォンでは幅95vw、高さ86dvhです。閉じても草稿・会話・添付を保持し、業務依頼を再送しません。

### 名前付き UI を生成する

```bash
php artisan fi:make-ui support --type=page --no-interaction
php artisan fi:make-ui helper --type=floating --no-interaction
```

コマンドは、例えば `support` なら次の開発用材料だけを生成します。

- `resources/views/components/fi/support.blade.php`：自由に変更できる会話テンプレート。
- `config/fi-ui/support.php`：種類、表示可否、固有の呼び出し名、表示タイトル、テンプレートの指定。

ルート登録、業務画面への配置、接続、AIの利用許可、業務への権限付与は行いません。既存ファイルは上書きしません。設定はLaravelの構成として読み込み、設定キャッシュを使用している場合は変更後に更新してください。

```blade
<x-fourmix-intelligence::surface name="support" />
<x-fourmix-intelligence::surface name="helper" id="helper-chat" position="left" />
```

ページ型を独自の認証済みルートに配置する場合は、生成したsurfaceをアプリケーションのページテンプレートから呼び出せます。標準ページルートで表示する場合は `route('fourmix-intelligence.chat', ['surface' => 'support'])` を使用します。同時に複数の画面を配置しても、固有の呼び出し名・接続・AIと各要素の会話状態を分離します。同じ呼び出し名を複数画面の設定へ重複登録することはできません。

`chat` / `floating-chat` の匿名Bladeコンポーネントも編集材料として公開します。通常は有効状態をサーバーで検査する `surface` ラッパーを使用してください。共通の属性は `assistant-name`、`input-placeholder`、`composer-max-height`、`history-layout="drawer|dropdown"` です。側窓には `position="left|right"`、`launcher-hidden`、`fallback-url` も指定できます。寸法は `--fi-floating-width` / `--fi-floating-height`、ページ領域は `--fi-chat-page-offset` で調整できます。

アプリケーションのボタンから側窓を開く公開APIです。必ず固有の `id` を指定してください。

```js
document.dispatchEvent(new CustomEvent('fourmix:open-chat', {
    detail: { id: 'helper-chat', context: { record_id: 7 } },
}));
document.getElementById('helper-chat').open();
document.getElementById('helper-chat').close();
```

`fourmix:response` / `fourmix:error` / `fourmix:history` / `fourmix:attachment` は会話要素から通知します。確認表示はキャンセル可能な `fourmix:review` イベントの `detail.action` と `detail.container` でアプリケーションが独自描画できます。アプリケーションの安全な同一オリジンの確認URLがある場合、標準の確認ダイアログはその業務画面を優先します。contextは補足情報であり、実行主体や権限の付与ではありません。

現在の通信は同期応答です。「応答の待機をやめる」はブラウザーの待機だけを中止します。サーバー処理や保存済み業務は取り消しません。結果不明時は草稿・添付を保持し、履歴と実行結果を確認するまで同じ依頼を自動再送しません。

ビュー、配布資源、編集用ソースは別々に公開できます。

```bash
php artisan vendor:publish --tag=fourmix-intelligence-views --no-interaction
php artisan vendor:publish --tag=fourmix-intelligence-assets --no-interaction
php artisan vendor:publish --tag=fourmix-intelligence-sources --no-interaction
```

フロントエンドのビルドにはNode.js 24.15以上・25未満を使用します。`npm run build` は配布JS/CSS、必要時に読み込むハッシュ付きJS、第三者ライセンス原文とNOTICEをまとめて生成します。`npm run test:ui` はJSDOMを使った操作・非同期・表示の回帰テストです。更新時は `resources/dist` 全体を同時に配布してください。

### 回答の表・コード・図・画像

回答は安全に処理した Markdown で表示します。表は列の左右・中央揃えを維持して横にスクロールでき、コードは原文をコピーできます。対応する一般的な言語の色分けと Mermaid の描画エンジンは、必要になったときに読み込みます。配布時は `sdk.js` / `sdk.css` だけでなく、同じ `resources/dist` のハッシュ付き JS ファイルもまとめて更新してください。資源用 API は SDK 本体と実在するハッシュ付き JS のみに限定し、任意のファイルやパスの遡及を拒否します。

`mermaid` コードブロックはフロー・シーケンス・クラス・状態・ER・ガント・円・journey・timeline・quadrant・XY・gitGraph・mindmap の図を描画します。strict 設定で HTML ラベル、リンク操作、設定ディレクティブ、外部資源、任意の CSS を許可せず、生成した SVG も再検査します。1つの回答で最大6図、1図につき12,000文字・160行などの複雑さの制限があります。構文不正や制限超過の場合はコードと日本語の案内を表示し、内容を実行しません。

画像は PNG / JPEG / WebP / GIF / AVIF を対象とし、MIME とファイル先頭を検証して8MBを超える読込みを中止します。SVG、data URL、危険な scheme は表示しません。Fourmix Intelligence の認証付き添付は、アプリケーションの信頼できる設定で示した同一オリジンの添付 URL に限り自動表示します。それ以外は「画像を読み込む」を押すまで外部へ通信せず、読込み時も Cookie と referrer を渡しません。外部提供元の CORS 設定により取得できない場合は、その旨を表示します。

公開できる編集用ソースの `markdown.js` は `configureRendering(options)` と `renderMarkdown(text, options)` を提供します。設定キーは添付の完全 URL 配列 `attachmentUrls`、末尾が `/` の同一オリジンの添付パス配列 `attachmentUrlPrefixes`、明示的に自動表示を許可する提供元配列 `allowedImageOrigins` です。これらをモデルの回答や一般利用者の入力から設定してはいけません。返される DOM の `ready` は図・色分け・自動画像の完了を待つ Promise、`dispose()` は表示を破棄した際の非同期処理・画像の待機を中止します。

### 会話専用の添付

標準会話では画像・PDF・Office 文書・テキスト類を選択し、この会話に添付できます。共有資料庫への同期は行いません。許可形式・個数・サイズはアプリケーションの `attachments` 設定、PHP のアップロード上限、Fourmix Intelligence 側の条件の共通範囲だけを使用します。アプリケーションの既定は1ファイル10MB、1回の送信につき5ファイルです。会話全体の累計件数ではありません。拡張子だけでなく内容も検査し、暗号化・マクロを含む Office 文書や SVG / HTML を拒否します。画像の表示上限8MBは添付の保存上限とは別です。

Fourmix Intelligence への通信と添付の取得はサーバーで仲介し、現在の本人、AI の許可、会話、添付の関連付けを毎回確認します。ブラウザーへ Fourmix Intelligence の認証トークンを渡しません。保管期限は Fourmix Intelligence の条件に従います。削除は添付の削除であり、すでに生成済みの回答や実行済みの業務を取り消しません。

独自の会話 UI からもブラウザー API を利用できます。ログインの Cookie と CSRF トークンはアプリケーション側の同一オリジンで検証します。Fourmix Intelligence の秘密をブラウザーへ渡す必要はありません。

```js
const client = new window.FourmixIntelligenceSDK.Client(
    '/fourmix-intelligence', undefined, 'page',
);
const state = await client.state();
const page = state.surfaces.find(surface => surface.name === 'page');
const alias = page.alias; // 信頼できるサーバー設定の識別子を使います。
client.expectation(state.agents.find(agent => agent.alias === alias));
const result = await client.ask(alias, '配送状況を確認してください。');
const recent = await client.history(alias);
const history = await client.history(alias, result.conversation_id);
const uploaded = await client.uploadAttachment(alias, file, {
    conversationId: result.conversation_id,
    requestId: crypto.randomUUID(),
});
const withFile = await client.ask(alias, '添付の内容を確認してください。', {
    conversationId: uploaded.conversation_id,
    attachmentIds: [uploaded.attachment.id],
});
const attachments = await client.attachments(alias, uploaded.conversation_id);
```

`localConnectionId` は管理ページの `state.connections[].id` です。Fourmix Intelligence 側の接続 UUID とは別に保持します。カスタム UI でも利用者の切替後に以前の会話・状態を使い回さないでください。

標準UIは読み込み時の接続・AI・権限の版を `expected_selection` として各会話・履歴・添付要求へ渡します。別画面や別タブで設定が変わると409で拒否し、旧草稿を新しいAIへ黙って送りません。独自UIでも `Client.expectation()` にstateの設定済みAIを渡し、変更を確認してから本人の明示操作で状態を読み直してください。再読み込みは依頼を自動再送しません。

### 管理・会話 API

既定の `/fourmix-intelligence` 配下でログインとCSRFを検証します。各会話・添付APIは `surface` を受け取り、サーバーの信頼できる設定からAIを解決します。別の `alias` を送ることで画面のAIを変更することはできません。無効なsurfaceの呼出しは拒否します。

| メソッド・パス | 用途 |
| --- | --- |
| `GET /state` | 本人の接続・画面別の設定・AI表示名・最新操作履歴 |
| `POST /connections/key` | `name`、接続ごとの `modes`、必要な継続許可の確認を保存しキーを発行 |
| `PATCH /connections/{id}` | 本人の接続名を変更 |
| `PUT /connections/{id}/permissions` | 権限を変更しキーを再発行。古い接続・AI設定を無効化 |
| `DELETE /connections/{id}` | 本人の接続を削除 |
| `GET /agents?connection_id={id}` | FIがこの接続に利用を許可したAIと能力の読み取り専用一覧 |
| `PUT /surfaces/{name}` | `enabled` と、任意の `connection_id` / `grant_id` の組で画面を設定 |
| `POST /chat` | `surface`、`message`、任意の会話・添付・補足情報で会話 |
| `POST /history` | `surface` の会話一覧。会話IDでメッセージ、`before_id` で前ページ |
| `GET /attachments` | `surface` と任意の会話IDで私有添付と条件を確認 |
| `POST /attachments` | multipartで `surface`、file、UUIDのrequest_idと任意の会話IDを送る |
| `GET /attachments/{conversation}/{attachment}/content` | `surface` を指定し本人の添付を取得 |
| `DELETE /attachments/{conversation}/{attachment}` | `surface` を指定し本人の添付を削除 |
| `GET /actions/{id}` | 本人の確認内容または実行結果 |
| `POST /actions/{id}/confirm` | 本人が `acknowledge: true` を指定して承認 |
| `POST /actions/{id}/reject` | 本人が実行せず終了 |

署名付き `/fourmix-intelligence/v1/handshake`、manifest、bindings、actions、receiptsはサーバー間通信専用です。任意の利用者IDを渡すブラウザー認可経路ではありません。

## 接続の解除と低レベルAPI

接続を削除するとアプリケーションの秘密、本人の関連付け、その接続を使用するAI設定を削除し、新しい呼出しと未実行の確認を拒否します。別の接続・別の利用者の設定や実行履歴は削除しません。FI側の共有AIや利用許可を全体から削除する操作でもありません。FI側での許可撤回と利用者権限の変更は、次の呼出しで確認します。

ページや側窓を無効にすると、その画面の会話・添付APIも停止します。接続自体とFI側のAIは削除しません。接続の権限変更はキーの再発行で行い、古い会話へ新しい権限を引き継ぎません。

接続用の環境変数によるネイティブ接続の代用は廃止しました。`url` / `token` と資料同期用の設定は、開発者が明示的に使う低レベルクライアント用であり、画面管理接続の未設定時の代替ではありません。`agent()` は本人の画面設定、または `connection()->agent()` の明示的な接続とFI側AIを使用します。

`fi:install` は設定ファイルの公開コマンドです。`fi:doctor` はSDK表と接続済み件数を読み取り専用で確認し、`--connection=接続ID` で特定の接続と利用可能なAIを確認します。低レベルクライアントを明示的に診断する場合は `--api` を指定します。接続キーや秘密は診断結果へ表示しません。すべてのSDK Artisanコマンドは `fi:` 接頭辞を使用します。

### 既存の資料同期

```bash
php artisan fi:knowledge:sync storage/app/knowledge.json --no-interaction
```

```json
{"records":[{"key":"guide","version":1,"operation":"replace","text":"# ご利用案内\n営業時間は9時から18時です。"}]}
```

既存の同期設定では資料庫専用の同期キーを使用します。外部キーは変えず、内容変更時に `version` を増やします。同期受付と処理完了は異なるため、結果の状態も確認してください。

## Webhook 受信と再送

`VerifyFourmixIntelligenceWebhook` はアプリケーションが選んだ受信ルートへ適用する独立したミドルウェアです。現在のプラットフォームがこの契約の Webhook を自動配信する設定ではありません。双方で次の契約を合わせてください。

- JSON の `event_id` は英数字、`_`、`.`、`:`、`-` の 1〜128 文字。同じ接続の受信ルート全体で一意とし、再送で本文と ID を変更しません。
- `X-Fourmix-Intelligence-Timestamp` は Unix 時刻。`X-Fourmix-Intelligence-Signature` は `timestamp + "." + 生の本文` の HMAC-SHA256、小文字 hex。既定の許容時間は 300 秒です。
- 既存の Webhook 設定は `FOURMIX_INTELLIGENCE_WEBHOOK_CONNECTION_ID` などで受信境界を指定します。秘密変更・URL 別名・キャッシュ削除では受領履歴を初期化しません。
- 複数インスタンスで永続 DB を共有します。必要なら `webhooks.database_connection` を指定します。アプリケーションの業務トランザクションの外側に配置してください。

受信ルートは 64 KiB 以内の JSON HTTP 応答を返します。成功した再送には保存済みの本文・status・Content-Type を返し、業務処理を再実行しません。同じ ID の別本文、処理中、結果不明は 409 です。例外・5xx・ストリーム・上限超過は結果不明として残します。409 を無条件に再試行したり、結果不明の履歴を削除して再実行させたりしないでください。

## ライセンス

MIT License

## v2.1.1 のチャットと更新

会話の閲覧領域を優先し、設定・詳しい画面情報・補足はメニューや折り畳みから確認できます。Markdownの回答、左右にスクロールできる表、Mermaidの図、逐次応答と公開された処理状態を表示します。履歴・確認操作・通信中断後の結果照会を利用でき、確認待ち・失敗・結果不明を完了と区別します。

添付が許可された業務AIでは、画像やファイルを選び、保存結果を確認してから会話へ送信します。本人・会話・AI・組織または連携先の業務範囲を維持し、添付によって新しい権限を付与しません。

Composerでパッケージを更新し、標準画面を公開済みの場合は付属アセットの更新手順に従います。既存の接続・会話・業務権限は保持します。

詳細はこの版のリリースノートを参照してください。実画面で未確認の条件は、統合リポジトリの引継ぎテスト手順で別に管理します。すべての表示条件・外部連携の受入完了を示すものではありません。
