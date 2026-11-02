(() => {
  const normalize = globalThis.TpuFilter.rules.normalize;
  function dateFrom(text) {
    const match = /\b(\d{2})\.(\d{2})\.(\d{4}|\d{2})\b/.exec(text);
    if (!match) return null;
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const iso = `${year}-${match[2]}-${match[1]}`;
    const parsed = new Date(`${iso}T00:00:00Z`);
    return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
  }
  function chunks(cell) {
    const result = [[]];
    for (const node of cell.childNodes) {
      if (node.nodeType === 1 && node.tagName === 'HR') result.push([]);
      else result.at(-1).push(node);
    }
    return result.filter(nodes => nodes.some(node => node.textContent.trim() || node.nodeType === 1));
  }
  function readLesson(nodes, context, previous) {
    const elements = nodes.filter(node => node.nodeType === 1);
    const find = selector => elements.flatMap(element => [
      ...(element.matches(selector) ? [element] : []), ...element.querySelectorAll(selector),
    ]);
    // The site decrypts names after load; never key a rule on encrypted or empty text.
    if (find('.encrypt').length) return null;
    const subjectNode = find('span[data-title], a[data-encrypt], span[title]')[0];
    const teachers = find('a[href]').flatMap(anchor => {
      try {
        const url = new URL(anchor.getAttribute('href'), 'https://my-rasp.tpu.ru');
        const id = url.origin === 'https://my-rasp.tpu.ru' && /^\/user_(\d+)\//.exec(url.pathname)?.[1];
        return id ? [{ id, label: normalize(anchor.textContent) }] : [];
      } catch { return []; }
    });
    // TPU also separates teachers under one shared subject/type heading with an hr.
    const inherit = !subjectNode && teachers.length > 0 && previous;
    const subject = normalize(subjectNode?.getAttribute('title') || subjectNode?.textContent || (inherit ? previous.subject : ''));
    const type = normalize(find('b[title]')[0]?.textContent || (inherit ? previous.type : ''));
    if (!subject || subject === '-' || !type || !context.date || !context.time) return null;
    return {
      ...context, subject, type,
      teacherIds: [...new Set(teachers.map(teacher => teacher.id))].sort(),
      teacherLabel: teachers.map(teacher => teacher.label).join(', ') || 'Преподаватель не указан',
    };
  }
  function parse(table, group) {
    const occupiedUntil = [];
    const dates = [];
    const result = [];
    for (const [rowIndex, row] of [...table.rows].entries()) {
      let column = 0;
      const time = /\b([012]\d:[0-5]\d)\b/.exec(row.cells[0]?.getAttribute('title') || row.cells[0]?.textContent || '')?.[1];
      for (const cell of row.cells) {
        while ((occupiedUntil[column] || 0) > rowIndex) column++;
        if (cell.tagName === 'TH') dates[column] = dateFrom(cell.textContent);
        if (cell.matches('td.cell') && cell.colSpan === 1 && !cell.dataset.tpuPrepared &&
            !cell.querySelector('.encrypt')) {
          const context = { group, date: dates[column], time };
          let previous;
          let lastHeading;
          const blocks = chunks(cell).map(nodes => {
            const heading = nodes.find(node => node.nodeType === 1 &&
              (node.matches('span[data-title], a[data-encrypt], span[title]') ||
               node.querySelector('span[data-title], a[data-encrypt], span[title]')));
            const item = readLesson(nodes, context, previous);
            const inheritedHeading = item && !heading ? lastHeading : null;
            if (item) { previous = item; if (heading) lastHeading = heading; }
            else { previous = undefined; lastHeading = undefined; }
            return { nodes, lesson: item, inheritedHeading };
          });
          if (blocks.some(block => block.lesson)) result.push({ cell, blocks });
        }
        for (let offset = 0; offset < cell.colSpan; offset++) {
          occupiedUntil[column + offset] = rowIndex + cell.rowSpan;
        }
        column += cell.colSpan;
      }
    }
    return result;
  }
  const api = { parse, dateFrom };
  globalThis.TpuFilter.parser = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
