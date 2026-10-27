"""
Uqura Nodes ML Engine — app_train.py
====================================
Loads WELFake_Dataset.csv, preprocesses the corpus, and trains a real
production Logistic Regression classifier with TF-IDF vectorization.

Artifacts generated in models/:
  - vectorizer.joblib : Fitted TfidfVectorizer (5,000 features, unigram + bigram)
  - model.joblib      : Trained LogisticRegression classifier with calibrated probabilities
  - metrics.json       : Validation metrics, confusion matrix, top discriminative tokens
"""

import os
import json
import time
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

DATASET_PATH = "WELFake_Dataset.csv"
OUTPUT_DIR   = "models"
MAX_FEATURES = 5000
RANDOM_STATE = 42

def train_engine():
    start_total = time.time()
    print("=" * 64)
    print("  UQURA NODES // ML BACKEND TRAINING PIPELINE")
    print("  Model: TF-IDF (5,000 features) + Logistic Regression (L2)")
    print("=" * 64)

    # 1. Load Data
    print(f"\n[1/6] Ingesting dataset from '{DATASET_PATH}'...")
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset '{DATASET_PATH}' not found in current workspace.")
    
    t0 = time.time()
    df = pd.read_csv(DATASET_PATH)
    print(f"      Loaded {len(df):,} raw records in {time.time() - t0:.2f}s.")

    # 2. Preprocess & Clean
    print("\n[2/6] Sanitizing text content and handling null values...")
    df["title"] = df["title"].fillna("")
    df["text"]  = df["text"].fillna("")
    df.dropna(subset=["label"], inplace=True)
    df["content"] = (df["title"] + " " + df["text"]).str.strip()
    
    # Remove empty text samples
    df = df[df["content"] != ""].reset_index(drop=True)
    df["label"] = df["label"].astype(int)
    
    label_dist = df["label"].value_counts().to_dict()
    real_cnt = label_dist.get(0, 0)
    fake_cnt = label_dist.get(1, 0)
    print(f"      Usable records : {len(df):,}")
    print(f"      Class 0 (Real) : {real_cnt:,} ({real_cnt/len(df)*100:.1f}%)")
    print(f"      Class 1 (Fake) : {fake_cnt:,} ({fake_cnt/len(df)*100:.1f}%)")

    X = df["content"].values
    y = df["label"].values

    # 3. Stratified Train / Test Split
    print("\n[3/6] Generating 80/20 stratified train/test split...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )
    print(f"      Training set   : {len(X_train):,} samples")
    print(f"      Evaluation set : {len(X_test):,} samples")

    # 4. TF-IDF Vectorization
    print(f"\n[4/6] Fitting TF-IDF Vectorizer (max_features={MAX_FEATURES}, ngrams=(1,2))...")
    t_vec = time.time()
    vectorizer = TfidfVectorizer(
        max_features=MAX_FEATURES,
        stop_words="english",
        sublinear_tf=True,
        ngram_range=(1, 2)
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec  = vectorizer.transform(X_test)
    print(f"      Vocabulary size : {len(vectorizer.vocabulary_):,} features")
    print(f"      Vectorized in   : {time.time() - t_vec:.2f}s")

    # 5. Train Logistic Regression
    print("\n[5/6] Training Logistic Regression classifier (solver='lbfgs', max_iter=300)...")
    t_clf = time.time()
    clf = LogisticRegression(
        max_iter=300,
        C=1.0,
        random_state=RANDOM_STATE,
        solver="lbfgs",
        n_jobs=-1
    )
    clf.fit(X_train_vec, y_train)
    print(f"      Model converged in {time.time() - t_clf:.2f}s")

    # 6. Evaluation
    print("\n[6/6] Computing evaluation metrics on hold-out validation set...")
    y_pred = clf.predict(X_test_vec)
    y_probs = clf.predict_proba(X_test_vec)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred).tolist()

    print(f"\n" + "-" * 50)
    print(f"  ACCURACY  : {acc * 100:.2f}%")
    print(f"  PRECISION : {prec * 100:.2f}%")
    print(f"  RECALL    : {rec * 100:.2f}%")
    print(f"  F1-SCORE  : {f1 * 100:.2f}%")
    print("-" * 50)
    print(classification_report(y_test, y_pred, target_names=["Real News (0)", "Fake News (1)"]))

    # Extract top indicative features
    feat_names = vectorizer.get_feature_names_out()
    coefs = clf.coef_[0]
    
    # Positive coef -> class 1 (Fake), Negative coef -> class 0 (Real)
    top_fake_idx = np.argsort(coefs)[-25:][::-1]
    top_real_idx = np.argsort(coefs)[:25]

    top_fake_tokens = [{"token": feat_names[i], "weight": round(float(coefs[i]), 4)} for i in top_fake_idx]
    top_real_tokens = [{"token": feat_names[i], "weight": round(float(abs(coefs[i])), 4)} for i in top_real_idx]

    # Save Artifacts
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    vec_path = os.path.join(OUTPUT_DIR, "vectorizer.joblib")
    model_path = os.path.join(OUTPUT_DIR, "model.joblib")
    metrics_path = os.path.join(OUTPUT_DIR, "metrics.json")

    print(f"\n[SAVE] Exporting artifacts to '{OUTPUT_DIR}/'...")
    joblib.dump(vectorizer, vec_path, compress=3)
    joblib.dump(clf, model_path, compress=3)

    metrics_payload = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "model_architecture": "TfidfVectorizer + LogisticRegression",
        "dataset": DATASET_PATH,
        "total_records": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": cm,
        "top_fake_tokens": top_fake_tokens,
        "top_real_tokens": top_real_tokens
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    total_time = time.time() - start_total
    print(f"       -> Saved {vec_path}")
    print(f"       -> Saved {model_path}")
    print(f"       -> Saved {metrics_path}")
    print(f"\n[SUCCESS] Pipeline completed successfully in {total_time:.2f}s.\n")

if __name__ == "__main__":
    train_engine()
