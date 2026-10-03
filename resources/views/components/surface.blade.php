@if($surfaceType === 'page')
<x-fourmix-intelligence::chat {{ $attributes }} :surface="$surface" :alias="$alias" :initial-prompt="$initialPrompt" layout="fill" />
@else
<x-fourmix-intelligence::floating-chat {{ $attributes }} :surface="$surface" :alias="$alias" :title="$title" :initial-prompt="$initialPrompt" />
@endif
