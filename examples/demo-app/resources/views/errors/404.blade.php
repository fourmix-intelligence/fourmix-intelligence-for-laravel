@extends('layouts.app', ['isErrorPage' => true])
@section('title', 'ページが見つかりません')
@section('content')
<section class="demo-card" aria-labelledby="error-title">
    <p class="demo-muted">404</p>
    <h1 id="error-title">ページが見つかりません</h1>
    <p>指定したページは表示できません。URLを確認するか、備忘一覧へお戻りください。</p>
    <a class="fi-button fi-button-secondary" href="{{ route('notes.index') }}">備忘一覧へ戻る</a>
</section>
@endsection
