# AGENTS.md

## 製品名と言語

- 製品名は必ず「Fourmix Intelligence」と表記する。「Fourmix」だけをサービス名として使わない。
- README、管理画面、エラー、コミット、リリースノートなどの成果物は、日本企業のお客様が読める自然な日本語で作成する。
- クラス名、設定キー、公開 API は Laravel / PHP の慣例に従い英語で記述する。

## 方針

- Laravel 本来の HTTP、Queue、Event、Cache、Config、Service Provider の仕組みを尊重する。
- Laravel AI SDK を再実装しない。本パッケージは Fourmix Intelligence の代理、継続会話、資料同期、ツール、監査を Laravel へ安全に接続する。
- 秘密情報をログ、例外本文、URL、フロントエンドへ出さない。
- 組織、利用者、会話、資料庫の境界を曖昧にしない。
- 破壊的変更は CHANGELOG に記載し、SemVer に従う。

## 検証

- 公開 API の変更にはテストを追加する。
- `composer validate --strict`、静的解析、テストを通してからリリースする。

