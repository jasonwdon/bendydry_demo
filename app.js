import { loadModel } from './generator.js?v=7';

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
// Only typed characters are in the page, so a line wraps when the typing reaches it.
function show(names) {
  clearInterval(typing);
  const lines = names.map((name) => ({ name, li: document.createElement('li') }));
  list.replaceChildren(...lines.map((l) => l.li));
  const longest = Math.max(...names.map((n) => n.length));
  let i = reduceMotion.matches ? longest : 1;
  const draw = () => { for (const l of lines) l.li.textContent = l.name.slice(0, i); };
  draw();
  if (i >= longest) return;
  list.setAttribute('aria-busy', 'true');
  typing = setInterval(() => {
    i += 1;
    draw();
    if (i >= longest) {
      clearInterval(typing);
      list.setAttribute('aria-busy', 'false');
    }
  }, CHAR_MS);
}

// Start loading right away; a click before it's ready waits for it.
const modelReady = loadModel('model.json?v=4');
let failed = false;
const MIN_LOADING_MS = 500;

async function generate() {
  button.disabled = true;
  button.textContent = 'Thinking…';
  const started = performance.now();
  let model;
  try {
    model = await modelReady;
  } catch {
    return; // the load failure below shows "Unavailable"
  }
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
  if (!button.disabled && !failed) generate();
});

modelReady.catch((err) => {
  failed = true;
  button.disabled = true;
  button.textContent = 'Unavailable';
  show([err.message]);
});
