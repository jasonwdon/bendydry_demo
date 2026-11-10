// Runs the trained character-level LSTM in plain JavaScript, no server needed.
// The model reads the last 10 characters and predicts the next one; names are
// separated by newlines, so each newline ends one name.

// A few names from the training data, used to warm the model up before each name.
const PRIMERS = [
  'Benedict Cumberbatch', 'Benedryl Cabbagepatch', 'Bandersnatch Cumberbund',
  'Buttercup Candycrush', 'Bumblebee Baggageclaim', 'Benadryl Slumbercatch',
  'Balladry Caterwaul', 'Brendadirk Cramplescrunch', 'Burlington Coatfactory',
  'Cucumber Bandersnatch',
];

// The original 2019 model used Keras's old hard sigmoid; models from training/ use a plain sigmoid.
const GATES = {
  hard_sigmoid: (x) => Math.max(0, Math.min(1, 0.2 * x + 0.5)),
  sigmoid: (x) => 1 / (1 + Math.exp(-x)),
};

export class NameModel {
  constructor(m) {
    this.chars = m.chars;
    this.index = new Map(m.chars.map((c, i) => [c, i]));
    this.window = m.window;
    this.units = m.units;
    this.gate = GATES[m.recurrent_activation || 'hard_sigmoid'] || GATES.hard_sigmoid;
    this.kernel = Float32Array.from(m.lstm_kernel);
    this.recurrent = Float32Array.from(m.lstm_recurrent);
    this.bias = Float32Array.from(m.lstm_bias);
    this.denseK = Float32Array.from(m.dense_kernel);
    this.denseB = Float32Array.from(m.dense_bias);
  }

  // Characters the model has never seen are dropped.
  clean(text) {
    return [...text].filter((c) => this.index.has(c)).join('');
  }

  // Logits for the character that follows `text` (only its last `window` chars count).
  logits(text) {
    const u = this.units, g = 4 * u;
    let h = new Float32Array(u), c = new Float32Array(u);
    const z = new Float32Array(g);
    for (const ch of [...text].slice(-this.window)) {
      const x = this.index.get(ch);
      for (let j = 0; j < g; j++) {
        let s = this.bias[j] + this.kernel[x * g + j];
        for (let k = 0; k < u; k++) s += h[k] * this.recurrent[k * g + j];
        z[j] = s;
      }
      const hNew = new Float32Array(u), cNew = new Float32Array(u);
      for (let k = 0; k < u; k++) {
        const i = this.gate(z[k]);
        const f = this.gate(z[u + k]);
        const cand = Math.tanh(z[2 * u + k]);
        const o = this.gate(z[3 * u + k]);
        cNew[k] = f * c[k] + i * cand;
        hNew[k] = o * Math.tanh(cNew[k]);
      }
      h = hNew; c = cNew;
    }
    const n = this.chars.length;
    const out = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      let s = this.denseB[j];
      for (let k = 0; k < u; k++) s += h[k] * this.denseK[k * n + j];
      out[j] = s;
    }
    return out;
  }

  // Picks the next character; lower temperature plays it safe, higher gets weirder.
  sample(text, temperature, rand = Math.random) {
    const l = this.logits(text);
    const t = Math.max(temperature, 0.01);
    let max = -Infinity;
    for (const v of l) max = Math.max(max, v / t);
    const p = Array.from(l, (v) => Math.exp(v / t - max));
    const sum = p.reduce((a, b) => a + b, 0);
    let r = rand() * sum;
    for (let j = 0; j < p.length; j++) {
      r -= p[j];
      if (r <= 0) return this.chars[j];
    }
    return this.chars[p.length - 1];
  }

  // One name, optionally forced to start with `prefix`.
  generateOne({ temperature = 0.7, prefix = '', maxLength = 30, rand = Math.random } = {}) {
    const primer = PRIMERS[Math.floor(rand() * PRIMERS.length)];
    const start = this.clean(prefix);
    let text = primer + '\n' + start;
    let name = start;
    while (name.length < maxLength) {
      const ch = this.sample(text, temperature, rand);
      if (ch === '\n') break;
      name += ch;
      text += ch;
    }
    return name.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  }

  generate({ count = 10, unique = true, ...opts } = {}) {
    const names = [];
    const seen = new Set();
    for (let tries = 0; names.length < count && tries < count * 10; tries++) {
      const name = this.generateOne(opts);
      if (!name) continue;
      const key = name.toLowerCase();
      if (unique && seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
    return names;
  }
}

export async function loadModel(url = 'model.json') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load the model (${res.status})`);
  return new NameModel(await res.json());
}
