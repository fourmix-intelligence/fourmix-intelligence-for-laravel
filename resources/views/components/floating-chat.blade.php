@props(['alias' => '', 'surface' => '', 'label' => 'AIに相談', 'title' => 'AIアシスタント', 'position' => 'right', 'initialPrompt' => '', 'context' => [], 'fallbackUrl' => null, 'assistantName' => '', 'inputPlaceholder' => '質問や依頼を入力…', 'composerMaxHeight' => 112, 'launcherHidden' => false])
@once
<link rel="stylesheet" href="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('sdk.css') }}" />
<script type="module" src="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('sdk.js') }}"></script>
@endonce
<fourmix-intelligence-floating-chat {{ $attributes->merge(['class' => 'fi:block', 'aria-label' => 'Fourmix Intelligence AI アシスタント']) }} alias="{{ $alias }}" surface="{{ $surface }}" label="{{ $label }}" title="{{ $title }}" position="{{ $position }}" @if($launcherHidden) launcher-hidden @endif assistant-name="{{ $assistantName }}" input-placeholder="{{ $inputPlaceholder }}" composer-max-height="{{ $composerMaxHeight }}" initial-prompt="{{ $initialPrompt }}" context="{{ json_encode((object) $context, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) }}" fallback-url="{{ $fallbackUrl ?? route('fourmix-intelligence.chat') }}" api-base="{{ url(config('fourmix-intelligence.ui.prefix', 'fourmix-intelligence')) }}" csrf-token="{{ csrf_token() }}">
    <a class="fi-floating-launcher" @if($launcherHidden) hidden @endif href="{{ $fallbackUrl ?? route('fourmix-intelligence.chat') }}">{{ $label }}</a>
</fourmix-intelligence-floating-chat>
