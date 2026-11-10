"""Train the Bendydry Cumberban name model.

Reads names.txt (one name per line), learns to predict the next character
from the previous 10, and saves model.keras. Run export.py afterwards to turn
it into the model.json the web page loads.

    pip install tensorflow
    python3 train.py
"""
import argparse
import pathlib

import numpy as np
import tensorflow as tf

HERE = pathlib.Path(__file__).resolve().parent
WINDOW = 10
UNITS = 64


def load_text(path):
    text = path.read_text(encoding="utf-8").replace("\r", "")
    return text.strip("\n") + "\n"


def make_dataset(text, chars):
    index = {c: i for i, c in enumerate(chars)}
    # Wrap around so the first names also get a full window of context.
    padded = text[-WINDOW:] + text
    count = len(text)
    x = np.zeros((count, WINDOW, len(chars)), dtype=np.float32)
    y = np.zeros((count,), dtype=np.int32)
    for i in range(count):
        for t, ch in enumerate(padded[i:i + WINDOW]):
            x[i, t, index[ch]] = 1
        y[i] = index[padded[i + WINDOW]]
    return x, y


def build_model(num_chars):
    return tf.keras.Sequential([
        tf.keras.Input(shape=(WINDOW, num_chars)),
        tf.keras.layers.LSTM(UNITS),
        tf.keras.layers.Dense(num_chars, activation="softmax"),
    ])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=HERE / "names.txt", type=pathlib.Path)
    parser.add_argument("--out", default=HERE / "model.keras", type=pathlib.Path)
    parser.add_argument("--epochs", default=60, type=int)
    args = parser.parse_args()

    text = load_text(args.data)
    chars = sorted(set(text))
    x, y = make_dataset(text, chars)
    print(f"{text.count(chr(10))} names, {len(chars)} characters, {len(x)} training windows")

    model = build_model(len(chars))
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy")
    model.fit(x, y, batch_size=128, epochs=args.epochs, shuffle=True)

    model.save(args.out)
    (args.out.with_suffix(".chars.txt")).write_text(repr(chars), encoding="utf-8")
    print(f"saved {args.out}")


if __name__ == "__main__":
    main()
