@extends('layouts.app', ['isErrorPage' => true])
@section('title', 'しばらく待ってからお試しください')
@section('content')
<section class="demo-card" aria-labelledby="error-title">
    <p class="demo-muted">429</p>
    <h1 id="error-title">しばらく待ってからお試しください</h1>
    <p>短時間に多くの操作が行われました。少し時間を置いてから、もう一度お試しください。</p>
    <a class="fi-button fi-button-secondary" href="{{ route('notes.index') }}">備忘一覧へ戻る</a>
</section>
@endsection
