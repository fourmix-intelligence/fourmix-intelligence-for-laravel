@extends('fourmix-intelligence::layout')
@section('chat-layout', 'true')
@section('content')
<main class="fi-page fi-chat-page" aria-label="AI アシスタント">
    <h1 class="fi:sr-only">AI アシスタント</h1>
    <x-fourmix-intelligence::surface :name="$surface" :initial-prompt="$initialPrompt" />
</main>
@endsection
