@extends('layouts.app')
@section('title', 'ログイン')
@section('content')
<div class="demo-login">
    <h1>サンプルにログイン</h1>
    <p class="demo-muted">個人の備忘とAI連携を、合成データで確認できます。</p>
    <form class="demo-card" method="POST" action="{{ route('login.store') }}">
        @csrf
        <label class="demo-field">メールアドレス<input type="email" name="email" value="{{ old('email') }}" autocomplete="username" required></label>
        <label class="demo-field">パスワード<input type="password" name="password" autocomplete="current-password" required></label>
        @if($errors->any())<p class="demo-error" role="alert">{{ $errors->first() }}</p>@endif
        <button class="fi-button" type="submit">ログイン</button>
    </form>
    <div class="demo-card">
        <h2>確認用アカウント</h2>
        <p><code>alice@example.test</code><br><code>bob@example.test</code></p>
        <p class="demo-muted">パスワードはどちらも <code>demo-password</code> です。本人の備忘だけを閲覧できます。</p>
    </div>
</div>
@endsection
