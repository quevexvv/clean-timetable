(() => {
  const origins = new Set(['https://my-rasp.tpu.ru', 'https://ro-rasp.tpu.ru']);

  function groupId(url) {
    if (origins.has(url.origin)) {
      return /^\/gruppa_(\d+)\/(?:\d+\/\d+\/)?view\.html$/.exec(url.pathname)?.[1];
    }
  }

  function teacherId(href, base) {
    try {
      const url = new URL(href, base);
      if (origins.has(url.origin)) return /^\/user_(\d+)\//.exec(url.pathname)?.[1];
    } catch { /* Ignore malformed links. */ }
  }

  (globalThis.TpuFilter ||= {}).site = { groupId, teacherId };
})();
