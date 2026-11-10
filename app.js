import { loadModel } from './generator.js?v=4';

const $ = (id) => document.getElementById(id);
const form = $('controls');
const button = $('generate');
const list = $('names');

for (const id of ['temperature', 'max-length']) {
  const input = $(id);
  const out = $(`${id}-out`);
  if (!input || !out) continue;
  input.addEventListener('input', () => { out.textContent = input.value; });
}

function show(names) {
  list.replaceChildren(...names.map((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    return li;
  }));
}

let model;
const MIN_LOADING_MS = 500;

async function generate() {
  button.disabled = true;
  button.textContent = 'Thinking…';
  const started = performance.now();
  // Let the button repaint before the (short) blocking work.
  await new Promise((r) => setTimeout(r, 20));
  const names = model.generate({
    temperature: Number($('temperature').value),
    count: 10,
    maxLength: Number($('max-length').value),
    prefix: $('prefix').value,
  });
  // Keep the loading state up long enough to read, so the button doesn't flash.
  const left = MIN_LOADING_MS - (performance.now() - started);
  if (left > 0) await new Promise((r) => setTimeout(r, left));
  show(names.length ? names : ['Nothing came out. Try a different start.']);
  button.disabled = false;
  button.textContent = 'Generate names';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (model) generate();
});

loadModel('model.json?v=4')
  .then((m) => { model = m; return generate(); })
  .catch((err) => {
    button.textContent = 'Unavailable';
    show([err.message]);
  });
