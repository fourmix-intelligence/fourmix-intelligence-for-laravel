@extends('layouts.app')
@section('title', $note->title)
@section('content')
<a href="{{ route('notes.index') }}">← 備忘一覧へ</a>
<article class="demo-card">
    <h1>{{ $note->title }}</h1>
    <p class="demo-muted">{{ $note->updated_at->timezone(config('app.timezone'))->format('Y年n月j日 H:i') }} 更新</p>
    <div class="demo-body">{{ $note->body }}</div>
</article>
@endsection
