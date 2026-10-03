@extends('layouts.app', ['isErrorPage' => true])
@section('title', 'この操作は利用できません')
@section('content')
<section class="demo-card" aria-labelledby="error-title">
    <p class="demo-muted">403</p>
    <h1 id="error-title">この操作は利用できません</h1>
    <p>このページを開く権限がありません。利用するアカウントと操作の許可を確認してください。</p>
    <a class="fi-button fi-button-secondary" href="{{ route('notes.index') }}">備忘一覧へ戻る</a>
</section>
@endsection
