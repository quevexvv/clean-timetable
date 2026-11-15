(() => {
  const { createStore, rules, site } = globalThis.TpuFilter;
  const t = browser.i18n.getMessage.bind(browser.i18n);
  const store = createStore(browser.storage.local);
  browser.action.onClicked.addListener(async tab => {
    const tabId = tab?.id;
    if (tabId === undefined) return;
    const response = await browser.tabs.sendMessage(tabId, { kind: 'tpu:toggle-panel' }, { frameId: 0 })
      .catch(() => undefined);
    const handled = response?.handled === true;
    try {
      await Promise.all([
        browser.action.setBadgeText({ tabId, text: handled ? '' : '!' }),
        browser.action.setTitle({ tabId, title: t(handled ? 'togglePanel' : 'panelUnavailable') }),
      ]);
    } catch {
      // The tab can close before the toolbar can be updated.
    }
  });
  browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || !['tpu:get', 'tpu:update'].includes(message.kind)) return undefined;
    return (async () => {
      try {
        const group = site.groupId(new URL(sender.url));
        if (sender.id !== browser.runtime.id || !group) {
          throw new rules.RuleError('groupPageOnly');
        }
        const state = message.kind === 'tpu:get' ? await store.get(group) :
          await store.update(group, message.action, message.lesson);
        return { state };
      } catch (error) {
        return { error: t('rulesNotSaved', rules.errorMessage(error, t)) };
      }
    })();
  });
})();
