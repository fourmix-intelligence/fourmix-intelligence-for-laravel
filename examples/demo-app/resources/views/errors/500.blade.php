@extends('layouts.app', ['isErrorPage' => true])
@section('title', '処理を完了できませんでした')
@section('content')
<section class="demo-card" aria-labelledby="error-title">
    <p class="demo-muted">500</p>
    <h1 id="error-title">処理を完了できませんでした</h1>
    <p>一時的な問題が発生しました。少し時間を置いてから、もう一度お試しください。</p>
    <a class="fi-button fi-button-secondary" href="{{ route('notes.index') }}">備忘一覧へ戻る</a>
</section>
@endsection
