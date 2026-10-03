@props(['alias' => '', 'surface' => '', 'initialPrompt' => '', 'assistantName' => '', 'inputPlaceholder' => '質問や依頼を入力…', 'composerMaxHeight' => 160, 'layout' => 'embedded'])
@once
<link rel="stylesheet" href="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('sdk.css') }}" />
<script type="module" src="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('sdk.js') }}"></script>
@endonce
<fourmix-intelligence-chat {{ $attributes->merge(['class' => 'fi:min-w-0', 'aria-label' => 'Fourmix Intelligence AI アシスタント']) }} alias="{{ $alias }}" surface="{{ $surface }}" assistant-name="{{ $assistantName }}" initial-prompt="{{ $initialPrompt }}" input-placeholder="{{ $inputPlaceholder }}" composer-max-height="{{ $composerMaxHeight }}" layout="{{ $layout === 'fill' ? 'fill' : 'embedded' }}" api-base="{{ url(config('fourmix-intelligence.ui.prefix', 'fourmix-intelligence')) }}" csrf-token="{{ csrf_token() }}"></fourmix-intelligence-chat>
