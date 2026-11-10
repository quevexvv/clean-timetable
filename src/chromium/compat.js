// Adapts the Firefox WebExtensions API used by the shared code to Chromium.
(() => {
  const chromeApi = globalThis.chrome;
  if (globalThis.browser || !chromeApi) return;
  if (!chromeApi.runtime) {
    globalThis.browser = { storage: chromeApi.storage, i18n: chromeApi.i18n };
    return;
  }
  const unavailable = () => ({ error: chromeApi.i18n.getMessage('backgroundUnavailable') });
  const runtime = Object.create(chromeApi.runtime);
  if (typeof chromeApi.runtime.sendMessage === 'function') {
    runtime.sendMessage = chromeApi.runtime.sendMessage.bind(chromeApi.runtime);
  }
  // Chromium does not resolve runtime.onMessage listeners from a returned Promise
  // in every supported version. Keep sendResponse alive while the Promise settles.
  const source = chromeApi.runtime.onMessage;
  if (source && typeof source.addListener === 'function') {
    const addListener = source.addListener.bind(source);
    const wrapped = new WeakMap();
    const wrap = listener => {
      if (wrapped.has(listener)) return wrapped.get(listener);
      const wrapper = (message, sender, sendResponse) => {
        let result;
        try {
          result = listener(message, sender, sendResponse);
        } catch {
          sendResponse(unavailable());
          return false;
        }
        if (!result || typeof result.then !== 'function') return result;
        result.then(
          value => sendResponse(value),
          () => sendResponse(unavailable()),
        );
        return true;
      };
      wrapped.set(listener, wrapper);
      return wrapper;
    };
    runtime.onMessage = {
      addListener(listener) { addListener(wrap(listener)); },
      removeListener(listener) { if (source.removeListener) source.removeListener(wrap(listener)); },
      hasListener(listener) { return Boolean(source.hasListener && source.hasListener(wrap(listener))); },
      hasListeners() { return Boolean(source.hasListeners && source.hasListeners()); },
    };
  }
  globalThis.browser = { storage: chromeApi.storage, i18n: chromeApi.i18n, runtime };
})();
