# 導入と接続

[ガイド一覧](README.md)

## 1. インストール

PHP 8.3 / 8.4、Laravel 12 / 13 に対応します。Composer がサービスプロバイダーと Facade を自動登録します。

```bash
composer config repositories.fourmix-intelligence vcs https://github.com/fourmix-intelligence/fourmix-intelligence-for-laravel
composer require fourmix-intelligence/laravel
php artisan fi:install --with-migration --no-interaction
php artisan migrate --no-interaction
```

`fi:install` は構成ファイルを公開します。`--with-migration` は新規導入用の初期 migration も公開しますが、DB を変更するコマンドは実行しません。`--force` を併用しても既存 migration は上書きしません。既に SDK の表がある環境では、初期 migration を書き換えず、必要な差分をアプリケーションの増分 migration で適用してください。

既存の認証済み Laravel 画面から次へリンクします。

```blade
<a href="{{ route('fourmix-intelligence.manage') }}">AIの設定</a>
<a href="{{ route('fourmix-intelligence.chat') }}">AIアシスタント</a>
```

ログイン機能はアプリケーションが提供します。SDK の既定ミドルウェアは `web` と `auth` です。日本語のアプリケーションでは `config/app.php` の `locale` を `ja`、`timezone` を `Asia/Tokyo` にします。SDK はアプリケーションの言語と時刻設定を利用します。

## 2. 最初はチャットだけで接続する

1. Laravel の管理画面で「新しい接続を作成」を開き、用途が分かる名前を付けます。業務ツールが不要なら公開業務を選びません。
2. Laravel が接続キーを発行します。キーは一度限り、10 分有効です。
3. Fourmix Intelligence の「サービス接続」で Laravel のアプリ URL とキーを入力します。個人・組織・ワークスペースの範囲は Fourmix Intelligence 側で決めます。
4. 握手が成功すると、キーを発行した Laravel のアカウントと Fourmix Intelligence のアカウントが接続に関連付けられます。手入力の「本人の関連付けコード」は不要です。
5. Fourmix Intelligence の接続画面で、この接続に利用を許可する AI Studio の AI を選びます。複数を許可できます。
6. Laravel の「チャットの設定」で、ページと側窓それぞれの接続・AI を選択します。別の AI を設定でき、片方だけ停止することもできます。

接続 ID・トークン・共有秘密を `.env` に貼る必要はありません。複数の接続を DB で管理します。Fourmix Intelligence の AI 自体の対内・対外区分、モデル、資料庫、外部サービス、回答規則は Fourmix Intelligence の設定に従います。

同じキーを複数の Fourmix Intelligence 接続に流用しません。接続カードから命名、権限変更、解除・削除を行います。解除や削除で過去の実行を取り消すことはありません。

## 3. 標準の側窓を配置する

認証済みレイアウトの任意の場所へ置きます。SDK はレイアウトを自動変更しません。

```blade
<x-fourmix-intelligence::surface name="floating" />
```

ページは名前付きルートで利用できます。標準 UI は社内向け AI 用です。顧客向け画面は [AI API](ai-api.md) の顧客識別とアプリケーションの認可を使って実装します。

## 4. 独自画面から AI を呼ぶ

```php
use FourmixIntelligence\Laravel\Facades\FourmixIntelligence;

$connection = FourmixIntelligence::connection('社内の相談窓口');
$available = $connection->agents();
$result = $connection->agent('support-assistant')->ask('文章を読みやすく整理してください。');

return response()->json(['answer' => $result->answer]);
```

`agents()` はこの接続へ現在許可された AI のメタデータを取得し、AI を実行しません。`agent()` には Fourmix Intelligence の slug・identify・grant_id のいずれかを指定できます。表示名の一致や一覧の先頭で選ばず、用途に対応する識別子を保存してください。

設定済み標準ページの AI は `FourmixIntelligence::agent('ui-page')`、側窓は `agent('ui-floating')` で利用できます。この呼び出し名は開発者用で、チャット画面に見せる項目ではありません。

## 5. 業務操作を追加する

```bash
php artisan fi:make-tool Notes/LookupNote --operation=notes.lookup --no-interaction
php artisan fi:make-policy AiToolPolicy --no-interaction
```

生成されたクラスは未実装のまま業務を許可しません。既存サービス、認可、確認用表示を実装し、構成へ登録します。[業務ツールと認可](business-tools.md) に実装例があります。

```php
// config/fourmix-intelligence.php の該当項目
'bridge' => [
    'enabled' => true,
    'tool_handlers' => [App\Tools\Notes\LookupNote::class],
    'enabled_operations' => ['notes.lookup'],
],
```

```bash
php artisan fi:tools --no-interaction
php artisan fi:tools --json --no-interaction
```

登録後、Laravel の接続で公開業務を選び直し、新しいキーを Fourmix Intelligence で接続確認します。AI Studio の AI にこの Laravel サービスを利用させる場合は、Fourmix Intelligence 側でそのサービスを AI に追加します。チャットだけの AI に Laravel 業務を実行する能力は自動追加されません。

## 6. ローカルと本番の接続先

本番の握手先は `native.trusted_platform_urls` の完全一致で制限します。自社運用 Fourmix Intelligence の API URL は開発者が構成へ登録します。利用者が任意の URL を入力して制限を広げることはできません。

ローカル開発では `local` / `testing` の localhost・127.0.0.1・host.docker.internal 接続が可能です。Docker 内から別コンテナーへ届く URL と、ブラウザーで開く URL を区別してください。アプリ URL は Fourmix Intelligence サーバーから到達できる必要があります。

双方のサーバーが稼働していれば、Laravel のブラウザーを閉じても Fourmix Intelligence から業務を利用できます。接続設定は管理画面、モデルやツールの実装はアプリケーションのコードで管理します。

