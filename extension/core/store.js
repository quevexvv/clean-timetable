(() => {
  const rules = globalThis.TpuFilter.rules;
  function createStore(storage) {
    let tail = Promise.resolve();
    function key(group) {
      if (!/^\d+$/.test(group)) throw new Error('Неизвестная группа.');
      return `tpuScheduleFilter:${group}`;
    }
    async function get(group) {
      const name = key(group);
      const data = await storage.get(name);
      return data[name] === undefined ? rules.emptyState() : rules.validateState(data[name]);
    }
    function update(group, action, item) {
      const operation = tail.then(async () => {
        if (item.group !== group) throw new Error('Группа занятия не совпадает со страницей.');
        const state = rules.change(await get(group), action, item);
        await storage.set({ [key(group)]: state });
        return state;
      });
      tail = operation.catch(() => {});
      return operation;
    }
    return { get, update };
  }
  globalThis.TpuFilter.createStore = createStore;
  if (typeof module !== 'undefined') module.exports = createStore;
})();
