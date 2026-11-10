(() => {
  const group = /^\/gruppa_(\d+)\/(?:\d+\/\d+\/)?view\.html$/.exec(location.pathname)?.[1];
  if (!group || globalThis.TpuFilter.started) return;
  globalThis.TpuFilter.started = true;
  const { rules, parser, ui } = globalThis.TpuFilter;
  let state = rules.emptyState();
  let full = false;
  let busy = false;
  let ready = false;
  let panel;
  let table;
  let records = [];
  let refreshVersion = 0;
  async function request(message) {
    const response = await browser.runtime.sendMessage(message);
    if (!response || response.error) throw new Error(response?.error || 'Фоновый обработчик недоступен.');
    return rules.validateState(response.state);
  }
  async function refresh() {
    const version = ++refreshVersion;
    try {
      const next = await request({ kind: 'tpu:get' });
      if (version !== refreshVersion) return;
      state = next;
      ready = true;
      panel?.error('');
      render();
    } catch (error) {
      ready = false;
      panel?.error(`Не удалось прочитать правила. ${error.message} Обновите страницу для повтора.`);
      render();
    }
  }
  async function act(action, item) {
    if (busy || !ready) return;
    const origin = records.find(record => record.entries.some(entry => entry.lesson === item));
    let saved = false;
    busy = true;
    render();
    try {
      state = await request({ kind: 'tpu:update', action, lesson: item });
      panel.error('');
      saved = true;
      for (const entry of origin?.entries || []) {
        if (entry.controls) entry.controls.bar.open = false;
      }
    } catch (error) {
      panel.error(`Изменение не сохранено. ${error.message}`);
    } finally {
      busy = false;
      render();
      if (saved && origin) {
        const target = origin.entries.find(entry => entry.lesson === item && !entry.wrapper.hidden) ||
          origin.entries.find(entry => entry.controls && !entry.wrapper.hidden);
        if (target?.wrapper.isConnected) {
          const control = target.controls.bar.hidden ? target.controls.restore : target.controls.bar.querySelector('summary');
          control.focus();
        } else panel.focusToggle();
      }
    }
  }
  function controls(item, wrapper) {
    const bar = ui.element('details', 'tpu-actions');
    const summary = ui.element('summary', '', 'Настроить');
    summary.setAttribute('aria-label', `Настроить пару: ${ui.label(item)}`);
    const buttons = ui.element('div', 'tpu-action-buttons');
    const hide = ui.button('Скрывать всегда', () => panel.confirm(item, () => act('hide', item)));
    hide.title = `Только ${ui.label(item)}`;
    const skip = ui.button('Пропустить пару', () => act('skip', item));
    const restore = ui.button('Вернуть эту пару', () => act('restore', item));
    restore.classList.add('tpu-restore');
    const badge = ui.element('span', 'tpu-badge');
    buttons.append(hide, skip);
    bar.append(summary, buttons);
    wrapper.append(badge, bar, restore);
    return { bar, hide, skip, restore, badge };
  }
  function prepare() {
    records = records.filter(record => table.contains(record.cell));
    for (const { cell, blocks } of parser.parse(table, group)) {
      cell.dataset.tpuPrepared = 'true';
      const container = ui.element('div', 'tpu-cell');
      const entries = blocks.map(({ nodes, lesson, inheritedHeading }) => {
        const wrapper = ui.element('div', 'tpu-lesson');
        if (inheritedHeading) wrapper.append(inheritedHeading.cloneNode(true));
        wrapper.append(...nodes);
        container.append(wrapper);
        return { wrapper, lesson, controls: lesson ? controls(lesson, wrapper) : null };
      });
      // Move the original nodes rather than cloning links or replacing their listeners.
      cell.replaceChildren(container);
      records.push({ cell, entries, background: {
        value: cell.style.getPropertyValue('background-color'), priority: cell.style.getPropertyPriority('background-color'),
      } });
    }
    render();
  }
  function render() {
    if (!panel) return;
    let hiddenCount = 0;
    for (const { cell, entries, background } of records) {
      let visible = 0;
      for (const entry of entries) {
        const reason = entry.lesson && ready ? rules.reason(state, entry.lesson) : '';
        entry.wrapper.hidden = Boolean(reason) && !full;
        entry.wrapper.classList.toggle('tpu-is-hidden', Boolean(reason));
        entry.wrapper.classList.toggle('tpu-divider', !entry.wrapper.hidden && visible > 0);
        if (!entry.wrapper.hidden) visible++;
        if (!entry.lesson) continue;
        if (reason) hiddenCount++;
        const { bar, hide, skip, restore, badge } = entry.controls;
        bar.hidden = Boolean(reason);
        hide.hidden = skip.hidden = Boolean(reason);
        restore.hidden = !reason;
        badge.textContent = reason;
        badge.hidden = !reason;
        for (const node of [hide, skip, restore]) node.disabled = busy || !ready;
      }
      cell.classList.toggle('tpu-empty', visible === 0);
      // Subject tints are inline !important. Remove only that declaration so the
      // site's own cell styling, such as today's column, stays visible.
      if (visible > 0 && background.value) {
        cell.style.setProperty('background-color', background.value, background.priority);
      } else {
        cell.style.removeProperty('background-color');
      }
    }
    panel.render(state, hiddenCount, full);
    for (const node of panel.panel.querySelectorAll('.tpu-rule button')) node.disabled = busy || !ready;
  }
  let scheduled = false;
  function scan() {
    scheduled = false;
    const next = document.querySelector('#raspisanie-table table.timetable, table.timetable');
    if (!next) return;
    if (next !== table) {
      panel?.panel.remove();
      table = next;
      records = [];
      panel = ui.createPanel(table, value => { full = value; render(); }, item => act('unhide', item));
      panel.error(ready ? '' : 'Загружаем локальные правила…');
    }
    prepare();
  }
  function schedule(mutations) {
    // Ignore mutations made by our own UI; observe delayed decryption and table replacement.
    const relevant = mutations.some(mutation => {
      const element = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      return !element?.closest('.tpu-panel, .tpu-cell') &&
        (element?.closest('#raspisanie-table, .timetable') ||
         [...mutation.addedNodes].some(node => node.nodeType === 1 &&
           (node.matches?.('#raspisanie-table, .timetable') || node.querySelector?.('.timetable'))));
    });
    if (relevant && !scheduled) {
      scheduled = true;
      queueMicrotask(scan);
    }
  }
  new MutationObserver(schedule).observe(document.body, {
    childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['class', 'title'],
  });
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[`tpuScheduleFilter:${group}`]) refresh();
  });
  scan();
  refresh();
})();
