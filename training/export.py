"""Turn a trained model into the model.json the web page loads.

    python3 export.py                  # model.keras from train.py, writes ../model.json
    python3 export.py path/to/model.keras --out somewhere.json
"""
import argparse
import ast
import json
import pathlib

import tensorflow as tf

HERE = pathlib.Path(__file__).resolve().parent


def rounded(a):
    return [round(float(v), 5) for v in a.ravel()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("model", nargs="?", default=HERE / "model.keras", type=pathlib.Path)
    parser.add_argument("--out", default=HERE.parent / "model.json", type=pathlib.Path)
    args = parser.parse_args()

    chars = ast.literal_eval(args.model.with_suffix(".chars.txt").read_text(encoding="utf-8"))
    model = tf.keras.models.load_model(args.model)
    lstm = next(l for l in model.layers if isinstance(l, tf.keras.layers.LSTM))
    dense = next(l for l in model.layers if isinstance(l, tf.keras.layers.Dense))
    kernel, recurrent, bias = lstm.get_weights()
    dense_k, dense_b = dense.get_weights()

    out = {
        "chars": chars,
        "window": lstm.input.shape[1],
        "units": lstm.units,
        "recurrent_activation": lstm.recurrent_activation.__name__,
        "lstm_kernel": rounded(kernel),
        "lstm_recurrent": rounded(recurrent),
        "lstm_bias": rounded(bias),
        "dense_kernel": rounded(dense_k),
        "dense_bias": rounded(dense_b),
    }
    args.out.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {args.out} ({args.out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
