<!doctype html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', '個人の備忘') | Fourmix Intelligence SDK Demo</title>
    <link rel="stylesheet" href="{{ app(\FourmixIntelligence\Laravel\Http\UiAssets::class)->url('sdk.css') }}">
    <style>
        body{margin:0;background:#f6f8fb;color:#17243b;font:15px/1.7 system-ui,sans-serif}
        .demo-shell{max-width:1040px;margin:auto;padding:28px 24px}.demo-header{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:1px solid #dce3ed;padding-bottom:20px;margin-bottom:32px}
        .demo-header nav{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.demo-header form{margin:0}
        a{color:#3154bb;text-decoration:none}a:hover{text-decoration:underline}.demo-card{background:#fff;border:1px solid #e3e8ef;border-radius:16px;padding:24px;margin:18px 0}.demo-muted{color:#64748b;font-size:14px}
        h1{font-size:28px;line-height:1.3}h2{font-size:18px;margin:0 0 8px}.demo-list{list-style:none;padding:0}.demo-list li{border-bottom:1px solid #edf0f5;padding:16px 0}.demo-list li:last-child{border:0}
        .demo-body{white-space:pre-wrap;overflow-wrap:anywhere}.demo-login{max-width:460px;margin:7vh auto}.demo-field{display:grid;gap:8px;margin-bottom:18px}.demo-field input{border:1px solid #cbd5e1;border-radius:10px;padding:12px;font:inherit;width:100%;box-sizing:border-box}.demo-error{color:#b42318}
    </style>
</head>
<body>
<div class="demo-shell">
    <header class="demo-header">
        <a href="{{ route('notes.index') }}"><strong>Fourmix Intelligence SDK Demo</strong></a>
        @unless($isErrorPage ?? false)
        @auth
        <nav aria-label="メインメニュー">
            <a href="{{ route('notes.index') }}">個人の備忘</a>
            <a href="{{ route('fourmix-intelligence.manage') }}">AI・接続設定</a>
            <a href="{{ route('fourmix-intelligence.chat') }}">AIに相談</a>
            <span class="demo-muted">{{ auth()->user()->name }}</span>
            <form method="POST" action="{{ route('logout') }}">@csrf<button class="fi-button fi-button-secondary" type="submit">ログアウト</button></form>
        </nav>
        @endauth
        @endunless
    </header>
    <main>@yield('content')</main>
</div>
@unless($isErrorPage ?? false)
@auth
<x-fourmix-intelligence::surface name="floating" />
@endauth
@endunless
</body>
</html>
