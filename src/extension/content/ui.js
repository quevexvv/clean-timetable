(() => {
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function button(text, handler) {
    const node = element('button', 'tpu-button', text);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }
  function label(item) {
    return `${item.subject} · ${item.type} · ${item.teacherLabel}`;
  }
  const plurals = new Intl.PluralRules('ru');
  function hiddenLabel(count) {
    const form = plurals.select(count);
    return form === 'one' ? `Скрыта ${count} пара` : `Скрыто ${count} ${form === 'few' ? 'пары' : 'пар'}`;
  }
  function createPanel(table, onFull, onUnhide) {
    const panel = element('section', 'tpu-panel');
    panel.setAttribute('aria-label', 'Фильтр расписания');
    const top = element('div', 'tpu-panel-top');
    const title = element('strong', '', 'Моё расписание');
    const count = element('span', 'tpu-count');
    count.setAttribute('role', 'status');
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');
    const toggleLabel = element('label', 'tpu-toggle');
    const toggle = element('input');
    toggle.type = 'checkbox';
    toggle.addEventListener('change', () => onFull(toggle.checked));
    toggleLabel.append(toggle, document.createTextNode(' Полное расписание'));
    top.append(title, count, toggleLabel);
    const status = element('p', 'tpu-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const error = element('p', 'tpu-error');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    const details = element('details', 'tpu-rules');
    const summary = element('summary', '', 'Постоянные правила');
    const list = element('ul');
    details.append(summary, list);
    panel.append(top, status, error, details);
    table.before(panel);

    const dialog = element('dialog', 'tpu-dialog');
    dialog.setAttribute('aria-labelledby', 'tpu-confirm-title');
    const heading = element('h3', '', 'Скрывать такие пары всегда?');
    heading.id = 'tpu-confirm-title';
    const description = element('p', 'tpu-confirm-description');
    const help = element('p', '', 'Будут скрыты только этот предмет, этот преподаватель и этот тип занятия на всех неделях этой группы.');
    let confirm = () => {};
    const accept = button('Скрывать всегда', () => { dialog.close(); confirm(); });
    const cancel = button('Отмена', () => dialog.close());
    dialog.append(heading, description, help, accept, cancel);
    panel.append(dialog);
    return {
      panel,
      focusToggle() { toggle.focus(); },
      confirm(item, handler) {
        description.textContent = label(item);
        confirm = handler;
        dialog.showModal();
        cancel.focus();
      },
      error(message) {
        error.textContent = message;
        error.hidden = !message;
      },
      render(state, hiddenCount, full) {
        toggle.checked = full;
        count.textContent = hiddenLabel(hiddenCount);
        status.textContent = full ? 'Показаны все пары. Отмеченные занятия скрыты в вашем расписании.' :
          'Правила сохраняются в этом браузере. Для возврата пары включите полное расписание.';
        summary.textContent = `Постоянные правила (${state.rules.length})`;
        const active = document.activeElement;
        const focusKey = active?.dataset.tpuRule;
        list.replaceChildren();
        if (!state.rules.length) list.append(element('li', '', 'Постоянных правил пока нет.'));
        for (const rule of state.rules) {
          const row = element('li', 'tpu-rule');
          const remove = button('Отключить правило', () => onUnhide(rule));
          remove.dataset.tpuRule = globalThis.TpuFilter.rules.ruleKey(rule);
          row.append(element('span', '', label(rule)), remove);
          list.append(row);
        }
        if (focusKey) {
          const target = [...list.querySelectorAll('button')].find(node => node.dataset.tpuRule === focusKey);
          (target || summary).focus();
        }
      },
    };
  }
  globalThis.TpuFilter.ui = { element, button, label, createPanel };
})();
