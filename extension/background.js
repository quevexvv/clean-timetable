(() => {
  const store = globalThis.TpuFilter.createStore(browser.storage.local);
  browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || !['tpu:get', 'tpu:update'].includes(message.kind)) return undefined;
    return (async () => {
      try {
        const url = new URL(sender.url);
        const group = /^\/gruppa_(\d+)\/(?:\d+\/\d+\/)?view\.html$/.exec(url.pathname)?.[1];
        if (sender.id !== browser.runtime.id || url.origin !== 'https://my-rasp.tpu.ru' || !group) {
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
