const node = (tag, text = '', className = '') => { const item = document.createElement(tag); item.textContent = text; item.className = className; return item; };
const scopes = { personal: '個人', workspace: 'ワークスペース', organization: '組織' };
const states = { pending: '接続確認待ち', ready: '接続済み', confirmation_required: '確認待ち', succeeded: '完了', rejected: '実行せず終了', unknown_effect: '結果の確認が必要', running: '処理中', expired: '確認期限切れ' };
const busy = (control, text) => { const previous = control.textContent; control.disabled = true; control.textContent = text; return () => { control.disabled = false; control.textContent = previous; }; };
const button = (text, fn, className = 'fi-button fi-button-secondary') => { const item = node('button', text, className); item.type = 'button'; item.onclick = fn; return item; };
const field = (caption, control) => { const label = node('label', '', 'fi-form-field'); label.append(node('span', caption, 'fi-form-label'), control); return label; };
const modesFor = container => Object.fromEntries([...container.querySelectorAll('select')].map(select => [select.name, select.value]));
const acknowledgment = () => { const label = node('label', '', 'fi-permission-acknowledgement'); const input = node('input'); input.type = 'checkbox'; input.name = 'acknowledge_automatic'; label.append(input, node('span', '継続して許可する更新は、毎回の確認なしで実行されることを確認しました。')); return label; };

export function mountManagement(root, { request, Client, showAction, datetime, renderToolGroups }) {
    const api = new Client(root.dataset.base); let state, issuedConnectionId;
    const notice = (message, tone = 'error') => { const item = root.querySelector('[data-notice]'); item.textContent = message; item.dataset.tone = tone; item.hidden = false; };
    const clearPairing = () => { root.querySelector('[data-code]').value = ''; root.querySelector('[data-application-url]').value = ''; root.querySelector('[data-pairing]').hidden = true; issuedConnectionId = null; };
    const pairing = result => { issuedConnectionId = result.id; root.querySelector('[data-code]').value = result.code; root.querySelector('[data-application-url]').value = result.application_url; root.querySelector('[data-pairing]').hidden = false; root.querySelector('[data-pairing]').scrollIntoView({ block: 'nearest' }); };
    const pill = value => { const item = node('span', states[value] || '状態を確認してください', 'fi-pill'); item.dataset.tone = ['ready', 'succeeded'].includes(value) ? 'success' : ['pending', 'confirmation_required', 'unknown_effect', 'running'].includes(value) ? 'warning' : 'neutral'; return item; };
    async function refresh() {
        state = await request(root.dataset.api); api.timezone = state.timezone;
        if (issuedConnectionId && !state.connections.some(item => item.id === issuedConnectionId && item.state === 'pending')) clearPairing();
        const connections = root.querySelector('[data-connections]'); connections.replaceChildren();
        for (const connection of state.connections.filter(item => item.state !== 'revoked')) {
            const row = node('section', '', 'fi-connection-card'); const body = node('div', '', 'fi-record-body');
            body.append(node('h3', connection.name, 'fi-record-title'), node('p', `${connection.state === 'pending' ? 'Fourmix Intelligenceでの接続待ち' : scopes[connection.scope] || '接続範囲を確認'} · ${connection.host_mode === 'system' ? 'システム権限' : '本人のアカウント権限'}`, 'fi-record-meta')); row.append(body, pill(connection.state));
            const settings = node('details', '', 'fi:basis-full fi:space-y-4'); settings.append(node('summary', '接続名と権限を変更', 'fi:cursor-pointer fi:text-sm'));
            const nameForm = node('form', '', 'fi:space-y-3'); const nameInput = node('input', '', 'fi-field'); nameInput.required = true; nameInput.maxLength = 100; nameInput.value = connection.name;
            const rename = node('button', '接続名を保存', 'fi-button fi-button-secondary'); rename.type = 'submit'; nameForm.append(field('接続名', nameInput), rename);
            nameForm.onsubmit = async event => { event.preventDefault(); const restore = busy(rename, '保存しています…'); try { await api.call(`connections/${encodeURIComponent(connection.id)}`, { method: 'PATCH', body: { name: nameInput.value } }); await refresh(); notice('接続名を変更しました。', 'success'); } catch (error) { notice(error.message); } finally { restore(); } };
            const permissionForm = node('form', '', 'fi:space-y-4'); const tools = node('div'); renderToolGroups(tools, state.tools, { labels: state.domain_labels, permissions: connection.permissions || {} });
            const ack = acknowledgment(); const save = node('button', '権限を保存して接続キーを再発行', 'fi-button'); save.type = 'submit';
            permissionForm.append(node('p', 'この接続に許可する業務を設定します。変更すると現在の接続とAI設定を解除し、新しいキーで接続を確認します。', 'fi-form-help'), tools, ack, save);
            permissionForm.onsubmit = async event => { event.preventDefault(); const restore = busy(save, '接続キーを再発行しています…'); try { const result = await api.call(`connections/${encodeURIComponent(connection.id)}/permissions`, { method: 'PUT', body: { modes: modesFor(tools), acknowledge_automatic: ack.querySelector('input').checked } }); pairing(result); await refresh(); notice('権限を保存しました。新しいキーで接続を確認し、各チャットのAIを設定し直してください。', 'success'); } catch (error) { notice(error.message); } finally { restore(); } };
            settings.append(nameForm, permissionForm); row.append(settings);
            row.append(button(connection.state === 'pending' ? '接続をキャンセル' : '接続を削除', async event => { const restore = busy(event.currentTarget, '削除しています…'); try { await api.call(`connections/${encodeURIComponent(connection.id)}`, { method: 'DELETE' }); if (issuedConnectionId === connection.id) clearPairing(); await refresh(); notice('接続を削除しました。', 'success'); } catch (error) { notice(error.message); } finally { restore(); } }, 'fi-button fi-button-danger')); connections.append(row);
        }
        if (!connections.childElementCount) connections.append(node('p', '現在の接続はありません。新しい接続を作成してください。', 'fi-empty-state'));
        renderToolGroups(root.querySelector('[data-new-tools]'), state.tools, { labels: state.domain_labels, permissions: {} });
        root.querySelector('[data-connection-form] button[type=submit]').disabled = false;
        const surfaces = root.querySelector('[data-surfaces]'); surfaces.replaceChildren(); const grantCache = new Map();
        for (const surface of state.surfaces || []) {
            const card = node('section', '', 'fi-card fi:space-y-4'); const title = surface.type === 'page' ? 'チャットページ' : 'フローティングチャット';
            card.append(node('h3', surface.title || title, 'fi-record-title'), node('p', `${title} · ${surface.configured ? surface.agent_name : 'AI未設定'}`, 'fi-record-meta'));
            const form = node('form', '', 'fi-form-grid'); form.dataset.surface = surface.name;
            const enabled = node('input'); enabled.type = 'checkbox'; enabled.checked = surface.enabled; const enabledLabel = node('label', '', 'fi:flex fi:items-center fi:gap-2 fi:sm:col-span-2'); enabledLabel.append(enabled, node('span', 'このチャットを表示する'));
            const connectionSelect = node('select', '', 'fi-field'); const empty = node('option', '接続を選択してください'); empty.value = ''; connectionSelect.append(empty);
            for (const connection of state.connections.filter(item => item.state === 'ready')) { const option = node('option', connection.name); option.value = connection.id; connectionSelect.append(option); }
            connectionSelect.value = surface.connection_id || ''; const grantSelect = node('select', '', 'fi-field'); const summary = node('p', '', 'fi-form-help fi:sm:col-span-2'); summary.setAttribute('role', 'status');
            const submit = node('button', 'このチャットの設定を保存', 'fi-button'); submit.type = 'submit'; let grants = [], generation = 0, selectionChanged = false;
            const controls = () => { submit.disabled = enabled.checked && selectionChanged && !(connectionSelect.value && grantSelect.value && grants.some(item => item.grant_id === grantSelect.value && (item.audience || 'internal') === 'internal')); };
            const capability = () => { const grant = grants.find(item => item.grant_id === grantSelect.value); summary.textContent = grant ? `Fourmix Intelligenceの利用範囲：${scopes[grant.scope] || '未確認'} · 資料庫 ${(grant.dataset_ids || []).length}件 · 外部サービス ${(grant.capability_ids || []).length}件。能力はFourmix Intelligenceで管理します。` : 'この接続に利用を許可したAIがありません。Fourmix IntelligenceでAIの利用許可を確認してください。'; controls(); };
            const load = async () => {
                const current = ++generation; const connectionId = connectionSelect.value; grants = []; grantSelect.replaceChildren(); grantSelect.disabled = true; submit.disabled = true;
                const placeholder = node('option', connectionId ? 'AIを読み込んでいます…' : '接続を選択してください'); placeholder.value = ''; grantSelect.append(placeholder); summary.textContent = '接続と、このチャットで使うAIを設定してください。';
                controls(); if (!connectionId) { return; }
                try { if (!grantCache.has(connectionId)) grantCache.set(connectionId, api.agents(connectionId)); const result = await grantCache.get(connectionId); if (generation !== current || !form.isConnected) return;
                    grants = result.agents || []; grantSelect.replaceChildren(); for (const grant of grants) { const customer = (grant.audience || 'internal') !== 'internal'; const option = node('option', `${grant.name || 'AIアシスタント'}${customer ? '（対外向け・開発者API専用）' : ''}`); option.value = grant.grant_id; option.disabled = customer; grantSelect.append(option); }
                    if (!grants.length) { const option = node('option', '利用できるAIがありません'); option.value = ''; grantSelect.append(option); }
                    if (connectionId === surface.connection_id && grants.some(item => item.grant_id === surface.grant_id)) grantSelect.value = surface.grant_id;
                    const internal = grants.filter(item => (item.audience || 'internal') === 'internal'); grantSelect.disabled = !internal.length; if (!internal.some(item => item.grant_id === grantSelect.value)) grantSelect.value = internal[0]?.grant_id || ''; capability();
                    if (grants.length && !internal.length) summary.textContent = '対外向けAIには顧客の識別が必要です。標準チャットには社内向けAIを設定してください。';
                } catch (error) { if (generation !== current || !form.isConnected) return; grantCache.delete(connectionId); grantSelect.replaceChildren(); const option = node('option', 'AIの一覧を取得できませんでした'); option.value = ''; grantSelect.append(option); grantSelect.disabled = true; summary.textContent = error.message; controls(); }
            };
            connectionSelect.onchange = () => { selectionChanged = true; return load(); }; grantSelect.onchange = () => { selectionChanged = true; capability(); }; enabled.onchange = controls;
            form.append(enabledLabel, field('接続', connectionSelect), field('使用するAI', grantSelect), summary, submit); card.append(form); surfaces.append(card); load();
            form.onsubmit = async event => { event.preventDefault(); const restore = busy(submit, '保存しています…'); try { const configuration = { enabled: enabled.checked, ...(enabled.checked && selectionChanged && connectionSelect.value && grantSelect.value ? { connection_id: connectionSelect.value, grant_id: grantSelect.value } : {}) }; const result = await api.surface(surface.name, configuration); window.dispatchEvent(new window.CustomEvent('fourmix:surfaces', { detail: result.surfaces })); await refresh(); notice('このチャットの接続・AI・表示設定を保存しました。', 'success'); } catch (error) { notice(error.message); } finally { restore(); controls(); } };
        }
        if (!(state.surfaces || []).length) surfaces.append(node('p', 'チャットUIはアプリケーションの設定で無効になっています。', 'fi-empty-state'));
        const actions = root.querySelector('[data-actions]'); actions.replaceChildren(); const toolMap = new Map((state.tools || []).map(tool => [tool.name, tool]));
        for (const action of state.actions || []) { const row = node('div', '', 'fi-history-row'); const body = node('div', '', 'fi-record-body'); body.append(node('h3', toolMap.get(action.operation)?.description?.split(/[。\n]/)[0] || action.operation, 'fi-record-title'), node('p', datetime(action.created_at, api.timezone), 'fi-record-meta')); row.append(body, pill(action.state), button(action.state === 'confirmation_required' ? '内容を確認' : '実行結果を見る', () => showAction(api, action.id, root, refresh))); actions.append(row); }
        if (!(state.actions || []).length) actions.append(node('p', '操作履歴はまだありません。', 'fi-empty-state'));
    }
    root.querySelector('[data-connection-form]').onsubmit = async event => { event.preventDefault(); const form = event.target; const restore = busy(form.querySelector('button[type=submit]'), '接続キーを作成しています…'); try { const result = await request(root.dataset.key, { method: 'POST', body: { name: form.elements.name.value, host_mode: form.elements.host_mode.value, modes: modesFor(root.querySelector('[data-new-tools]')), acknowledge_automatic: form.elements.acknowledge_automatic.checked } }); pairing(result); await refresh(); notice('接続キーを作成しました。Fourmix Intelligenceのサービス接続で、アプリケーションURLとキーを入力してください。', 'success'); } catch (error) { notice(error.message); } finally { restore(); } };
    root.querySelector('[data-refresh]').onclick = async event => { const restore = busy(event.currentTarget, '更新しています…'); try { await refresh(); notice('接続状態を更新しました。', 'success'); } catch (error) { notice(error.message); } finally { restore(); } };
    root.querySelector('[data-copy-key]').onclick = async () => { const input = root.querySelector('[data-code]'); try { if (!window.navigator?.clipboard) { input.select(); notice('キーを選択しました。コピーして使用してください。', 'success'); return; } await window.navigator.clipboard.writeText(input.value); notice('接続キーをコピーしました。', 'success'); } catch { input.select(); notice('選択したキーを手動でコピーしてください。'); } };
    refresh().catch(error => notice(error.message));
}
