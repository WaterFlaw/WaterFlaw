const loader = document.getElementById('loader');
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  loader.hidden = true;
} else {
  window.setTimeout(() => {
    loader.classList.add('is-leaving');
    window.setTimeout(() => { loader.hidden = true; }, 600);
  }, 2600);
}

const state = {
  scenario: 'regular',
  period: 'day',
  selectedNode: 'S04',
  historyFilter: 'all',
  scheduled: false,
};

const number = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const svgNS = 'http://www.w3.org/2000/svg';
const dailyUpstream = [49.2, 48.9, 49.6, 51.1, 52.4, 53.5, 54.0, 55.1, 54.6, 53.3, 51.7, 50.1];
const weeklyUpstream = [50.8, 52.0, 51.2, 49.9, 53.1, 51.7, 51.3];
const series = {
  day: { labels: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'], upstream: dailyUpstream },
  week: { labels: ['Gio', 'Ven', 'Sab', 'Dom', 'Lun', 'Mar', 'Mer'], upstream: weeklyUpstream },
};
const weeklyVolume = [152, 157, 155, 161, 159, 164, 165];
const fixedInterventions = [
  { title: 'Verifica del giunto', detail: 'S03–S05 · 15 nov 2026', node: 'S03', status: 'Concluso' },
  { title: 'Taratura del misuratore', detail: 'S01 · 10 nov 2026', node: 'S01', status: 'Concluso' },
  { title: 'Controllo della valvola', detail: 'S04–S06 · 4 nov 2026', node: 'S04', status: 'Concluso' },
  { title: 'Sostituzione del raccordo', detail: 'S08–S04 · 22 ott 2026', node: 'S08', status: 'Concluso' },
  { title: 'Ispezione periodica', detail: 'S03–S05 · 8 ott 2026', node: 'S03', status: 'Concluso' },
];
const nodes = {
  S01: { name: 'Ingresso', flow: 115.0, pressure: 4.2, downstream: 'S02', downstreamFlow: 114.3, context: 'Tratto verso il collettore centrale' },
  S02: { name: 'Collettore centrale', flow: 114.3, pressure: 4.0, downstream: 'S07 + S08', downstreamFlow: 113.9, context: 'Distribuzione ai collettori nord e sud' },
  S07: { name: 'Collettore nord', flow: 42.3, pressure: 3.8, downstream: 'S03 + S09', downstreamFlow: 42.0, context: 'Distribuzione su due rami a nord' },
  S03: { name: 'Ramo nord', flow: 29.8, pressure: 3.7, downstream: 'S05', downstreamFlow: 29.5, context: 'Tratto verso l’uscita nord' },
  S05: { name: 'Uscita nord', flow: 29.5, pressure: 3.4, downstream: null, context: 'Fine del ramo nord' },
  S09: { name: 'Uscita laterale', flow: 12.2, pressure: 3.5, downstream: null, context: 'Fine della diramazione nord' },
  S08: { name: 'Collettore sud', flow: 71.6, pressure: 3.7, downstream: 'S04 + S10', downstreamFlow: 71.3, context: 'Distribuzione su due rami a sud' },
  S04: { name: 'Ramo sud', flow: 51.3, pressure: 3.6, downstream: 'S06', downstreamFlow: 50.9, context: 'Tratto verso l’uscita sud' },
  S06: { name: 'Uscita sud', flow: 50.9, pressure: 3.1, downstream: null, context: 'Fine del ramo sud' },
  S10: { name: 'Ramo servizi', flow: 20.0, pressure: 3.4, downstream: 'S11', downstreamFlow: 19.8, context: 'Tratto verso l’uscita servizi' },
  S11: { name: 'Uscita servizi', flow: 19.8, pressure: 3.1, downstream: null, context: 'Fine del ramo servizi' },
};

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function downstreamSeries(period) {
  const values = series[period].upstream;
  return values.map((value, index) => {
    const leakStarts = period === 'day' ? index >= 7 : index === values.length - 1;
    const difference = state.scenario === 'leak' && leakStarts ? 7.1 : 0.4;
    return +(value - difference).toFixed(1);
  });
}

function renderFlowChart() {
  const chart = document.querySelector('[data-flow-chart]');
  const { labels, upstream } = series[state.period];
  const downstream = downstreamSeries(state.period);
  const left = 42, right = 704, top = 17, bottom = 238;
  const x = (index) => left + index * (right - left) / (labels.length - 1);
  const y = (value) => bottom - (value - 40) / 20 * (bottom - top);
  const path = (values) => values.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ');
  chart.replaceChildren();

  for (const tick of [40, 45, 50, 55, 60]) {
    chart.append(svgElement('line', { x1: left, y1: y(tick), x2: right, y2: y(tick), class: 'chart-grid-line' }));
    const label = svgElement('text', { x: 34, y: y(tick) + 4, 'text-anchor': 'end', class: 'chart-axis-label' });
    label.textContent = tick;
    chart.append(label);
  }
  labels.forEach((label, index) => {
    if (state.period === 'day' && index % 3 !== 0 && index !== labels.length - 1) return;
    const text = svgElement('text', { x: x(index), y: 266, 'text-anchor': 'middle', class: 'chart-axis-label' });
    text.textContent = label;
    chart.append(text);
  });
  chart.append(svgElement('path', { d: `${path(upstream)} L ${right} ${bottom} L ${left} ${bottom} Z`, class: 'chart-area' }));
  chart.append(svgElement('path', { d: path(upstream), class: 'chart-line-upstream' }));
  chart.append(svgElement('path', { d: path(downstream), class: 'chart-line-downstream' }));
  [upstream, downstream].forEach((values, seriesIndex) => {
    values.forEach((value, index) => {
      const dot = svgElement('circle', { cx: x(index), cy: y(value), r: 3.5, class: `chart-point ${seriesIndex ? 'downstream' : 'upstream'}` });
      const title = svgElement('title');
      title.textContent = `${labels[index]} · ${seriesIndex ? 'S06' : 'S04'}: ${number.format(value)} L/min`;
      dot.append(title);
      chart.append(dot);
    });
  });
  chart.setAttribute('aria-label', `Portata simulata sul tratto S04–S06, ${state.period === 'day' ? 'ultime 24 ore' : 'ultimi sette giorni'}`);
}

function renderBars(container, labels, values, maximum, unit, showValues = false) {
  container.replaceChildren();
  values.forEach((value, index) => {
    const column = document.createElement('div');
    column.className = 'bar-column';
    column.setAttribute('aria-label', `${labels[index]}: ${value} ${unit}`);
    column.title = `${labels[index]} · ${value} ${unit}`;
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    const height = Math.max(2, value / maximum * 100);
    fill.style.height = `${height}%`;
    track.append(fill);
    if (showValues) {
      const count = document.createElement('strong');
      count.className = 'bar-value';
      count.style.bottom = `calc(${height}% + 7px)`;
      count.textContent = value;
      track.append(count);
    }
    const label = document.createElement('span');
    label.className = 'bar-column-label';
    label.textContent = labels[index];
    column.append(track, label);
    container.append(column);
  });
}

function renderOverview() {
  document.querySelector('[data-metric="alerts"]').textContent = state.scenario === 'leak' ? '1' : '0';
  document.querySelector('[data-alert-caption]').textContent = state.scenario === 'leak'
    ? 'S04–S06 · controllo consigliato' : 'Nessuna anomalia rilevata';
  renderFlowChart();
}

function currentNode(code) {
  const node = { ...nodes[code] };
  if (state.scenario === 'leak' && code === 'S04') node.downstreamFlow = 44.2;
  if (state.scenario === 'leak' && code === 'S06') node.flow = 44.2;
  return node;
}

function renderNetwork() {
  const alert = state.scenario === 'leak';
  document.querySelector('[data-alert-edge]').classList.toggle('is-alert', alert);
  const networkStatus = document.querySelector('[data-network-status]');
  networkStatus.textContent = alert ? '1 tratto da verificare' : 'Regolare';
  networkStatus.classList.toggle('is-alert', alert);
  document.querySelectorAll('[data-node]').forEach((button) => {
    const selected = button.dataset.node === state.selectedNode;
    button.classList.toggle('is-selected', selected);
    button.classList.toggle('is-alert', alert && ['S04', 'S06'].includes(button.dataset.node));
    button.setAttribute('aria-pressed', String(selected));
  });

  const node = currentNode(state.selectedNode);
  const focusAlert = alert && state.selectedNode === 'S04';
  const selectedAlert = alert && ['S04', 'S06'].includes(state.selectedNode);
  const hasDownstream = node.downstream !== null;
  const diff = hasDownstream ? +(node.flow - node.downstreamFlow).toFixed(1) : null;
  document.querySelector('[data-detail-code]').textContent = state.selectedNode;
  document.querySelector('[data-detail-name]').textContent = node.name;
  document.querySelector('[data-detail-context]').textContent = node.context;
  document.querySelector('[data-detail-flow]').textContent = number.format(node.flow);
  document.querySelector('[data-detail-pressure]').textContent = `${number.format(node.pressure)} bar`;
  document.querySelector('[data-detail-down-label]').textContent = hasDownstream
    ? `Misura a valle · ${node.downstream}` : 'Misura a valle';
  document.querySelector('[data-detail-down]').textContent = hasDownstream
    ? `${number.format(node.downstreamFlow)} L/min` : 'Fine tratto';
  document.querySelector('[data-detail-diff]').textContent = hasDownstream
    ? `${number.format(diff)} L/min` : '—';
  const status = document.querySelector('[data-detail-status]');
  status.textContent = selectedAlert ? 'Da verificare' : 'Regolare';
  status.classList.toggle('is-alert', selectedAlert);
  const action = document.querySelector('[data-schedule]');
  action.hidden = !focusAlert;
  action.disabled = state.scheduled;
  action.firstChild.textContent = state.scheduled ? 'Verifica programmata ' : 'Programma una verifica ';
  action.querySelector('[aria-hidden]').textContent = state.scheduled ? '✓' : '↗';
}

function historyItems() {
  const items = [...fixedInterventions];
  if (state.scenario === 'leak') {
    items.unshift({
      title: 'Verifica del tratto S04–S06', detail: 'S04–S06 · 18 nov 2026', node: 'S04',
      status: state.scheduled ? 'Programmato' : 'Da verificare',
    });
  }
  return items;
}

function renderHistory() {
  const list = document.querySelector('[data-history-list]');
  const items = historyItems().filter((item) => state.historyFilter === 'all'
    || (state.historyFilter === 'done' ? item.status === 'Concluso' : item.status !== 'Concluso'));
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nessun intervento in questa vista.';
    list.append(empty);
  }
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = `history-item${item.status === 'Concluso' ? '' : ' is-open'}`;
    const symbol = document.createElement('span');
    symbol.className = 'history-symbol';
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = item.status === 'Concluso' ? '✓' : '•';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.title;
    const detail = document.createElement('p');
    detail.textContent = `${item.detail} · ${item.status}`;
    copy.append(title, detail);
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.dataset.jumpNode = item.node;
    jump.textContent = 'Apri rete ↗';
    row.append(symbol, copy, jump);
    list.append(row);
  });
  renderBars(document.querySelector('[data-interventions-chart]'),
    ['Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov'], [1, 2, 1, 3, 2, 2 + Number(state.scheduled)], 4, 'interventi', true);
}

function renderAll() {
  renderOverview();
  renderNetwork();
  renderHistory();
  document.querySelectorAll('[data-scenario]').forEach((button) =>
    button.setAttribute('aria-pressed', String(button.dataset.scenario === state.scenario)));
}

function centerSelectedNode() {
  const viewport = document.querySelector('.graph-viewport');
  const selected = document.querySelector('.graph-node.is-selected');
  if (!selected || viewport.clientWidth === 0 || viewport.scrollWidth <= viewport.clientWidth) return;
  viewport.scrollLeft = selected.offsetLeft - viewport.clientWidth / 2;
}

function activateTab() {
  const tab = ['panoramica', 'rete', 'interventi'].includes(location.hash.slice(1))
    ? location.hash.slice(1) : 'panoramica';
  document.querySelectorAll('[data-view]').forEach((view) => { view.hidden = view.dataset.view !== tab; });
  document.querySelectorAll('[data-tab-link]').forEach((link) => {
    if (link.dataset.tabLink === tab) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (tab === 'rete') requestAnimationFrame(centerSelectedNode);
}

document.querySelectorAll('[data-scenario]').forEach((button) => button.addEventListener('click', () => {
  state.scenario = button.dataset.scenario;
  state.scheduled = false;
  renderAll();
}));
document.querySelectorAll('[data-period]').forEach((button) => button.addEventListener('click', () => {
  state.period = button.dataset.period;
  document.querySelectorAll('[data-period]').forEach((option) =>
    option.setAttribute('aria-pressed', String(option.dataset.period === state.period)));
  renderFlowChart();
}));
document.querySelectorAll('[data-node]').forEach((button) => button.addEventListener('click', () => {
  state.selectedNode = button.dataset.node;
  renderNetwork();
  centerSelectedNode();
}));
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  state.historyFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach((option) =>
    option.setAttribute('aria-pressed', String(option.dataset.filter === state.historyFilter)));
  renderHistory();
}));
document.querySelector('[data-schedule]').addEventListener('click', () => {
  state.scheduled = true;
  renderNetwork();
  renderHistory();
});
document.querySelector('[data-history-list]').addEventListener('click', (event) => {
  const button = event.target.closest('[data-jump-node]');
  if (!button) return;
  state.selectedNode = button.dataset.jumpNode;
  renderNetwork();
  location.hash = 'rete';
});
window.addEventListener('hashchange', activateTab);

renderBars(document.querySelector('[data-volume-chart]'), ['Gio', 'Ven', 'Sab', 'Dom', 'Lun', 'Mar', 'Mer'], weeklyVolume, 180, 'm³');
renderAll();
activateTab();
