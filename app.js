import { loadModel } from './generator.js?v=3';

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

async function generate() {
  button.disabled = true;
  button.textContent = 'Thinking…';
  // Let the button repaint before the (short) blocking work.
  await new Promise((r) => setTimeout(r, 20));
  const names = model.generate({
    temperature: Number($('temperature').value),
    count: 10,
    maxLength: Number($('max-length').value),
    prefix: $('prefix').value,
  });
  show(names.length ? names : ['Nothing came out. Try a different start.']);
  button.disabled = false;
  button.textContent = 'Generate names';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (model) generate();
});

loadModel('model.json?v=3')
  .then((m) => { model = m; return generate(); })
  .catch((err) => {
    button.textContent = 'Unavailable';
    show([err.message]);
  });
