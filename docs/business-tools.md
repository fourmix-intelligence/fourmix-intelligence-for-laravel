# 業務ツールと認可

[ガイド一覧](README.md)

## 属性から一覧を生成する

```bash
php artisan fi:make-tool Notes/NoteTools --operation=notes.lookup --no-interaction
php artisan fi:make-policy AiToolPolicy --no-interaction
```

属性付きの public メソッドを `bridge.tool_handlers` に登録すると、SDK が Reflection で公開候補を作ります。ツール名、説明、scopes、入力、参照・更新、公開区分、version が一覧へ反映されます。private メソッドや未登録のクラスは公開しません。

引数スキーマは宣言が必要です。PHP の型だけで入力や DB のルールを完全推測しません。既存 FormRequest の規則を利用する場合は `ValidationSchema::fromRules($rules, $hiddenFields)` でメタデータを生成できますが、認可・exists・unique・条件付き規則・独自ルールの完全な代替ではありません。

## 参照ツールの例

次は既存の備忘モデルを使う説明用クラスです。`Note` と `User` の定義はアプリケーションに合わせます。既存 NotePolicy の `viewAny` / `create` も実装済みであることを前提とします。

```php
namespace App\Tools\Notes;

use App\Models\Note;
use App\Models\User;
use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use Illuminate\Support\Facades\Gate;

final class NoteTools
{
    #[FourmixIntelligenceTool(
        name: 'notes.list',
        description: '本人の備忘の件名と更新日時を新しい順に取得します。',
        scopes: ['notes:read'],
        inputSchema: ['type' => 'object', 'properties' => [], 'additionalProperties' => false],
        domain: 'notes',
        keywords: ['備忘', 'メモ'],
    )]
    public function list(ToolContext $context): array
    {
        abort_unless(str_starts_with($context->subject, 'user:'), 403);
        $user = User::query()->findOrFail(substr($context->subject, 5));
        Gate::forUser($user)->authorize('viewAny', Note::class);

        return ['notes' => Note::query()->where('user_id', $user->getAuthIdentifier())
            ->latest('updated_at')->limit(50)->get(['id', 'title', 'updated_at'])
            ->map(fn (Note $note): array => ['id' => $note->getKey(), 'title' => $note->title,
                'updated_at' => $note->updated_at?->timezone(config('app.timezone'))->toIso8601String()])
            ->all()];
    }
}
```

一覧は件数を制限し、必要な項目だけ返します。個別照会にも、対象 ID だけでなく本人の所有権や組織境界を適用します。レスポンスへトークンや秘密、未許可の関連モデルを含めません。

## 書込みツールの例

同じクラスへ次を追加できます。保存時の入力・認可を既存の業務サービスで行う実装に置き換えても構いません。

```php
#[FourmixIntelligenceTool(
    name: 'notes.create',
    description: '本人の備忘を新しく作成します。',
    scopes: ['notes:write'],
    readOnly: false,
    requiresApproval: true,
    inputSchema: [
        'type' => 'object',
        'properties' => [
            'title' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 120],
            'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 2000],
        ],
        'required' => ['title', 'body'],
        'additionalProperties' => false,
    ],
    version: '1',
)]
public function create(string $title, string $body, ToolContext $context): array
{
    abort_unless(str_starts_with($context->subject, 'user:'), 403);
    $user = User::query()->findOrFail(substr($context->subject, 5));
    Gate::forUser($user)->authorize('create', Note::class);
    $values = validator(compact('title', 'body'), [
        'title' => ['required', 'string', 'max:120'],
        'body' => ['required', 'string', 'max:2000'],
    ])->validate();
    $note = new Note;
    $note->user_id = $user->getAuthIdentifier();
    $note->title = $values['title'];
    $note->body = $values['body'];
    $note->save();

    return ['id' => $note->getKey(), 'title' => $note->title];
}
```

SDK が書込みの入力へ UUID の `idempotency_key` を追加します。ハンドラーに同名の引数がない場合、実行時に除いて呼び出します。外部 API の重複排除に利用する場合は `string $idempotency_key` を引数に追加し、同じ UUID を外部側へ渡します。

`requiresApproval` は更新・確認対象の宣言です。接続の `review` / `automatic` が実際の確認方法を決め、継続許可でも業務の認可を省略しません。常に人の確認が必要な独自の業務規則は、アプリケーション側でも維持してください。

## 認可アダプターを実装する

生成した `AiToolPolicy` は本人解決を `BoundUserToolPolicy` に委譲し、業務は既定で拒否します。個人アカウント接続の例では `authorize()` と `preview()` を次のように実装できます。

```php
use App\Models\Note;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

public function authorize(ToolContext $context, string $operation, array $arguments): void
{
    abort_unless(str_starts_with($context->subject, 'user:'), 403);
    $user = User::query()->findOrFail(substr($context->subject, 5));
    $ability = match ($operation) {
        'notes.list' => 'viewAny',
        'notes.create' => 'create',
        default => abort(403, 'この業務は利用できません。'),
    };
    Gate::forUser($user)->authorize($ability, Note::class);
}

public function preview(ToolContext $context, string $operation, array $arguments): array
{
    $this->authorize($context, $operation, $arguments);
    abort_unless($operation === 'notes.create', 403);

    return ['操作' => '備忘の新規作成', '登録先' => '本人の備忘',
        '件名' => $arguments['title'], '本文' => $arguments['body']];
}
```

`ToolContext` の import と `resolve()` / `reviewUrl()` は生成したクラスのものを維持します。`reviewUrl()` が空文字なら標準 UI の確認機能を利用します。独自の確認 URL を返す場合は同一オリジンの認証済みページを用意し、本人と確認依頼を検証してください。

プロバイダーで登録します。

```php
use App\Policies\AiToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;

public function register(): void
{
    $this->app->bind(ToolPolicy::class, AiToolPolicy::class);
}
```

既定の本人解決は、署名済み接続と現在の関連付けを確認し、Laravel の UserProvider から利用者を取得します。無効化・退職・組織変更などアプリ固有の状態も認可で検査してください。システム主体、複数ガード、顧客主体には専用の `resolve()` が必要です。

## 公開候補と接続許可

```php
'bridge' => [
    'enabled' => true,
    'tool_handlers' => [App\Tools\Notes\NoteTools::class],
    'enabled_operations' => ['notes.list', 'notes.create'],
],
'ui' => [
    'prefix' => 'fourmix-intelligence',
    'middleware' => ['web', 'auth'],
    'host_modes' => ['user'],
    'domain_labels' => ['notes' => '備忘'],
],
```

既存構成の該当項目へ反映し、他の項目を消さないでください。`fi:tools --json` で公開候補を確認します。この一覧は接続の実際の許可やアクセス可能なデータ一覧ではありません。接続の管理画面では、各業務を `disabled` / `review` / `automatic` から選びます。

| 判定 | 役割 |
| --- | --- |
| ハンドラー登録・enabled_operations | コードとして公開してよい候補 |
| 接続の業務設定 | その接続で使用してよい業務と確認方法 |
| Fourmix Intelligence の AI 設定・利用許可 | その AI が使用できる接続・資料・サービス |
| ToolPolicy と業務サービス | 現在の実行主体と対象データへの実際の認可 |

属性の `scopes` はこの最後の認可で解釈する宣言です。scopes を書けば Laravel の Gate が自動作成されるわけではありません。

## 動的なツール定義

既存のカタログや FormRequest から定義する場合も、ルートを自動公開せず明示登録します。

```php
app(ToolRegistry::class)->registerCallback('notes.lookup', [
    'description' => '本人の備忘を確認します。',
    'scopes' => ['notes:read'],
    'read_only' => true,
    'requires_approval' => false,
    'input_schema' => ValidationSchema::fromRules(['id' => ['required', 'integer', 'min:1']]),
], function (array $arguments, ToolContext $context): array {
    return app(MyExistingNoteService::class)->lookup($context, $arguments['id']);
});
```

上記のクラスは `Tools\ToolRegistry`、`Tools\ValidationSchema` を import します。同名登録は拒否します。属性とコールバックは同じ manifest・接続許可・確認・認可の経路を通ります。

## 対外向けツール

既定の `audiences` は `['internal']` です。顧客へ提供するツールだけ `['customer']`、両方向なら `['internal', 'customer']` を明示します。公開区分だけで顧客の本人確認が成立することはありません。`ToolPolicy` で検証済みの顧客を解決し、顧客本人のデータだけに限定してください。

## 確認と結果

書込み依頼が `confirmation_required` なら未実行です。本人の確認後に `succeeded` を取得して完了と扱います。既定の確認期限は 15 分です。確認時と実行直前に、現在の権限、接続、操作定義、対象内容を再検査します。

`preview()` は副作用を起こさず、対象・入力・変更内容を分かりやすく返します。秘密や巨大なデータを返しません。実行直前に preview が変化していれば古い確認を拒否します。

同じ受付 UUID に別入力を送ると 409 です。操作定義が変わると以前の継続許可は確認へ戻り、古い確認依頼は使用できません。実装の意味が変わる場合は `version` も更新してください。

SDK の `ToolExecutor` を通る更新は、業務保存と結果記録を同じ DB トランザクションで扱います。別 DB や外部 API はこの原子性に含まれません。外部の重複排除や outbox などをアプリ側で設計します。`running` / `unknown_effect` は成功と扱わず、結果照会は再実行しません。

`ToolRegistry::execute()` はハンドラーの低レベル実行 API です。Policy・確認・重複防止をすべて担当する API ではないため、外部から呼ぶ独自ルートに直接接続しないでください。標準の署名済み業務経路と `ToolExecutor` を使用します。

