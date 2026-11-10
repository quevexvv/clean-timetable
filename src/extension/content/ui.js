(() => {
  const t = browser.i18n.getMessage.bind(browser.i18n);
  const locale = t('locale');
  const plurals = new Intl.PluralRules(locale);
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
    const instructor = item.teacherIds.length && item.teacherLabel ? item.teacherLabel : t('noInstructor');
    return `${item.subject} · ${item.type} · ${instructor}`;
  }
  function hiddenLabel(count) {
    return t(`hidden_${plurals.select(count)}`, String(count));
  }
  function createPanel(table, onFull, onUnhide) {
    const panel = element('section', 'tpu-panel');
    panel.lang = locale;
    panel.setAttribute('aria-label', t('panelLabel'));
    const top = element('div', 'tpu-panel-top');
    const title = element('strong', '', t('panelTitle'));
    const count = element('span', 'tpu-count');
    count.setAttribute('role', 'status');
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');
    const toggleLabel = element('label', 'tpu-toggle');
    const toggle = element('input');
    toggle.type = 'checkbox';
    toggle.addEventListener('change', () => onFull(toggle.checked));
    toggleLabel.append(toggle, document.createTextNode(` ${t('fullTimetable')}`));
    top.append(title, count, toggleLabel);
    const status = element('p', 'tpu-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const error = element('p', 'tpu-error');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    const details = element('details', 'tpu-rules');
    const summary = element('summary');
    const list = element('ul');
    details.append(summary, list);
    panel.append(top, status, error, details);
    table.before(panel);

    const dialog = element('dialog', 'tpu-dialog');
    dialog.setAttribute('aria-labelledby', 'tpu-confirm-title');
    const heading = element('h3', '', t('confirmTitle'));
    heading.id = 'tpu-confirm-title';
    const description = element('p', 'tpu-confirm-description');
    const help = element('p', '', t('confirmHelp'));
    let confirm = () => {};
    const accept = button(t('alwaysHide'), () => { dialog.close(); confirm(); });
    const cancel = button(t('cancel'), () => dialog.close());
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
        status.textContent = t(full ? 'fullStatus' : 'filteredStatus');
        summary.textContent = t('rulesCount', String(state.rules.length));
        const active = document.activeElement;
        const focusKey = active?.dataset.tpuRule;
        list.replaceChildren();
        if (!state.rules.length) list.append(element('li', '', t('noRules')));
        for (const rule of state.rules) {
          const row = element('li', 'tpu-rule');
          const remove = button(t('disableRule'), () => onUnhide(rule));
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
