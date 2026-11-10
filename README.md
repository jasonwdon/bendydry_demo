# Bendydry Cumberban demo

Makes up names for Benedict Cumberbatch with a tiny neural network, right in
your browser: https://jasonwdon.github.io/bendydry_demo/

The model is a small character-level LSTM (64 units, 10-character window)
trained on a few hundred hand-written alternatives. `generator.js` runs it in
plain JavaScript from the weights in `model.json`, so there's no server and no
build step.

Controls: weirdness (sampling temperature), how many names, max length, and an
optional starting text.

## Run it locally

```
python3 -m http.server 8080
```

Then open http://localhost:8080
