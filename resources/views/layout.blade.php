<!doctype html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Fourmix Intelligence</title>
    <script>
        (() => {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            let saved;
            try { saved = localStorage.getItem('fourmix-intelligence-theme'); } catch {}
            const apply = theme => {
                document.documentElement.dataset.fiTheme = theme;
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.style.colorScheme = theme;
                const button = document.querySelector('[data-fi-theme-toggle]');
                if (button) {
                    const label = theme === 'dark' ? 'ライトテーマに切替' : 'ダークテーマに切替';
                    button.setAttribute('aria-label', label);
                    button.title = label;
                }
            };
            apply(saved === 'dark' || saved === 'light' ? saved : media.matches ? 'dark' : 'light');
            document.addEventListener('DOMContentLoaded', () => {
                apply(document.documentElement.dataset.fiTheme);
                document.querySelector('[data-fi-theme-toggle]')?.addEventListener('click', () => {
                    saved = document.documentElement.dataset.fiTheme === 'dark' ? 'light' : 'dark';
                    try { localStorage.setItem('fourmix-intelligence-theme', saved); } catch {}
                    apply(saved);
                });
            });
            media.addEventListener('change', () => { if (saved !== 'dark' && saved !== 'light') apply(media.matches ? 'dark' : 'light'); });
        })();
    </script>
    <link rel="stylesheet" href="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('sdk.css') }}">
    <script type="module" src="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('sdk.js') }}"></script>
    @yield('head')
</head>
<body class="fi:m-0 fi:min-h-screen fi:bg-canvas fi:font-sans fi:text-ink fi:antialiased @hasSection('chat-layout') fi-sdk-chat-layout @endif">
    <a href="#fi-main" class="fi-button fi:sr-only fi:focus:not-sr-only fi:focus:fixed fi:focus:left-4 fi:focus:top-4 fi:focus:z-50">本文へ移動</a>
    <header class="fi-sdk-header">
        <div class="fi-sdk-header-inner">
            <a href="{{ route('fourmix-intelligence.chat') }}" class="fi-sdk-brand" aria-label="Fourmix Intelligence">
                <img src="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('brand-icon.png') }}" class="fi-sdk-brand-icon" alt="" width="36" height="36">
                <img src="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('brand-wordmark.svg') }}" class="fi-sdk-brand-wordmark" alt="Fourmix Intelligence" width="222" height="12">
            </a>
            <div class="fi-sdk-header-actions fi:flex fi:items-center fi:gap-3">
                <nav class="fi-sdk-navigation" aria-label="AI連携のメニュー">
                    @unless(View::hasSection('chat-layout'))
                    <a href="{{ route('fourmix-intelligence.chat') }}" @if(request()->routeIs('fourmix-intelligence.chat')) aria-current="page" @endif>アシスタント</a>
                    @endunless
                    <a href="{{ route('fourmix-intelligence.manage') }}" @if(request()->routeIs('fourmix-intelligence.manage')) aria-current="page" @endif>接続と許可</a>
                </nav>
                <button type="button" data-fi-theme-toggle class="fi-button fi-button-secondary fi:min-h-9 fi:px-2.5" aria-label="表示テーマを切替">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" /></svg>
                </button>
            </div>
        </div>
    </header>
    <div id="fi-main" tabindex="-1">@yield('content')</div>
</body>
</html>
