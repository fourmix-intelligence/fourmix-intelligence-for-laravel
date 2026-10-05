import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const baseState = {
    timezone: 'Asia/Tokyo', domain_labels: { records: '登録情報' },
    connections: [{ id: 'connection-a', name: '業務用', scope: 'workspace', state: 'ready', host_mode: 'user', permissions: { 'records.lookup': 'automatic', 'records.save': 'review' } }],
    agents: [{ alias: 'ui-page', name: '確認AI', connection_id: 'connection-a', grant_id: 'grant-a' }],
    surfaces: [{ name: 'page', type: 'page', title: 'ページ用アシスタント', enabled: true, configured: true, alias: 'ui-page', agent_name: '確認AI', connection_id: 'connection-a', grant_id: 'grant-a' },
        { name: 'floating', type: 'floating', title: '側窓用アシスタント', enabled: true, configured: false, alias: 'ui-floating' }],
    tools: [{ name: 'records.lookup', description: '登録情報を確認します。対象を指定してください。', domain: 'records', read_only: true }, { name: 'records.save', description: '登録情報を更新します。内容を確認してください。', domain: 'records', read_only: false }],
    actions: [{ id: 'action-a', operation: 'records.lookup', state: 'confirmation_required', created_at: '2026-10-02T10:00:00+09:00' }],
};
async function fixture(state = baseState, { agents, handle } = {}) {
    const blade = await readFile(new URL('../../resources/views/manage.blade.php', import.meta.url), 'utf8');
    const html = blade.replace(/@if\(count\(config[\s\S]*?@else/g, '').replace(/@endif/g, '')
        .replace(/\{\{\s*route\('fourmix-intelligence\.([^']+)'\)\s*\}\}/g, (_, name) => ({ state: '/fourmix-intelligence/state', 'connections.key': '/fourmix-intelligence/connections/key' }[name]))
        .replace(/\{\{\s*url\(config[^}]+\}\}/g, '/fourmix-intelligence');
    const dom = new JSDOM(html, { url: 'https://app.example.test' }); dom.window.HTMLElement.prototype.scrollIntoView = function () {};
    const context = vm.createContext({ document: dom.window.document, window: dom.window });
    const groups = new vm.SourceTextModule(await readFile(new URL('../../resources/js/tool-groups.js', import.meta.url), 'utf8'), { context }); await groups.link(() => {}); await groups.evaluate();
    const module = new vm.SourceTextModule(await readFile(new URL('../../resources/js/management.js', import.meta.url), 'utf8'), { context }); await module.link(() => {}); await module.evaluate();
    const calls = [], agentCalls = [];
    const request = async (url, options = {}) => { calls.push({ url, ...options }); if (handle) { const custom = handle(url, options); if (custom !== undefined) return custom; } return state; };
    class Client {
        async agents(connection) { agentCalls.push(connection); return agents ? agents(connection) : { agents: [{ grant_id: 'grant-a', name: '確認AI', scope: 'workspace', dataset_ids: ['one'], capability_ids: ['two'] }] }; }
        call(path, options) { return request('/fourmix-intelligence/' + path, options); }
        surface(name, body) { return this.call('surfaces/' + name, { method: 'PUT', body }); }
    }
    const root = dom.window.document.querySelector('[data-fourmix-management]'); module.namespace.mountManagement(root, { request, Client, showAction: async () => {}, datetime: () => '2026/10/03 12:00', renderToolGroups: groups.namespace.renderToolGroups }); await tick(); await tick();
    return { root, dom, calls, agentCalls, state, refresh: () => root.querySelector('[data-refresh]').onclick({ currentTarget: root.querySelector('[data-refresh]') }) };
}
const submit = form => form.onsubmit({ preventDefault() {}, target: form });

test('接続と操作名は安全に表示し、内部aliasや旧全体権限の編集を出さない', async () => {
    const state = { ...baseState, connections: [{ ...baseState.connections[0], name: '<img src=x>' }], tools: [{ ...baseState.tools[0], description: '<script>対象を確認</script>' }] };
    const { root } = await fixture(state);
    assert.equal(root.querySelector('[data-connections] h3').textContent, '<img src=x>');
    assert.equal(root.querySelectorAll('img,script').length, 0); assert.equal(root.textContent.includes('ui-page'), false);
    assert.equal(root.querySelector('[data-permission-form]'), null); assert.equal(root.querySelector('[data-agent-tools]'), null);
    assert.match(root.querySelector('[data-actions]').textContent, /対象を確認/);
});

test('接続が未設定でもページと側窓をそれぞれ無効にでき、AIの一覧を無駄に取得しない', async () => {
    const { root, agentCalls, calls } = await fixture({ ...baseState, connections: [], agents: [], actions: [] });
    assert.deepEqual(agentCalls, []); assert.match(root.querySelector('[data-connections]').textContent, /新しい接続/);
    const forms = [...root.querySelectorAll('[data-surface]')]; assert.equal(forms.length, 2);
    for (const form of forms) { assert.equal(form.querySelector('button').disabled, false); const enable = form.querySelector('input[type=checkbox]'); enable.checked = false; enable.onchange(); assert.equal(form.querySelector('button').disabled, false); }
    await submit(forms[0]); assert.equal(calls.find(call => call.url.endsWith('/surfaces/page')).body.enabled, false);
});

test('解除済みと確認待ちの接続はAI選択に出さず、同じ接続のAI一覧を一度だけ取得する', async () => {
    const state = { ...baseState, connections: [...baseState.connections, { ...baseState.connections[0], id: 'old', name: '解除済み', state: 'revoked' }, { ...baseState.connections[0], id: 'pending', name: '確認待ち', state: 'pending' }],
        surfaces: baseState.surfaces.map(surface => ({ ...surface, connection_id: 'connection-a', grant_id: 'grant-a', configured: true })) };
    const { root, agentCalls } = await fixture(state);
    assert.equal(root.querySelector('[data-connections]').textContent.includes('解除済み'), false);
    for (const form of root.querySelectorAll('[data-surface]')) assert.deepEqual([...form.querySelector('select').options].map(option => option.value), ['', 'connection-a']);
    assert.deepEqual(agentCalls, ['connection-a']);
});

test('接続キーは選択した業務権限と明示した継続許可を保存して作成する', async () => {
    const state = structuredClone(baseState); const { root, calls } = await fixture(state, { handle: (url, options) => url.endsWith('/connections/key') && options.method === 'POST' ? (() => { state.connections.push({ id: 'created', name: '新規', state: 'pending' }); return { id: 'created', code: 'synthetic-key', application_url: 'https://app.example.test' }; })() : undefined });
    const form = root.querySelector('[data-connection-form]'); form.elements.name.value = '新規';
    root.querySelector('[data-new-tools] select[name="records.lookup"]').value = 'review'; root.querySelector('[data-new-tools] select[name="records.save"]').value = 'review';
    form.elements.acknowledge_automatic.checked = true; await submit(form);
    const body = calls.find(call => call.url.endsWith('/connections/key')).body; assert.equal(body.name, '新規'); assert.equal(body.modes['records.lookup'], 'review'); assert.equal(body.modes['records.save'], 'review'); assert.equal(body.acknowledge_automatic, true);
    assert.equal(root.querySelector('[data-code]').value, 'synthetic-key'); assert.equal(root.querySelector('[data-pairing]').hidden, false);
});

test('接続ごとの権限変更は再発行のAPIへ送り、AI再設定の案内を出す', async () => {
    const state = structuredClone(baseState); const { root, calls } = await fixture(state, { handle: (url, options) => url.endsWith('/permissions') && options.method === 'PUT' ? (() => { state.connections[0].state = 'pending'; state.surfaces = state.surfaces.map(item => ({ ...item, configured: false, connection_id: null, grant_id: null })); return { id: 'connection-a', code: 'renewed-key', application_url: 'https://app.example.test' }; })() : undefined });
    const form = root.querySelectorAll('[data-connections] form')[1]; form.querySelector('select[name="records.save"]').value = 'automatic'; form.querySelector('input[name="acknowledge_automatic"]').checked = true; await submit(form);
    const saved = calls.find(call => call.url.endsWith('/connections/connection-a/permissions')); assert.equal(saved.method, 'PUT'); assert.equal(saved.body.modes['records.save'], 'automatic'); assert.equal(saved.body.acknowledge_automatic, true);
    assert.equal(root.querySelector('[data-code]').value, 'renewed-key'); assert.match(root.querySelector('[data-notice]').textContent, /設定し直して/);
});

test('ページと側窓のAI保存は独立したsurface宛てで、追加業務範囲を送信しない', async () => {
    const { root, calls } = await fixture(); const forms = [...root.querySelectorAll('[data-surface]')];
    forms[1].querySelector('select').value = 'connection-a'; await forms[1].querySelector('select').onchange(); await submit(forms[1]);
    const saved = calls.find(call => call.url.endsWith('/surfaces/floating')); assert.equal(saved.body.connection_id, 'connection-a'); assert.equal(saved.body.grant_id, 'grant-a'); assert.equal(saved.body.enabled, true); assert.equal('allowed_operations' in saved.body, false);
    assert.equal(calls.some(call => call.url.endsWith('/surfaces/page')), false);
});

test('遅れたAI一覧は別接続へ変更済みのカードを上書きしない', async () => {
    const slow = deferred(); const state = { ...baseState, connections: [...baseState.connections, { ...baseState.connections[0], id: 'connection-b', name: '別接続' }] };
    const { root } = await fixture(state, { agents: connection => connection === 'connection-a' ? slow.promise : { agents: [{ grant_id: 'grant-b', name: '別AI', scope: 'personal' }] } });
    const form = root.querySelector('[data-surface="page"]'); const select = form.querySelector('select'); select.value = 'connection-b'; await select.onchange();
    slow.resolve({ agents: [{ grant_id: 'grant-a', name: '旧AI' }] }); await tick(); await tick();
    assert.equal(form.querySelectorAll('select')[1].value, 'grant-b'); assert.equal(form.textContent.includes('旧AI'), false);
});

test('対外向けAIの能力は変更せず標準UIでの選択を禁止し、理由を案内する', async () => {
    const { root } = await fixture(baseState, { agents: () => ({ agents: [{ grant_id: 'customer-ai', name: 'お客様窓口', audience: 'customer', scope: 'personal' }] }) });
    const form = root.querySelector('[data-surface="page"]'); const select = form.querySelectorAll('select')[1];
    assert.equal(select.options[0].disabled, true); assert.match(select.options[0].textContent, /対外向け/); assert.match(form.textContent, /顧客の識別/);
    await form.querySelector('select').onchange(); assert.equal(form.querySelector('button').disabled, true);
});

test('AI未設定でも非表示の入口を表示へ戻せ、未指定の接続を勝手に保存しない', async () => {
    const state = { ...baseState, connections: [], agents: [], surfaces: baseState.surfaces.map(item => ({ ...item, enabled: false, configured: false, connection_id: null, grant_id: null })) };
    const { root, calls } = await fixture(state); const form = root.querySelector('[data-surface="floating"]');
    const enable = form.querySelector('input[type=checkbox]'); enable.checked = true; enable.onchange();
    assert.equal(form.querySelector('button').disabled, false); await submit(form);
    const saved = calls.find(call => call.url.endsWith('/surfaces/floating')).body;
    assert.equal(saved.enabled, true); assert.deepEqual(Object.keys(saved), ['enabled']);
});

test('AIの資料庫と外部サービスは能力の読み取り専用案内に表示する', async () => {
    const { root } = await fixture(); const form = root.querySelector('[data-surface="page"]'); assert.match(form.textContent, /資料庫 1件/); assert.match(form.textContent, /外部サービス 1件/); assert.equal(form.querySelector('input[name="audience"]'), null);
});

test('保存に失敗した場合は日本語で案内し、選択内容を残して再操作できる', async () => {
    const { root } = await fixture(baseState, { handle: (url, options) => url.endsWith('/surfaces/page') && options.method === 'PUT' ? Promise.reject(new Error('接続を確認してください。')) : undefined });
    const form = root.querySelector('[data-surface="page"]'); await submit(form); assert.match(root.querySelector('[data-notice]').textContent, /接続を確認/); assert.equal(form.querySelector('button').disabled, false); assert.equal(form.querySelector('select').value, 'connection-a');
});

test('AIが未許可の場合は空の状態を表示し、読み込み中や通信エラーとして扱わない', async () => {
    const state = structuredClone(baseState); state.surfaces[0].configured = false;
    const { root } = await fixture(state, { agents: async () => ({ agents: [] }) });
    const form = root.querySelector('[data-surface="page"]');
    assert.match(form.textContent, /利用できるAIがありません/);
    assert.doesNotMatch(form.textContent, /読み込んでいます|取得できませんでした/);
    assert.equal(form.querySelectorAll('select')[1].disabled, true);
});

test('AI一覧の通信失敗を空一覧と区別し、読み込み中の表示を残さず再取得できる', async () => {
    let failed = true;
    const state = structuredClone(baseState); state.surfaces[0].configured = false;
    const { root, agentCalls } = await fixture(state, { agents: async () => {
        if (failed) throw new Error('接続の認証を確認できませんでした。');
        return { agents: [{ grant_id: 'grant-a', name: '確認AI', audience: 'internal' }] };
    } });
    const form = root.querySelector('[data-surface="page"]');
    assert.match(form.textContent, /AIの一覧を取得できませんでした/);
    assert.match(form.textContent, /接続の認証/);
    assert.doesNotMatch(form.textContent, /読み込んでいます|利用できるAIがありません/);
    assert.equal(form.querySelectorAll('select')[1].disabled, true);
    failed = false;
    await form.querySelector('select').onchange();
    assert.equal(agentCalls.length, 2);
    assert.equal(form.querySelectorAll('select')[1].value, 'grant-a');
    assert.equal(form.querySelector('button').disabled, false);
});
