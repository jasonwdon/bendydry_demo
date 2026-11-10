import { loadModel } from './generator.js?v=6';

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

const CHAR_MS = 35;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let typing;

// Type every name in one character at a time, all lines in step.
// Each line holds a shown part and a hidden rest, so wrapping never shifts.
function show(names) {
  clearInterval(typing);
  const lines = names.map((name) => {
    const li = document.createElement('li');
    const shown = document.createElement('span');
    const rest = document.createElement('span');
    rest.className = 'unshown';
    rest.textContent = name;
    li.append(shown, rest);
    return { name, li, shown, rest };
  });
  list.replaceChildren(...lines.map((l) => l.li));
  const longest = Math.max(...names.map((n) => n.length));
  if (reduceMotion.matches) {
    lines.forEach((l) => { l.shown.textContent = l.name; l.rest.textContent = ''; });
    return;
  }
  list.setAttribute('aria-busy', 'true');
  let i = 0;
  typing = setInterval(() => {
    i += 1;
    for (const l of lines) {
      l.shown.textContent = l.name.slice(0, i);
      l.rest.textContent = l.name.slice(i);
    }
    if (i >= longest) {
      clearInterval(typing);
      list.setAttribute('aria-busy', 'false');
    }
  }, CHAR_MS);
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
  .then((m) => {
    model = m;
    button.disabled = false;
    button.textContent = 'Generate names';
  })
  .catch((err) => {
    button.textContent = 'Unavailable';
    show([err.message]);
  });
