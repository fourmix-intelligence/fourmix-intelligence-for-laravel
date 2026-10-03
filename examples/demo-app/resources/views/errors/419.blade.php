@extends('layouts.app', ['isErrorPage' => true])
@section('title', 'ページの有効期限が切れました')
@section('content')
<section class="demo-card" aria-labelledby="error-title">
    <p class="demo-muted">419</p>
    <h1 id="error-title">ページの有効期限が切れました</h1>
    <p>ページを開き直してから、もう一度お試しください。ログイン画面が表示された場合は、再度ログインしてください。</p>
    <a class="fi-button fi-button-secondary" href="{{ route('notes.index') }}">備忘一覧へ戻る</a>
</section>
@endsection
