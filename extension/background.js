(() => {
  const { createStore, site } = globalThis.TpuFilter;
  const store = createStore(browser.storage.local);
  browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || !['tpu:get', 'tpu:update'].includes(message.kind)) return undefined;
    return (async () => {
      try {
        const group = site.groupId(new URL(sender.url));
        if (sender.id !== browser.runtime.id || !group) {
          throw new Error('Действие доступно только в расписании группы ТПУ.');
        }
        const state = message.kind === 'tpu:get' ? await store.get(group) :
          await store.update(group, message.action, message.lesson);
        return { state };
      } catch (error) {
        return { error: `Правила не сохранены: ${error.message}` };
      }
    })();
  });
})();
