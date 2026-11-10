const manifest = require('../../src/extension/manifest.json');
const catalogs = {
  ru: require('../../src/extension/_locales/ru/messages.json'),
  en: require('../../src/extension/_locales/en/messages.json'),
};

module.exports = function mockI18n(locale = manifest.default_locale) {
  const catalog = catalogs[locale.split('-')[0]] || catalogs[manifest.default_locale];
  return {
    getMessage(key, value) {
      const entry = catalog[key] || catalogs[manifest.default_locale][key];
      return entry?.message.replace(/\$(\w+)\$/g, (_, name) => {
        if (entry.placeholders[name.toLowerCase()].content !== '$1') throw new Error('Unexpected placeholder');
        return value;
      }) || '';
    },
  };
};
