# テストと運用

[ガイド一覧](README.md)

## アプリケーションで確認する項目

SDK のテストは通信、接続、AI 選択、確認・重複防止、UI の一般的な動作を検証します。アプリ固有の業務権限や計算を代替しません。

| 対象 | 必要な確認 |
| --- | --- |
| 接続 | 未接続、期限切れキー、解除、別所有者、複数の同名接続 |
| AI | 許可あり・撤回、未選択、別 AI の会話、対内・対外の区分 |
| 業務 | 本人のデータ、他人のデータ、無効なアカウント、組織変更 |
| 更新 | 確認前は未保存、確認後一回だけ保存、同じ UUID の再送、対象変更 |
| ファイル | 他人の添付、拡張子・MIME・サイズ、同じ受付 UUID、削除 |
| UI | ページと側窓の独立設定、停止、携帯表示、草稿、中止と再開 |

## 通信を偽装するテスト

モデルの課金や実サービスの変更を使わず、Laravel の HTTP fake と合成データで検証します。

```php
use Illuminate\Support\Facades\Http;

Http::preventStrayRequests();
Http::fake([
    'https://platform.example.test/*' => Http::response([
        'run_id' => 'synthetic-run',
        'result' => ['answer' => '合成の応答です。'],
    ]),
]);
```

実際の native API テストでは、`agents` の許可一覧も fake し、接続と本人関連付けの合成 fixture を用意します。単に回答 endpoint だけを fake して認可を通過させることはできません。SDK の `tests/StudioAgentTest.php`、`tests/UiSurfaceTest.php`、`tests/BusinessToolsTest.php` を参考に、アプリ側の factory・HTTP 認証を使用してください。

`Http::assertNothingSent()` は未認可の処理が外部へ出ていないこと、`Http::assertSentCount()` は重複送信がないことの検査に使用できます。承認テストは確認前後の DB と実行履歴を両方確認します。

## SDK 自体の開発

```bash
composer install
composer validate --strict
composer analyse
composer test
npm ci
npm run test:ui
npm run build
```

PHP 8.3 + Laravel 12、PHP 8.4 + Laravel 13 の組合せで確認します。開発用 Testbench と PHPUnit の対応版は `composer.json` に従います。JS は `package.json` の engines と lockfile を使用します。配布ファイルを変更した場合は参照する分割ファイルとライセンスも確認します。

生成コマンドのテストは一時 Laravel ディレクトリ、業務・接続のテストはメモリ内 DB を使います。稼働中の共有 DB や利用者の接続をテストのために消去しません。

## DB と暗号化

接続秘密、確認入力、実行結果などを暗号化して保存します。`APP_KEY`、DB、アプリ固有のデータを復元できる組合せで保管してください。`APP_KEY` を無計画に変更すると既存の暗号化データを解読できません。

新規導入だけ初期 migration を使用します。運用開始後は適用済み migration を編集せず、増分 migration を作成します。`fourmix-intelligence-business` と `fourmix-intelligence-webhooks` は同じ初期構造を公開するため、二重に適用しません。利用履歴がある初期 migration の巻戻しは拒否します。

構成変更後はアプリの通常の手順で構成キャッシュを更新します。公開済み views / assets はパッケージ更新だけでは置き換わらないため、カスタマイズとの差分を確認します。

## 接続と権限の変更

Laravel が公開業務を変更すると、新しい接続キーで Fourmix Intelligence の接続確認が必要です。古い接続秘密・本人関連付け・チャット設定を黙って流用しません。Fourmix Intelligence の AI 許可を撤回すると次回の呼出しは失敗し、Laravel から許可を増やすことはできません。

操作の意味やスキーマを変更した場合は `version` を更新します。SDK の定義指紋が変わると以前の継続許可は毎回確認へ戻り、古い確認依頼は拒否します。接続が広い範囲へ移動しても Laravel の業務権限は広がりません。

## 障害時の確認

```bash
php artisan fi:doctor --no-interaction
php artisan fi:doctor --connection=<接続UUID> --no-interaction
php artisan fi:tools --json --no-interaction
```

最初のコマンドは課金モデルを呼ばず構造を確認します。接続 UUID 指定時は Fourmix Intelligence へ AI 一覧の確認を行います。`fi:tools` は通信を行いません。CLI は運用者向けなので、OS・コンテナーへのアクセスも運用権限で制限してください。

| 症状 | 確認すること |
| --- | --- |
| AI がない | Fourmix Intelligence がその接続へ AI を許可したか、Laravel の設定が済んでいるか |
| 会話できるが業務が使えない | AI Studio のサービス選択、Laravel の公開候補・接続許可・ToolPolicy |
| 403 | 現在の本人、AI の区分、接続、対象レコードの認可 |
| 409 | キー・操作定義・対象内容・選択の変更。同じ UUID の別入力 |
| 422 | 入力スキーマ、会話 UUID、顧客識別、添付制限 |
| ストリームがまとめて来る | PHP / reverse proxy のバッファリング、タイムアウト |
| 設定や UI が古い | 構成キャッシュ、Blade override、公開済み assets、ブラウザーキャッシュ |

応答待ちが切れても業務が未実行とは限りません。`running` / `unknown_effect` を成功とも失敗とも決めつけず、操作履歴と実データを照合します。未確認の書込みを自動再送しません。

## ログと監視

受付 UUID、接続 ID、操作名、状態、所要時間を追跡に使います。キー、トークン、customerToken、暗号化前の入力、回答全体、ファイル内容をログに記録しません。アプリのログ保持と監査の方針に従います。

日本向けのアプリでは `Asia/Tokyo` を表示の基準にし、UTC の保存値を文字列加工だけで日本時刻に見せないでください。アプリの日時型・タイムゾーン変換を使用し、日付のみの業務項目を時刻へ勝手に変換しません。

外部サービスへの変更がある場合は、相手側の受付 ID、重複排除、結果照会を組み合わせます。SDK の DB トランザクションだけで外部システムの変更まで原子的にはなりません。

