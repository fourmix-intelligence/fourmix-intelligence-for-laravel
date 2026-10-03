const create = (tag, text = '', className = '') => { const element = document.createElement(tag); element.textContent = text; element.className = className; return element; };

/** The host supplies business labels; the SDK never knows the application's domains. */
export function renderToolGroups(container, tools, { labels = {}, permissions = {}, mode = 'permissions' } = {}) {
    container.replaceChildren();
    if (!tools.length) { container.append(create('p', '利用できる業務操作はありません。アプリケーションの管理者に確認してください。', 'fi-empty-state')); return; }
    const searchLabel = create('label', '', 'fi-tool-search fi-form-field'); searchLabel.append(create('span', '業務操作を検索', 'fi-form-label'));
    const search = create('input', '', 'fi-field'); search.type = 'search'; search.placeholder = '業務名・操作名で絞り込み'; searchLabel.append(search); container.append(searchLabel);
    const empty = create('p', '条件に一致する操作はありません。検索語を変えてください。', 'fi-empty-state'); empty.hidden = true;
    const domains = new Map();
    for (const tool of tools) { const domain = tool.domain || 'general'; if (!domains.has(domain)) domains.set(domain, []); domains.get(domain).push(tool); }
    for (const [domain, items] of domains) {
        const details = create('details', '', 'fi-tool-group');
        const title = labels[domain] || items[0].keywords?.[0] || (domain === 'general' ? 'その他の業務' : domain);
        const summary = create('summary', '', 'fi-tool-summary'); summary.append(create('span', title, 'fi-tool-summary-title'));
        const count = create('span', '', 'fi-tool-summary-count'); summary.append(count); details.append(summary);
        const content = create('div', '', 'fi-tool-content fi:space-y-3');
        const update = () => {
            const fields = [...details.querySelectorAll('[data-tool-row] input, [data-tool-row] select')];
            const selected = fields.filter(field => mode === 'permissions' ? field.value !== 'disabled' : field.checked).length;
            count.textContent = `${items.length}件 · ${mode === 'permissions' ? '許可' : '選択'} ${selected}件`;
        };
        const choices = create('div', '', 'fi-tool-bulk-actions fi:flex fi:flex-wrap fi:gap-2');
        const bulk = (text, kind, value) => { const button = create('button', text, 'fi-button fi-button-quiet'); button.type = 'button'; button.onclick = () => {
            for (const row of details.querySelectorAll('[data-tool-row]')) if (!row.hidden && (kind === 'all' || (row.dataset.readOnly === 'true') === (kind === 'read'))) {
                const field = row.querySelector('input, select'); if (mode === 'permissions') field.value = value; else field.checked = value;
            }
            update();
        }; choices.append(button); };
        if (mode === 'permissions') { bulk('参照を許可', 'read', 'review'); bulk('更新は毎回確認', 'write', 'review'); bulk('すべて許可しない', 'all', 'disabled'); }
        else { bulk('参照を選択', 'read', true); bulk('更新を選択', 'write', true); bulk('選択を解除', 'all', false); }
        content.append(choices);
        for (const tool of items) {
            const row = create('label', '', `fi-tool-row${mode === 'selection' ? ' fi-tool-selection' : ''}`);
            row.dataset.toolRow = ''; row.dataset.readOnly = String(tool.read_only); row.dataset.search = [tool.name, tool.description, title, ...(tool.keywords || [])].join(' ').toLocaleLowerCase();
            const text = tool.description || tool.name; const titleText = text.split(/[。\n]/)[0]; const caption = create('span', '', 'fi-tool-caption fi:min-w-0 fi:break-words'); caption.title = text;
            caption.append(create('span', titleText.length > 90 ? `${titleText.slice(0, 90)}…` : titleText, 'fi-tool-title'));
            const effect = create('span', tool.read_only ? '参照' : '更新', 'fi-pill'); effect.dataset.effect = tool.read_only ? 'read' : 'write'; caption.append(effect);
            if (mode === 'permissions') {
                const select = create('select', '', 'fi-field fi-tool-control fi:shrink-0'); select.name = tool.name;
                for (const [value, label] of [['disabled', '許可しない'], ['review', tool.read_only ? '参照を許可' : '毎回内容を確認'], ...(!tool.read_only ? [['automatic', '継続して許可']] : [])]) { const option = create('option', label); option.value = value; select.append(option); }
                select.value = tool.read_only && permissions[tool.name] === 'automatic' ? 'review' : permissions[tool.name] || 'disabled'; select.onchange = update; row.append(caption, select);
            } else {
                const checkbox = create('input'); checkbox.type = 'checkbox'; checkbox.name = 'allowed_operations'; checkbox.value = tool.name; checkbox.onchange = update; row.append(checkbox, caption);
            }
            content.append(row);
        }
        details.append(content); container.append(details); update();
    }
    container.append(empty);
    search.oninput = () => { const query = search.value.trim().toLocaleLowerCase(); let matched = 0;
        for (const details of container.querySelectorAll('details')) { let found = 0;
            for (const row of details.querySelectorAll('[data-tool-row]')) { row.hidden = !row.dataset.search.includes(query); if (!row.hidden) found++; }
            details.hidden = !found; matched += found; if (query && found) details.open = true; else if (!query) details.open = false;
        }
        empty.hidden = matched !== 0;
    };
}
