(() => {
  const normalize = value => String(value).normalize('NFKC').replace(/\s+/gu, ' ').trim();
  const emptyState = () => ({ version: 1, rules: [], skipped: [], allowed: [] });
  function lesson(value) {
    if (!value || !/^\d+$/.test(value.group) || typeof value.subject !== 'string' ||
        !normalize(value.subject) || value.subject.length > 2000 ||
        typeof value.type !== 'string' || !normalize(value.type) || value.type.length > 100 ||
        !Array.isArray(value.teacherIds) || value.teacherIds.some(id => !/^\d+$/.test(id))) {
      throw new Error('Некорректные данные занятия. Обновите страницу.');
    }
    return {
      group: value.group, subject: normalize(value.subject), type: normalize(value.type),
      teacherIds: [...new Set(value.teacherIds)].sort(),
      teacherLabel: normalize(value.teacherLabel || 'Преподаватель не указан').slice(0, 1000),
      date: value.date, time: value.time,
    };
  }
  function ruleKey(value) {
    const item = lesson(value);
    return JSON.stringify([item.group, item.subject.toLocaleLowerCase('ru'), item.teacherIds, item.type]);
  }
  function occurrenceKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date) || !/^\d{2}:\d{2}$/.test(value.time)) {
      throw new Error('Не удалось определить дату и время занятия.');
    }
    return JSON.stringify([ruleKey(value), value.date, value.time]);
  }
  function validateState(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.rules) ||
        !Array.isArray(value.skipped) || !Array.isArray(value.allowed) ||
        [...value.skipped, ...value.allowed].some(key => typeof key !== 'string')) {
      throw new Error('Формат сохранённых правил не поддерживается. Данные не изменены.');
    }
    value.rules.forEach(ruleKey);
    for (const entry of [...value.skipped, ...value.allowed]) {
      let valid = false;
      try {
        const [key, date, time] = JSON.parse(entry);
        const [group, subject, teacherIds, type] = JSON.parse(key);
        valid = occurrenceKey({ group, subject, teacherIds, type, date, time }) === entry;
      } catch { /* Malformed saved exceptions must not be overwritten. */ }
      if (!valid) throw new Error('Сохранённые исключения повреждены. Данные не изменены.');
    }
    return value;
  }
  function reason(state, item) {
    const occurrence = occurrenceKey(item);
    if (state.allowed.includes(occurrence)) return '';
    if (state.skipped.includes(occurrence)) return 'Пропущено это занятие';
    if (state.rules.some(rule => ruleKey(rule) === ruleKey(item))) return 'Скрыто постоянным правилом';
    return '';
  }
  function change(state, action, value) {
    validateState(state);
    const item = lesson(value);
    const key = ruleKey(item);
    const next = structuredClone(state);
    if (action === 'hide') {
      if (!next.rules.some(rule => ruleKey(rule) === key)) {
        const { date, time, ...rule } = item;
        next.rules.push(rule);
      }
      // A new permanent hide also hides previously restored occurrences of this rule.
      next.allowed = next.allowed.filter(entry => JSON.parse(entry)[0] !== key);
    } else if (action === 'unhide') {
      next.rules = next.rules.filter(rule => ruleKey(rule) !== key);
      next.allowed = next.allowed.filter(entry => JSON.parse(entry)[0] !== key);
    } else if (action === 'skip' || action === 'restore') {
      const occurrence = occurrenceKey(item);
      next.skipped = next.skipped.filter(entry => entry !== occurrence);
      next.allowed = next.allowed.filter(entry => entry !== occurrence);
      if (action === 'skip') next.skipped.push(occurrence);
      else if (next.rules.some(rule => ruleKey(rule) === key)) next.allowed.push(occurrence);
    } else throw new Error('Неизвестное действие.');
    return next;
  }
  const api = { normalize, lesson, emptyState, validateState, ruleKey, occurrenceKey, reason, change };
  (globalThis.TpuFilter ||= {}).rules = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
