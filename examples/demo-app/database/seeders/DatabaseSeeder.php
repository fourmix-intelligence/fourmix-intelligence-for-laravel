<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['alice' => 'アリス', 'bob' => 'ボブ'] as $account => $name) {
            $user = User::firstOrCreate(['email' => $account.'@example.test'], ['name' => $name, 'password' => 'demo-password']);
            $user->notes()->firstOrCreate(['title' => $name.'の確認用メモ'], ['body' => 'これは合成データです。本人のアカウントからだけ閲覧できます。']);
            $user->notes()->firstOrCreate(['title' => $name.'の連携テスト'], ['body' => 'AIへの許可は接続設定で本人が選択します。備忘の作成は内容を確認してから実行します。']);
        }
    }
}
