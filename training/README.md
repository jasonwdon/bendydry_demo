# Training

Everything needed to retrain the Bendydry Cumberban name model.

- `names.txt`: the training data, a few hundred hand written alternatives to "Benedict Cumberbatch", one per line
- `train.py`: trains a small LSTM (64 units) that predicts the next character from the previous 10
- `export.py`: turns the trained model into the `model.json` the web page loads

The original 2019 training script didn't survive, so `train.py` rebuilds the same setup: the same data, the same character set, a 10 character window and a 64 unit LSTM. The model on the live page is still the original one.

## Retrain

```
pip install tensorflow
python3 train.py
python3 export.py
```

`train.py` saves `model.keras` here, and `export.py` writes it to `../model.json`, replacing the model the page uses. Training takes under a minute on a laptop. Use `python3 train.py --epochs 100` to train longer.

To try it, serve the folder above this one and open the page:

```
cd ..
python3 -m http.server 8080
```

Then open http://localhost:8080
