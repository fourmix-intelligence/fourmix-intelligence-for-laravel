# AI API

[ガイド一覧](README.md)

## 接続と AI を明示する

```php
use FourmixIntelligence\Laravel\Facades\FourmixIntelligence;

$connection = FourmixIntelligence::connection('業務用接続');
$agents = $connection->agents();
$writer = $connection->agent('document-writer');
$reviewer = $connection->agent('document-reviewer');

$draft = $writer->ask('案内文の下書きを作成してください。');
$review = $reviewer->context(['draft' => $draft->answer])
    ->ask('案内文の分かりにくい箇所を指摘してください。');
```

同一接続から複数の AI を用途ごとに呼べます。接続名は現在の本人が所有する接続だけから解決します。名称が重複した場合は接続 UUID を指定します。接続名だけで別アカウントの接続を利用することはできません。

`agents()` の戻り値はメタデータのリストです。`grant_id`、`identify`、`slug`、`name`、`audience`、`scope`、資料・能力の説明などを含みますが、項目は Fourmix Intelligence の応答によって異なります。機密の内部項目は除外します。一覧取得は通信を行いますが、会話や選択の保存は行いません。

呼出し時は現在の Fourmix Intelligence 利用許可と接続の有効性を再確認します。SDK は、Fourmix Intelligence のモデル、資料庫、外部サービス、対内・対外の規則を呼出しオプションで上書きしません。

## 設定済みの呼び出し名を使用する

```php
$result = FourmixIntelligence::agent('ui-page')->ask('予定を整理してください。');
$result = FourmixIntelligence::agent('ui-floating')->ask('この内容を確認してください。');
```

標準設定と独立した業務用呼び出し名をサーバー側で登録する場合は、既存の `AgentSelection` を利用できます。

```php
use FourmixIntelligence\Laravel\AgentSelection;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;

$context = app(IntegrationAccess::class)->context($request);
app(AgentSelection::class)->select(
    $context,
    'document-reviewer',
    $ownedConnectionId,
    $authorizedGrantId,
    'internal',
);

$result = FourmixIntelligence::agent('document-reviewer')->ask('内容を確認してください。');
```

`select()` は現在の所有者と Fourmix Intelligence の許可を検査します。管理操作の認証・CSRF・用途別認可はアプリケーション側で実装してください。単に AI を呼ぶ用途なら `connection()->agent()` が簡潔で、選択の DB 保存は不要です。

## 会話を継続する

```php
$first = $writer->ask('説明文を作成してください。');
$chat = $writer->conversation($first->conversationId);
$second = $chat->ask('もう少し短くしてください。');
$list = $writer->conversations();
$history = $chat->history();
$older = $chat->history($beforeMessageId);
```

`conversation()` には Fourmix Intelligence が返した UUID を指定します。`conversationId` がない応答では継続操作を行わず、エラーを処理してください。`history()` には先に会話の指定が必要です。会話一覧・履歴の応答は配列です。Fourmix Intelligence の応答にない項目を決め打ちしません。

接続や AI、顧客識別を変更する場合は新しい会話を始めます。別の AI に同じ会話 ID を渡して権限や会話を引き継ぐ方法は使用しません。メソッドは複製した Agent を返すため、元の `$writer` は変更しません。

## 結果オブジェクト

`ask()` と `stream()` は `Data\AgentResult` を返します。

| プロパティ | 内容 |
| --- | --- |
| `answer` | 表示用の回答本文 |
| `conversationId` | 継続用会話 UUID。ない場合は `null` |
| `runId`, `agent` | 実行識別子と応答の識別情報 |
| `data` | 構造化結果 |
| `references` | 参照情報 |
| `followUpQuestions` | 続けて質問するための候補 |
| `customerToken`, `conversationMode` | 対外向け会話に関する情報 |
| `raw` | Fourmix Intelligence の応答全体。必要なサーバー処理だけで使用 |

`raw` や `customerToken` をログに出さず、ブラウザーへ必要な項目だけ返してください。業務の成功は回答の文章で判定せず、確認・実行履歴の状態で判定します。

## ストリーミング応答

```php
$result = $writer->stream('説明してください。', function (array $event): void {
    $type = $event['type'] ?? '';
    $data = $event['data'] ?? [];
    if ($type === 'assistant.delta') {
        // 独自のレスポンスストリームへ本文の差分を送ります。
        $text = $data['text'] ?? '';
    }
});
```

代表的なイベントは `run.created`、`run.status`、`assistant.delta`、`run.completed`、`run.failed` です。`run.status` の phase や説明は変化するため、未知の状態も受け取れる表示にします。完了イベントの後で `AgentResult` が返ります。失敗イベントは例外として扱います。

独自 UI では PHP の `response()->stream()` などで NDJSON または SSE に変換し、プロキシのバッファリングを調整してください。上記 callback だけではブラウザーへ配信されません。標準 UI の配信経路をそのまま使うこともできます。

中止は受信を止める操作であり、実行済みの業務変更の取り消しではありません。応答が途切れた書込みを自動で再送せず、実行履歴を確認します。

## 添付

```php
use Illuminate\Support\Str;

$upload = $writer->upload($validatedUploadedFile, (string) Str::uuid());
$chat = $writer->conversation($upload['conversation_id']);
$files = $chat->files();
$content = $chat->file($attachmentId);
$result = $chat->attachments([$attachmentId])->ask('添付の要点を整理してください。');
$chat->deleteFile($attachmentId);
```

`upload()` は `Illuminate\Http\UploadedFile` と受付 UUID を受け取ります。同じアップロードを再試行する場合は同じ受付 UUID を維持します。添付 ID は Fourmix Intelligence が返した値を使用し、アプリケーションの任意のファイルパスを渡しません。

既定は 1 ファイル 10 MiB、1 回 5 件で、Fourmix Intelligence の上限が小さい場合はその範囲に従います。画像、PDF、テキスト、CSV/TSV、Office 文書に対応します。マクロ・暗号化ファイル・偽装などは拒否される場合があります。会話専用の添付で、共有資料庫へ自動登録しません。

一覧・取得・削除にも本人、接続、AI、会話の検証を適用します。例の変数は実際のアップロード応答の添付 ID から設定してください。

## ジョブから利用する

```php
use FourmixIntelligence\Laravel\Tools\ToolContext;

$context = new ToolContext('user:'.$verifiedUser->getAuthIdentifier());
$result = FourmixIntelligence::connection($connectionId)
    ->forUser($context)->agent('document-writer')->ask($message);
```

`forUser()` の引数は User モデルではなく、アプリケーションの実行主体を表す `ToolContext` です。ジョブの実行前に利用者が現在も有効か、業務の実行を許可されているか確認します。モデルやブラウザーが指定した subject をそのまま使いません。独自の `IntegrationAccess` があるアプリでは、その主体規則に合わせてください。

HTTP のログインなしで暗黙にシステム権限へ切り替えることはありません。キューの再試行は業務の重複実行防止とセットで設計します。

## 対外向け AI

```php
$customer = FourmixIntelligence::connection($ownedConnectionId)
    ->forUser($verifiedOwnerContext)->agent('product-advisor')
    ->forVisitor($verifiedCustomerId);
$result = $customer->ask('商品を比較してください。');
```

接続を管理するアカウントと、会話する顧客は別です。`forVisitor()` は検証済みの安定した顧客識別子を指定し、履歴・添付・継続呼出しにも引き継ぎます。許容文字は英数字・`_ . : -`、1～128 文字です。メールアドレスなどを直接 ID にせず、アプリ側の不透明な識別子を推奨します。

`forVisitor()` だけで顧客の認証や業務認可が成立するわけではありません。独自ルートで認証・レート制限・用途別認可を実装し、顧客向けツールの本人解決も `ToolPolicy` で実装します。既定の個人向け Policy をそのまま顧客の注文操作に使いません。

## エラー

通信先の失敗は `Exceptions\ApiException`、接続失敗は Laravel HTTP クライアントの `ConnectionException`、前提不足は `LogicException` / `InvalidArgumentException`、認可などは HTTP 例外として通知されます。`ApiException::$status` で利用者へ示す状態を判定できます。

接続や AI の再確認が必要なエラーは、管理画面へ案内します。内部例外本文や Fourmix Intelligence の応答全体を画面へ表示しません。AI が「実行しました」と回答しても、業務実行の記録が成功していなければ完了として扱いません。

