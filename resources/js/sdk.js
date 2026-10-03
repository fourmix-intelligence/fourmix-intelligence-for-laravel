import '../css/sdk.css';
import './floating.js';
import { FourmixIntelligenceUI, showAction, datetime } from './chat.js';
import { renderToolGroups } from './tool-groups.js';
import { mountManagement } from './management.js';
import { readStream } from './stream.js';

export async function request(url, { method = 'GET', body, signal, csrfToken, onEvent } = {}) {
    const csrf = csrfToken ?? document.querySelector('meta[name="csrf-token"]')?.content;
    const xsrf = document.cookie.split('; ').find(item => item.startsWith('XSRF-TOKEN='))?.slice(11);
    let response;
    try {
        const multipart = body instanceof FormData;
        response = await fetch(url, { method, signal, credentials: 'same-origin', headers: { Accept: onEvent ? 'application/x-ndjson' : 'application/json', ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-TOKEN': csrf } : xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}) }, ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}) });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('通信できませんでした。接続を確認してから、AIと履歴を再読み込みしてください。');
    }
    if (response.ok && onEvent && response.headers.get('Content-Type')?.includes('application/x-ndjson')) return readStream(response, onEvent);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        const fallback = '処理を完了できませんでした。接続と利用許可を確認してください。';
        const messages = {
            'server error': fallback,
            forbidden: 'この操作の利用許可がありません。接続と権限を確認してください。',
            'not found': '対象が見つかりません。接続とAIの設定を確認してください。',
            unauthenticated: 'ログインの有効期限が切れました。再ログインしてください。',
            'too many requests': '依頼が集中しています。少し待ってから再度操作してください。',
        };
        const message = typeof result.message === 'string' ? result.message.trim() : '';
        const japanese = value => typeof value === 'string' && /[\u3040-\u30ff\u3400-\u9fff]/u.test(value);
        const validation = response.status === 422 && result.errors && typeof result.errors === 'object' ? Object.values(result.errors).flat().find(japanese) : null;
        const resolved = response.status >= 500 ? fallback : japanese(message) ? message : validation || messages[message.toLocaleLowerCase().replace(/[.!]$/, '')]
            || (response.status === 419 ? '画面の有効期限が切れました。再読み込みしてください。' : fallback);
        const failure = new Error(resolved); failure.status = response.status;
        if (response.status === 409 && typeof result.conversation_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.conversation_id)) {
            failure.data = { conversation_id: result.conversation_id, state: 'unknown' };
        }
        throw failure;
    }
    return result;
}
for (const root of document.querySelectorAll('[data-fourmix-management]')) mountManagement(root, { request, Client: FourmixIntelligenceUI, showAction, datetime, renderToolGroups });
