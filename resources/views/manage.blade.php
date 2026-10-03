@extends('fourmix-intelligence::layout')
@section('content')
<main class="fi-management fi:mx-auto fi:max-w-6xl fi:space-y-8 fi:p-5 fi:sm:p-8" data-fourmix-management data-api="{{ route('fourmix-intelligence.state') }}" data-base="{{ url(config('fourmix-intelligence.ui.prefix', 'fourmix-intelligence')) }}" data-key="{{ route('fourmix-intelligence.connections.key') }}">
    <header class="fi-page-header"><div><p class="fi-eyebrow">AIとの連携設定</p><h1 class="fi-page-title">接続とチャットの設定</h1><p class="fi-page-description">接続ごとの業務権限と、各チャットで使用するAIを設定します。</p></div></header>
    <nav class="fi-section-nav" aria-label="連携設定の項目"><a href="#fi-connections">サービス接続</a><a href="#fi-surfaces">チャットの設定</a><a href="#fi-history">操作履歴</a></nav>
    <p data-notice role="status" aria-live="polite" class="fi-notice" hidden></p>
    <section id="fi-connections" class="fi-card fi-section fi:space-y-5" aria-labelledby="fi-connections-title">
        <div class="fi-section-heading"><div><h2 id="fi-connections-title">サービス接続</h2><p class="fi-section-description">接続ごとに、このアプリでAIに許可する業務を決めます。本人の権限を超えるデータや操作は許可できません。</p></div></div>
        <div data-connections class="fi-connection-list" aria-live="polite"><p class="fi-empty-state">接続を読み込んでいます…</p></div>
        <details class="fi:space-y-5">
            <summary class="fi-button fi-button-secondary fi:cursor-pointer">新しい接続を作成</summary>
            <form data-connection-form class="fi:space-y-4">
                <label class="fi-form-field"><span class="fi-form-label">接続名</span><input name="name" type="text" required maxlength="100" placeholder="例：自分のAI、開発チーム" class="fi-field" /></label>
                @if(count(config('fourmix-intelligence.ui.host_modes', ['user'])) > 1)
                <label class="fi-form-field"><span class="fi-form-label">接続に使用する権限</span><select name="host_mode" class="fi-field">@foreach(config('fourmix-intelligence.ui.host_modes', ['user']) as $mode)<option value="{{ $mode }}">{{ $mode === 'system' ? 'アプリの管理権限' : '自分のアカウント権限' }}</option>@endforeach</select></label>
                @else
                <input type="hidden" name="host_mode" value="{{ config('fourmix-intelligence.ui.host_modes', ['user'])[0] ?? 'user' }}" />
                @endif
                <h3 class="fi:font-semibold">この接続に許可する業務</h3>
                <p class="fi-form-help">参照は「参照を許可」、登録・変更は「毎回内容を確認」を選択できます。許可しない業務は無効のままにしてください。</p>
                <div data-new-tools class="fi:space-y-3"></div>
                <label class="fi-permission-acknowledgement fi:flex fi:items-start fi:gap-3 fi:text-sm"><input type="checkbox" name="acknowledge_automatic" /><span>継続して許可する更新は、毎回の確認なしで実行されることを確認しました。</span></label>
                <button class="fi-button" type="submit" disabled>権限を保存して接続キーを作成</button>
            </form>
        </details>
        <div data-pairing class="fi-pairing fi:space-y-4 fi:rounded-xl fi:bg-raised fi:p-5" hidden>
            <h3 class="fi:font-semibold">Fourmix Intelligenceに次の2項目を入力してください</h3>
            <label class="fi-form-field"><span class="fi-form-label">このアプリのURL</span><input data-application-url readonly class="fi-field" /></label>
            <label class="fi-form-field"><span class="fi-form-label">接続キー</span><input data-code readonly autocomplete="off" class="fi-field fi:font-mono" /></label>
            <p class="fi-form-help">キーは10分間、一度だけ使用できます。個人・組織・ワークスペースの接続範囲は、Fourmix Intelligenceで接続するときに選択します。</p>
            <div class="fi-form-actions"><button data-copy-key type="button" class="fi-button fi-button-secondary">接続キーをコピー</button><button data-refresh type="button" class="fi-button fi-button-quiet">接続状態を更新</button></div>
        </div>
    </section>
    <section id="fi-surfaces" class="fi-section fi:space-y-5" aria-labelledby="fi-surfaces-title">
        <div class="fi-section-heading"><div><h2 id="fi-surfaces-title">チャットの設定</h2><p class="fi-section-description">ページとフローティングチャットは、それぞれ表示を切り替え、別の接続・AIを設定できます。利用中のチャットではAIを変更しません。</p></div></div>
        <div data-surfaces class="fi:grid fi:gap-5 fi:lg:grid-cols-2" aria-live="polite"><p class="fi-empty-state">チャットの設定を読み込んでいます…</p></div>
    </section>
    <section id="fi-history" class="fi-card fi-section fi:space-y-5" aria-labelledby="fi-history-title">
        <div class="fi-section-heading"><div><h2 id="fi-history-title">操作履歴と確認待ち</h2><p class="fi-section-description">AIが依頼した業務の内容と、実行後の結果を確認できます。</p></div></div>
        <div data-actions class="fi-history-list" aria-live="polite"><p class="fi-empty-state">操作履歴を読み込んでいます…</p></div>
    </section>
</main>
@endsection
