import { officialPrices, priceDate, priceSource } from './pricing.ts';
import {
  csv,
  dateKey,
  estimate,
  parsePrices,
  selectRecords,
  summarize,
  type Filters,
  type Prices,
  type Snapshot,
  type UsageRecord,
} from './model.ts';
async function main() {
  const element = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const e = document.getElementById(id);
    if (!e) throw new Error(`Missing ${id}`);
    return e as T;
  };
  const encoded = element('usage-data');
  const compressed = Uint8Array.from(atob(encoded.textContent ?? ''), (c) => c.charCodeAt(0));
  const data = await new Response(
    new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')),
  ).text();
  let snapshot = JSON.parse(data) as Snapshot;
  encoded.remove();
  let prices: Prices = parsePrices(officialPrices);
  const storageKey = 'codex-offline-usage-prices-v2';
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) prices = parsePrices(JSON.parse(saved));
    else {
      const legacy = localStorage.getItem('codex-offline-usage-prices-v1');
      if (legacy) prices = parsePrices({ ...officialPrices, ...parsePrices(JSON.parse(legacy)) });
      localStorage.setItem(storageKey, JSON.stringify(prices));
    }
  } catch {
    /* Unavailable browser storage or invalid saved rates: use the official defaults. */
  }
  const autoReviewToggle = element<HTMLInputElement>('ignore-auto-review');
  const autoReviewKey = 'codex-offline-usage-ignore-auto-review-v1';
  try {
    autoReviewToggle.checked = localStorage.getItem(autoReviewKey) !== 'false';
  } catch {
    /* The default still works when storage is unavailable. */
  }
  const compact = (n: number) =>
    new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  const exact = (n: number) => n.toLocaleString('en');
  const money = (n: number) =>
    n > 0 && n < 0.000001
      ? '<$0.000001'
      : '$' +
        n.toLocaleString('en', {
          minimumFractionDigits: 2,
          maximumFractionDigits: n < 0.01 ? 6 : 2,
        });
  const input = (id: string) => element<HTMLInputElement | HTMLSelectElement>(id);
  const filters = (): Filters => ({
    from: input('from').value,
    to: input('to').value,
    model: input('model').value,
    project: input('project').value,
    effort: input('effort').value,
    search: input('search').value,
    timezone: input('timezone').value,
    ignoreAutoReview: autoReviewToggle.checked,
  });
  const selected = () => selectRecords(snapshot.records, filters());
  const set = (id: string, text: string) => {
    element(id).textContent = text;
  };
  const node = (tag: string, text = '', className = '') => {
    const e = document.createElement(tag);
    e.textContent = text;
    e.className = className;
    return e;
  };
  const shortProject = (p: string) => p.split(/[\\/]/).filter(Boolean).slice(-2).join('/') || p;
  let page = 0;
  const pageSize = 15;
  let sortKey = 'tokens';
  let sortDirection = -1;
  const share = (n: number | null) => (n === null ? '—' : (n * 100).toFixed(1) + '%');
  let evidenceRecords: UsageRecord[] | null = null;
  let focusBefore: HTMLElement | null = null;
  function message(text: string, error = false) {
    set('message', text);
    element('message').className = error ? 'error' : '';
  }
  function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function populateFilters() {
    for (const [id, key, label] of [
      ['model', 'model', 'models'],
      ['project', 'project', 'projects'],
      ['effort', 'effort', 'efforts'],
    ] as const) {
      const select = element<HTMLSelectElement>(id);
      const value = select.value;
      select.replaceChildren(new Option(`All ${label}`, ''));
      for (const item of [...new Set(snapshot.records.map((r) => r[key]))].sort()) {
        const option = new Option(id === 'project' ? shortProject(item) : item, item);
        option.title = item;
        select.add(option);
      }
      if ([...select.options].some((o) => o.value === value)) select.value = value;
    }
  }
  function range(days: number | null) {
    if (days === null) {
      input('from').value = '';
      input('to').value = '';
    } else {
      const end = dateKey(new Date().toISOString(), input('timezone').value);
      const start = new Date(end + 'T12:00:00Z');
      start.setUTCDate(start.getUTCDate() - days + 1);
      input('from').value = start.toISOString().slice(0, 10);
      input('to').value = end;
    }
    page = 0;
    render();
  }
  function tab(name: string) {
    for (const t of ['overview', 'pricing', 'sources']) element(t).hidden = t !== name;
    document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === name);
      b.setAttribute('aria-current', b.dataset.tab === name ? 'page' : 'false');
    });
    if (name === 'pricing') renderPrices();
    if (name === 'sources') renderSources();
  }
  function tooltip(text: string, event: MouseEvent) {
    const tip = element('tooltip');
    tip.textContent = text;
    tip.hidden = false;
    tip.style.left = Math.min(event.clientX + 12, window.innerWidth - 270) + 'px';
    tip.style.top =
      Math.max(8, Math.min(event.clientY + 12, window.innerHeight - tip.offsetHeight - 12)) + 'px';
  }
  function openEvidence(records: UsageRecord[], title: string) {
    focusBefore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    evidenceRecords = records;
    set('evidence-title', title);
    const content = element('evidence-content');
    content.replaceChildren();
    const total = summarize(records, prices);
    content.append(
      node(
        'p',
        `${exact(total.events)} usage events · ${exact(total.total)} tokens · ${total.priced ? money(total.knownCost) + ' priced subtotal' : 'unpriced'}`,
        'caption',
      ),
    );
    const sessions = [...new Set(records.map((record) => record.session))];
    const actions = node('div', '', 'tools');
    for (const session of sessions) {
      const link = document.createElement('a');
      link.className = 'trace-link';
      link.textContent =
        sessions.length === 1
          ? 'Open full trace ↗'
          : 'Open full trace · ' + session.slice(0, 8) + ' ↗';
      if (location.protocol === 'http:') {
        link.href = '/trace?session=' + encodeURIComponent(session) + '#view=conversation';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        link.setAttribute('aria-disabled', 'true');
        link.title = 'Run npm run usage:dashboard -- --serve to open full local traces.';
      }
      actions.append(link);
    }
    content.append(
      actions,
      node(
        'p',
        location.protocol === 'http:'
          ? 'Full trace includes available messages, tools, outputs and indexed child sessions, regardless of the current usage filters.'
          : 'Full traces require the local dashboard server: npm run usage:dashboard -- --serve.',
        'caption',
      ),
    );
    const usedSources = new Set(records.map((r) => r.source));
    for (const source of snapshot.sources.filter((s) => usedSources.has(s.path))) {
      const d = node('details');
      d.append(node('summary', source.path));
      d.append(
        node(
          'pre',
          `SHA-256: ${source.sha256}\nBytes scanned: ${source.bytes}\nPhysical lines: ${source.lines}\nSession: ${source.session}\nDelegated by: ${source.parent || 'None'}\nForked from: ${source.forkedFrom || 'None'}\nHistory inherited from: ${source.historyBase || 'None'}`,
        ),
      );
      content.append(d);
    }
    // Keep very large usage summaries responsive; full history opens in the trace visualizer.
    const shown = records
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 100);
    for (const r of shown) {
      const d = node('div', '', 'record');
      d.append(
        node(
          'p',
          new Date(r.at).toLocaleString('en', { timeZone: filters().timezone }) +
            ' · ' +
            r.model +
            ' · ' +
            r.effort,
        ),
      );
      d.append(
        node(
          'p',
          `Input ${exact(r.tokens.input)} (read ${exact(r.tokens.cached)}, write ${exact(r.tokens.write)}) · output ${exact(r.tokens.output)} (reasoning ${exact(r.tokens.reasoning)})`,
        ),
      );
      const cost = estimate(r, prices);
      d.append(
        node(
          'p',
          `${cost === null ? 'Unpriced' : money(cost) + ' estimated'} · ${r.method === 'response' ? 'Per-response record' : r.method === 'snapshot' ? 'Last-request snapshot' : 'Cumulative delta'}`,
        ),
      );
      d.append(node('code', `${r.source}:${r.line}`));
      const detail = node('details');
      detail.append(node('summary', 'Normalized record'));
      detail.append(node('pre', JSON.stringify(r, null, 2)));
      d.append(detail);
      content.append(d);
    }
    if (records.length > shown.length)
      content.append(
        node(
          'p',
          `Showing ${shown.length} of ${records.length} records. Open full trace for complete available session history.`,
          'caption',
        ),
      );
    element('evidence').hidden = false;
    element('close-evidence').focus();
  }
  function closeEvidence() {
    element('evidence').hidden = true;
    evidenceRecords = null;
    focusBefore?.focus();
  }
  function group<T>(records: T[], key: (r: T) => string): Map<string, T[]> {
    const result = new Map<string, T[]>();
    for (const r of records) {
      const k = key(r);
      const rows = result.get(k);
      if (rows) rows.push(r);
      else result.set(k, [r]);
    }
    return result;
  }
  function renderTrend(records: UsageRecord[]) {
    const container = element('trend');
    container.replaceChildren();
    const measure = input('measure').value;
    const daily = group(records, (r) => dateKey(r.at, filters().timezone));
    if (!daily.size) {
      container.append(node('p', 'No usage matches these filters.', 'empty'));
      element('legend').replaceChildren();
      return;
    }
    const days = [...daily.keys()].sort();
    const span = (Date.parse(days[days.length - 1]) - Date.parse(days[0])) / 86400000 + 1;
    // Use a weekly chart for broad ranges; group totals remain exact and drilldown contains all days.
    const width = Math.max(260, Math.min(1000, container.clientWidth)),
      height = 230,
      left = 55,
      right = 12,
      top = 10,
      bottom = 30;
    const plotWidth = width - left - right,
      plotHeight = height - top - bottom;
    const bucketDays = span > 90 ? 7 : 1;
    const first = Date.parse(days[0]);
    const buckets = new Map<number, UsageRecord[]>();
    for (const [day, rows] of daily) {
      const index = Math.floor((Date.parse(day) - first) / 86400000 / bucketDays);
      buckets.set(index, [...(buckets.get(index) ?? []), ...rows]);
    }
    const count = Math.ceil(span / bucketDays);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${bucketDays === 7 ? 'Weekly' : 'Daily'} ${measure} chart`);
    const svgNode = (tag: string, attrs: Record<string, string | number>) => {
      const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      svg.append(e);
      return e;
    };
    const values = [...buckets.values()].map((rows) => {
      const s = summarize(rows, prices);
      return measure === 'reasoning'
        ? (s.reasoningShare ?? 0) * 100
        : measure === 'tokens'
          ? s.total
          : measure === 'events'
            ? s.events
            : s.knownCost;
    });
    const max = measure === 'reasoning' ? 100 : Math.max(...values, 1);
    for (let i = 0; i <= 4; i++) {
      const y = top + plotHeight * (1 - i / 4);
      svgNode('line', { x1: left, x2: width - right, y1: y, y2: y, stroke: '#e8eee7' });
      const label = svgNode('text', { x: left - 8, y: y + 4, 'text-anchor': 'end' });
      label.textContent =
        measure === 'reasoning'
          ? ((max * i) / 4).toFixed(0) + '%'
          : measure === 'cost'
            ? money((max * i) / 4)
            : compact((max * i) / 4);
    }
    const barWidth = Math.max(0.6, (plotWidth / count) * 0.72);
    for (const [index, rows] of buckets) {
      const s = summarize(rows, prices);
      const x = left + ((index + 0.5) * plotWidth) / count - barWidth / 2;
      let offset = 0;
      const components =
        measure === 'tokens'
          ? ([
              [s.tokens.input - s.tokens.cached - s.tokens.write, '#347353'],
              [s.tokens.cached, '#83b79a'],
              [s.tokens.write, '#d4ae64'],
              [s.tokens.output - s.tokens.reasoning, '#b3a6c8'],
              [s.tokens.reasoning, '#8070a2'],
            ] as const)
          : ([
              [
                measure === 'reasoning'
                  ? (s.reasoningShare ?? 0) * 100
                  : measure === 'events'
                    ? s.events
                    : s.knownCost,
                '#347353',
              ],
            ] as const);
      for (const [value, color] of components) {
        if (!value) continue;
        const h = (value / max) * plotHeight;
        const date = new Date(first + index * bucketDays * 86400000).toISOString().slice(0, 10);
        const rect = svgNode('rect', {
          x,
          y: top + plotHeight - offset - h,
          width: barWidth,
          height: h,
          fill: color,
          'data-day': date,
          tabindex: 0,
          role: 'button',
          'aria-label': `${date}: ${compact(s.total)} tokens, inspect usage`,
        });
        offset += h;
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${date}${bucketDays === 7 ? ' · 7-day bucket' : ''}\n${exact(s.total)} tokens\n${share(s.reasoningShare)} reasoning / output${s.missingReasoning ? ' (lower bound)' : ''}\n${exact(s.events)} events\n${s.priced ? s.priced + '/' + s.events + ' priced · ' + money(s.knownCost) : 'Unpriced'}`;
        rect.append(title);
        rect.addEventListener('mousemove', (e) => tooltip(title.textContent ?? '', e));
        rect.addEventListener('mouseleave', () => {
          element('tooltip').hidden = true;
        });
        rect.addEventListener('click', () => openEvidence(rows, 'Usage · ' + date));
        rect.addEventListener('keydown', (e) => {
          if (e instanceof KeyboardEvent && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openEvidence(rows, 'Usage · ' + date);
          }
        });
      }
    }
    for (const [i, day] of days.entries()) {
      if (
        i !== 0 &&
        i !== days.length - 1 &&
        i % Math.max(1, Math.ceil(days.length / (width < 500 ? 3 : 5)))
      )
        continue;
      const x = left + ((Date.parse(day) - first) / 86400000 / span) * plotWidth;
      const label = svgNode('text', {
        x: Math.min(x, width - 35),
        y: height - 5,
        'text-anchor': i === 0 ? 'start' : 'middle',
      });
      label.textContent = day.slice(5);
    }
    container.append(svg);
    const legend = element('legend');
    legend.replaceChildren();
    const entries =
      measure === 'tokens'
        ? [
            ['Uncached input', '#347353'],
            ['Cache read', '#83b79a'],
            ['Cache write', '#d4ae64'],
            ['Visible output', '#b3a6c8'],
            ['Reasoning output', '#8070a2'],
          ]
        : [
            [
              measure === 'reasoning'
                ? 'Recorded reasoning ÷ output · %'
                : measure === 'cost'
                  ? 'Priced subtotal · USD'
                  : 'Usage events',
              '#347353',
            ],
          ];
    for (const [text, color] of entries) {
      const item = node('span');
      const swatch = node('i');
      swatch.style.background = color;
      item.append(swatch, document.createTextNode(text));
      legend.append(item);
    }
    if (bucketDays === 7) legend.append(node('span', '7-day buckets'));
    if (measure === 'cost' && records.some((r) => estimate(r, prices) === null))
      legend.append(node('span', 'Unpriced events excluded from cost bars'));
  }
  function renderHeatmap(records: UsageRecord[]) {
    const daily = group(records, (r) => dateKey(r.at, filters().timezone));
    const end = filters().to || dateKey(new Date().toISOString(), filters().timezone);
    const endTime = Date.parse(end + 'T12:00:00Z');
    const startTime = endTime - 181 * 86400000;
    const startDay = new Date(startTime).toISOString().slice(0, 10);
    set('activity-caption', 'Last 182 days ending ' + end + ' · current filters');
    set('heat-start', startDay);
    set('heat-end', end);
    const container = element('heatmap');
    container.replaceChildren();
    const maxima = Math.max(1, ...[...daily.values()].map((r) => summarize(r, prices).total));
    const colors = ['#edf1ec', '#d0e5d5', '#94bfa3', '#57956d', '#276344'];
    let week: HTMLElement | null = null;
    const padding = new Date(startTime).getUTCDay();
    for (let i = -padding; i < 182; i++) {
      if (!week || (i + padding) % 7 === 0) {
        week = node('div', '', 'week');
        container.append(week);
      }
      const day = new Date(startTime + i * 86400000).toISOString().slice(0, 10);
      const rows = i < 0 ? [] : (daily.get(day) ?? []);
      const total = summarize(rows, prices).total;
      const b = document.createElement('button');
      b.type = 'button';
      b.style.background = colors[total ? Math.max(1, Math.ceil((total / maxima) * 4)) : 0];
      b.title = `${day} · ${exact(total)} tokens`;
      b.setAttribute('aria-label', b.title);
      b.disabled = !rows.length;
      if (i < 0) b.style.visibility = 'hidden';
      b.addEventListener('click', () => {
        input('from').value = day;
        input('to').value = day;
        page = 0;
        render();
      });
      week.append(b);
    }
  }
  function renderBreakdown(
    records: UsageRecord[],
    id: string,
    key: 'model' | 'project' | 'effort',
  ) {
    const entries = [...group(records, (r) => r[key])]
      .map(([name, rows]) => ({
        name,
        summary: summarize(rows, prices),
        total: summarize(rows, prices).total,
      }))
      .sort((a, b) => b.total - a.total);
    const container = element(id);
    container.replaceChildren();
    if (!entries.length) {
      container.append(node('p', 'No matching usage.', 'empty'));
      return;
    }
    const max = entries[0].total;
    for (const e of entries.slice(0, 8)) {
      const row = node('div', '', 'bar-row');
      const b = node('button');
      b.title = e.name;
      const label = node('span', key === 'project' ? shortProject(e.name) : e.name, 'bar-name');
      b.append(label, node('span', compact(e.total)));
      b.addEventListener('click', () => {
        input(key).value = e.name;
        page = 0;
        render();
      });
      const track = node('div', '', 'bar-track');
      const fill = node('div', '', 'bar-fill');
      fill.style.width = (e.total / max) * 100 + '%';
      track.append(fill);
      row.append(
        b,
        track,
        node(
          'span',
          `${share(e.summary.reasoningShare)} reasoning / output${e.summary.missingReasoning ? ' · lower bound' : ''}`,
          'caption',
        ),
      );
      container.append(row);
    }
    if (entries.length > 8)
      container.append(
        node('span', `Top 8 of ${entries.length}. Use the filter to select any ${key}.`, 'caption'),
      );
  }
  function renderSessions(records: UsageRecord[]) {
    const groups = [...group(records, (r) => r.session)].map(([session, rows]) => ({
      session,
      rows,
      total: summarize(rows, prices),
    }));
    type Session = (typeof groups)[number];
    const columns: [string, string, (g: Session) => string | number | null][] = [
      ['session', 'Session / project', (g) => g.session + ' ' + g.rows[0].project],
      ['models', 'Models', (g) => [...new Set(g.rows.map((r) => r.model))].sort().join(', ')],
      ['effort', 'Effort', (g) => [...new Set(g.rows.map((r) => r.effort))].sort().join(', ')],
      ['last', 'Last activity', (g) => g.rows[g.rows.length - 1].at],
      ['events', 'Events', (g) => g.total.events],
      ['tokens', 'Tokens', (g) => g.total.total],
      ['reasoning', 'Reasoning / output', (g) => g.total.reasoningShare],
      ['cost', 'Estimated USD', (g) => (g.total.priced ? g.total.knownCost : null)],
    ];
    const column = columns.find(([key]) => key === sortKey) ?? columns[5];
    groups.sort((a, b) => {
      const x = column[2](a),
        y = column[2](b);
      if (x === null || y === null)
        return x === y ? a.session.localeCompare(b.session) : x === null ? 1 : -1;
      const comparison =
        typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return comparison * sortDirection || a.session.localeCompare(b.session);
    });
    const pages = Math.max(1, Math.ceil(groups.length / pageSize));
    page = Math.min(page, pages - 1);
    set('session-count', `${groups.length} sessions`);
    const container = element('sessions');
    container.replaceChildren();
    const table = node('table'),
      head = node('thead'),
      header = node('tr');
    for (const [key, text] of columns) {
      const th = node('th');
      th.setAttribute('scope', 'col');
      th.setAttribute(
        'aria-sort',
        sortKey === key ? (sortDirection === 1 ? 'ascending' : 'descending') : 'none',
      );
      const button = node(
        'button',
        text + (sortKey === key ? (sortDirection === 1 ? ' ↑' : ' ↓') : ''),
        'sort-header',
      );
      button.setAttribute('aria-label', 'Sort by ' + text);
      button.addEventListener('click', () => {
        sortDirection =
          sortKey === key ? -sortDirection : ['session', 'models', 'effort'].includes(key) ? 1 : -1;
        sortKey = key;
        page = 0;
        renderSessions(records);
        container.querySelector<HTMLElement>(`button[aria-label="Sort by ${text}"]`)?.focus();
      });
      th.append(button);
      header.append(th);
    }
    head.append(header);
    table.append(head);
    const body = node('tbody');
    for (const g of groups.slice(page * pageSize, (page + 1) * pageSize)) {
      const row = node('tr', '', 'session-row');
      row.tabIndex = 0;
      row.setAttribute('aria-label', 'Inspect session ' + g.session);
      const inspect = () => {
        row.focus();
        openEvidence(g.rows, 'Session · ' + g.session.slice(0, 8));
      };
      row.addEventListener('click', inspect);
      row.addEventListener('keydown', (e) => {
        if (e instanceof KeyboardEvent && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          inspect();
        }
      });
      const first = node('td');
      first.append(
        node('span', g.session.slice(0, 8)),
        node('div', shortProject(g.rows[0].project), 'caption'),
      );
      first.title = g.session + '\n' + g.rows[0].project;
      const reasoning = node(
        'td',
        share(g.total.reasoningShare) + (g.total.missingReasoning ? ' ≥' : ''),
        'number',
      );
      reasoning.title = `${exact(g.total.tokens.reasoning)} recorded reasoning / ${exact(g.total.tokens.output)} output tokens${g.total.missingReasoning ? '; missing counters make this a lower bound' : ''}`;
      row.append(
        first,
        node('td', String(columns[1][2](g))),
        node('td', String(columns[2][2](g))),
        node('td', dateKey(g.rows[g.rows.length - 1].at, filters().timezone)),
        node('td', exact(g.total.events), 'number'),
        node('td', compact(g.total.total), 'number'),
        reasoning,
        node(
          'td',
          g.total.priced
            ? money(g.total.knownCost) + (g.total.priced < g.total.events ? ' · partial' : '')
            : '—',
          'number',
        ),
      );
      body.append(row);
    }
    table.append(body);
    container.append(table);
    if (!groups.length) container.append(node('p', 'No sessions match these filters.', 'empty'));
    set('page-count', `${page + 1} / ${pages}`);
    element<HTMLButtonElement>('previous').disabled = page === 0;
    element<HTMLButtonElement>('next').disabled = page >= pages - 1;
  }
  function renderPrices() {
    const link = element<HTMLAnchorElement>('price-source');
    link.href = priceSource;
    link.textContent = `Official OpenAI rates · checked ${priceDate}`;
    const container = element('price-table');
    container.replaceChildren();
    const table = node('table');
    const tr = node('tr');
    for (const text of ['Model', 'Uncached input', 'Cache read', 'Cache write', 'Output'])
      tr.append(node('th', text));
    const head = node('thead');
    head.append(tr);
    table.append(head);
    const body = node('tbody');
    for (const model of [
      ...new Set([...snapshot.records.map((r) => r.model), ...Object.keys(prices)]),
    ].sort()) {
      const row = node('tr');
      row.append(node('td', model));
      for (const key of ['input', 'cached', 'write', 'output'] as const) {
        const td = node('td');
        const i = document.createElement('input');
        i.type = 'number';
        i.min = '0';
        i.step = 'any';
        i.placeholder = 'Unpriced';
        i.className = 'price-input';
        i.dataset.model = model;
        i.dataset.key = key;
        i.setAttribute('aria-label', `${model} ${key} USD per million`);
        if (prices[model]) i.value = String(prices[model][key]);
        td.append(i);
        row.append(td);
      }
      body.append(row);
    }
    table.append(body);
    container.append(table);
  }
  function renderSources() {
    set(
      'source-summary',
      `${snapshot.sources.length} files · ${snapshot.cachedFiles} unchanged files reused · ${snapshot.appendedFiles} appended files · ${snapshot.reindexedFiles} full scans · ${compact(snapshot.scannedBytes)} bytes scanned · ${snapshot.duplicates} duplicates ignored · ${snapshot.inherited} inherited records ignored`,
    );
    set('gap-label', `Coverage gaps (${snapshot.gaps.length})`);
    const totals = element('gap-summary');
    totals.replaceChildren();
    for (const [reason, rows] of group(snapshot.gaps, (g) => g.reason))
      totals.append(
        node(
          'p',
          `${reason}: ${exact(rows.reduce((n, g) => n + g.count, 0))} occurrences in ${new Set(rows.map((g) => g.source)).size} files`,
        ),
      );
    const gaps = element('gaps');
    gaps.replaceChildren();
    for (const g of snapshot.gaps) {
      const d = node('div', '', 'source');
      d.append(node('p', g.reason + (g.count > 1 ? ` · ${g.count} occurrences` : '')));
      if (g.example) d.append(node('p', 'Example: ' + g.example, 'caption'));
      d.append(node('code', g.source + (g.line ? ':' + g.line : '')));
      gaps.append(d);
    }
    if (!snapshot.gaps.length) gaps.append(node('p', 'No detected coverage gaps.'));
    set('source-label', `Source files (${snapshot.sources.length})`);
    const list = element('source-list');
    list.replaceChildren();
    for (const s of snapshot.sources) {
      const d = node('div', '', 'source');
      d.append(node('code', s.path));
      d.append(
        node(
          'p',
          `${exact(s.bytes)} bytes · ${exact(s.lines)} physical lines · ${exact(s.records)} retained events`,
        ),
      );
      const details = node('details');
      details.append(node('summary', 'Hash and session metadata'));
      details.append(node('pre', JSON.stringify(s, null, 2)));
      d.append(details);
      list.append(d);
    }
  }
  function render() {
    const records = selected();
    const s = summarize(records, prices);
    const f = filters();
    const invalid = !!f.from && !!f.to && f.from > f.to;
    if (invalid) message('The start date must be on or before the end date.', true);
    else if (element('message').textContent?.startsWith('The start date')) message('');
    set(
      'updated',
      'Scanned ' + new Date(snapshot.generatedAt).toLocaleString('en', { timeZone: f.timezone }),
    );
    set('total', compact(s.total));
    element('total').title = exact(s.total) + ' tokens';
    set('token-sub', `${compact(s.tokens.input)} input · ${compact(s.tokens.output)} output`);
    set('events', exact(s.events));
    set(
      'event-sub',
      `${exact(s.sessions)} sessions · ${new Set(records.map((r) => r.model)).size} models`,
    );
    set(
      'cache',
      s.tokens.input ? ((s.tokens.cached / s.tokens.input) * 100).toFixed(1) + '%' : '—',
    );
    set(
      'cache-sub',
      `${compact(s.tokens.cached)} cache-read tokens / ${compact(s.tokens.input)} input`,
    );
    set('reasoning', share(s.reasoningShare));
    set(
      'reasoning-sub',
      `${compact(s.tokens.reasoning)} reasoning / ${compact(s.tokens.output)} output${s.missingReasoning ? ` · lower bound: ${s.missingReasoning} events lack counters` : ''}`,
    );
    set('cost', s.priced ? money(s.knownCost) : '—');
    set(
      'cost-sub',
      `${s.priced} / ${s.events} events priced${s.priced < s.events ? ' · add rates in Pricing' : ' · estimated, not billed'}`,
    );
    const coverage = element('coverage');
    coverage.hidden = !snapshot.gaps.length;
    coverage.replaceChildren();
    if (snapshot.gaps.length) {
      coverage.append(
        document.createTextNode(
          `${snapshot.gaps.length} source coverage gaps. Totals include readable, supported usage only. `,
        ),
      );
      const b = node('button', 'Inspect coverage');
      b.addEventListener('click', () => {
        tab('sources');
        element('gaps').parentElement?.setAttribute('open', '');
      });
      coverage.append(b);
    }
    set(
      'footer-count',
      `${exact(records.length)} of ${exact(snapshot.records.length)} usage events · ${f.from || 'earliest'} through ${f.to || 'latest'} · ${f.timezone}${f.ignoreAutoReview ? ' · auto-review sessions hidden' : ''}`,
    );
    renderTrend(records);
    renderHeatmap(records);
    renderBreakdown(records, 'models', 'model');
    renderBreakdown(records, 'projects', 'project');
    renderBreakdown(records, 'efforts', 'effort');
    renderSessions(records);
  }
  for (const id of ['from', 'to', 'model', 'project', 'effort', 'timezone'])
    input(id).addEventListener('change', () => {
      page = 0;
      render();
    });
  autoReviewToggle.addEventListener('change', () => {
    try {
      localStorage.setItem(autoReviewKey, String(autoReviewToggle.checked));
    } catch {
      /* Apply the filter even when browser storage is unavailable. */
    }
    page = 0;
    render();
  });
  input('search').addEventListener('input', () => {
    page = 0;
    render();
  });
  input('measure').addEventListener('change', () => renderTrend(selected()));
  document
    .querySelectorAll<HTMLButtonElement>('[data-tab]')
    .forEach((b) => b.addEventListener('click', () => tab(b.dataset.tab ?? 'overview')));
  document
    .querySelectorAll<HTMLButtonElement>('[data-range]')
    .forEach((b) =>
      b.addEventListener('click', () =>
        range(b.dataset.range === 'all' ? null : Number(b.dataset.range)),
      ),
    );
  element('reset').addEventListener('click', () => {
    for (const id of ['model', 'project', 'effort', 'search']) input(id).value = '';
    message('');
    range(30);
  });
  element('previous').addEventListener('click', () => {
    page--;
    renderSessions(selected());
  });
  element('next').addEventListener('click', () => {
    page++;
    renderSessions(selected());
  });
  element('export').addEventListener('click', () =>
    download('codex-usage.csv', csv(selected(), prices), 'text/csv;charset=utf-8'),
  );
  element('close-evidence').addEventListener('click', closeEvidence);
  element('evidence').addEventListener('click', (e) => {
    if (e.target === element('evidence')) closeEvidence();
  });
  document.addEventListener('keydown', (e) => {
    if (!evidenceRecords) return;
    if (e.key === 'Escape') closeEvidence();
    if (e.key === 'Tab') {
      const focusable = [
        ...element('evidence').querySelectorAll<HTMLElement>('button,summary,a[href]'),
      ];
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  element('save-prices').addEventListener('click', () => {
    try {
      const proposed: Record<string, Record<string, number | boolean>> = {};
      const all = [...element('price-table').querySelectorAll<HTMLInputElement>('input')];
      for (const model of [...new Set(all.map((i) => i.dataset.model ?? ''))]) {
        const fields = all.filter((i) => i.dataset.model === model);
        if (fields.every((i) => i.value === '')) continue;
        if (fields.some((i) => i.value === ''))
          throw new Error(`Fill all four rates for ${model}, or leave them all blank.`);
        const price: Record<string, number | boolean> = {};
        for (const i of fields) price[i.dataset.key ?? ''] = Number(i.value);
        if (officialPrices[model]?.longContext) price.longContext = true;
        if (prices[model]?.writeUnpublished && price.write === 0) price.writeUnpublished = true;
        Object.defineProperty(proposed, model, { value: price, enumerable: true });
      }
      prices = parsePrices(proposed);
      localStorage.setItem(storageKey, JSON.stringify(prices));
      set('price-status', 'Saved in this browser.');
      render();
    } catch (e) {
      set('price-status', e instanceof Error ? e.message : String(e));
    }
  });
  element('reset-prices').addEventListener('click', () => {
    prices = parsePrices(officialPrices);
    localStorage.setItem(storageKey, JSON.stringify(prices));
    renderPrices();
    render();
    set('price-status', `Restored official rates checked ${priceDate}.`);
  });
  element('export-prices').addEventListener('click', () =>
    download('codex-usage-prices.json', JSON.stringify(prices, null, 2), 'application/json'),
  );
  element('import-prices').addEventListener('click', () =>
    element<HTMLInputElement>('price-file').click(),
  );
  element<HTMLInputElement>('price-file').addEventListener('change', () => {
    void (async () => {
      try {
        const file = element<HTMLInputElement>('price-file').files?.[0];
        if (!file) return;
        const imported = parsePrices(JSON.parse(await file.text()));
        localStorage.setItem(storageKey, JSON.stringify(imported));
        prices = imported;
        renderPrices();
        render();
        set('price-status', 'Imported and saved prices.');
      } catch (e) {
        set('price-status', e instanceof Error ? e.message : String(e));
      } finally {
        element<HTMLInputElement>('price-file').value = '';
      }
    })();
  });
  element('refresh').addEventListener('click', () => {
    if (!['http:', 'https:'].includes(location.protocol)) {
      message(
        'This is a saved snapshot. Re-run npm run usage:dashboard, or use --serve for local refresh.',
      );
      return;
    }
    const b = element<HTMLButtonElement>('refresh');
    b.disabled = true;
    message('Scanning local logs…');
    void (async () => {
      try {
        const response = await fetch('/refresh', {
          method: 'POST',
          headers: { 'X-Usage-Refresh': '1' },
        });
        if (!response.ok) throw new Error(await response.text());
        const data = (await response.json()) as Snapshot;
        if (data.schemaVersion !== 1 || !Array.isArray(data.records))
          throw new Error('Invalid usage snapshot');
        snapshot = data;
        populateFilters();
        render();
        if (!element('sources').hidden) renderSources();
        if (!element('pricing').hidden) renderPrices();
        message('Refreshed local usage logs.');
      } catch (e) {
        message(
          `Refresh failed: ${e instanceof Error ? e.message : String(e)}. Start with npm run usage:dashboard -- --serve.`,
          true,
        );
      } finally {
        b.disabled = false;
      }
    })();
  });
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => renderTrend(selected()));
  });
  populateFilters();
  range(30);
}
void main().catch((error: unknown) => {
  const target = document.getElementById('message');
  if (target) {
    target.textContent = `Could not load the offline usage report: ${error instanceof Error ? error.message : String(error)}`;
    target.className = 'error';
  }
});
