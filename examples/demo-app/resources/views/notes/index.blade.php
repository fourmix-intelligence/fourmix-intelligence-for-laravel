@extends('layouts.app')
@section('content')
<h1>個人の備忘</h1>
<p class="demo-muted">自分の備忘だけを表示しています。AIで新規作成するには、接続設定で利用するAIと操作の許可を選択してください。</p>
<div class="demo-card">
    <h2>AI連携を試す</h2>
    <p>「私の備忘を一覧にして」「件名を『次回の確認』、本文を『来週の予定を確認する』として備忘を作成して」のように相談できます。作成前に内容を確認できます。</p>
    <a class="fi-button fi-button-secondary" href="{{ route('fourmix-intelligence.manage') }}">AI・接続設定を開く</a>
</div>
<div class="demo-card">
    <h2>備忘一覧</h2>
    <ul class="demo-list">
    @forelse($notes as $note)
        <li><a href="{{ route('notes.show', $note) }}"><strong>{{ $note->title }}</strong></a><div class="demo-muted">{{ $note->updated_at->timezone(config('app.timezone'))->format('Y年n月j日 H:i') }} 更新</div></li>
    @empty
        <li class="demo-muted">備忘はまだありません。AIに相談して最初の備忘を作成できます。</li>
    @endforelse
    </ul>
    <nav aria-label="備忘のページ">
        @if($notes->previousPageUrl())<a href="{{ $notes->previousPageUrl() }}">前のページ</a>@endif
        <span class="demo-muted">{{ $notes->currentPage() }} / {{ $notes->lastPage() }} ページ</span>
        @if($notes->nextPageUrl())<a href="{{ $notes->nextPageUrl() }}">次のページ</a>@endif
    </nav>
</div>
@endsection
