"""
NoCap.AI - Model Training & Serialization Engine
Dataset: WELFake_Dataset.csv (72,134 rows)
Target: Fake News Detection (Binary Classification)
0: Authentic / Real News
1: Fabricated / Fake News (Threat)
"""

import os
import json
import time
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, PassiveAggressiveClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report

def main():
    print("=" * 60)
    print("NoCap.AI // ML ENGINE INITIALIZATION")
    print("=" * 60)
    
    start_time = time.time()
    csv_path = "WELFake_Dataset.csv"
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    # 1. Load Dataset
    print(f"[*] Ingesting telemetry feed from '{csv_path}'...")
    df = pd.read_csv(csv_path)
    total_raw = len(df)
    print(f"[*] Ingested {total_raw:,} records.")

    # 2. Handle Missing Values
    print("[*] Inspecting null distributions...")
    null_title = df['title'].isnull().sum()
    null_text = df['text'].isnull().sum()
    print(f"    - Missing titles: {null_title:,}")
    print(f"    - Missing body texts: {null_text:,}")

    # Impute missing values with empty string and combine features
    df['title'] = df['title'].fillna('')
    df['text'] = df['text'].fillna('')
    df['content'] = (df['title'] + ' ' + df['text']).str.strip()

    # Filter out empty records if any
    valid_mask = df['content'] != ''
    df = df[valid_mask].reset_index(drop=True)
    print(f"[*] Usable corpus size: {len(df):,} articles.")
    
    label_counts = df['label'].value_counts().to_dict()
    print(f"[*] Class distribution: Real (0): {label_counts.get(0, 0):,}, Fake (1): {label_counts.get(1, 0):,}")

    X = df['content'].values
    y = df['label'].values.astype(int)

    # 3. Train / Test Split
    print("[*] Partitioning dataset (80% Train, 20% Holdout Test, Stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"    - Training nodes: {len(X_train):,}")
    print(f"    - Testing nodes: {len(X_test):,}")

    # 4. Text Vectorization & Model Pipeline
    print("[*] Constructing TF-IDF Vectorizer with Stopword Elimination...")
    vectorizer = TfidfVectorizer(
        max_features=50000,
        stop_words='english',
        ngram_range=(1, 2),
        sublinear_tf=True
    )

    print("[*] Initializing Logistic Regression classifier (C=2.0, max_iter=1000)...")
    classifier = LogisticRegression(
        C=2.0,
        max_iter=1000,
        random_state=42,
        solver='lbfgs'
    )

    pipeline = Pipeline([
        ('tfidf', vectorizer),
        ('clf', classifier)
    ])

    print("[*] Training end-to-end pipeline...")
    t_train_start = time.time()
    pipeline.fit(X_train, y_train)
    train_duration = time.time() - t_train_start
    print(f"[+] Model training completed in {train_duration:.2f} seconds.")

    # 5. Model Evaluation
    print("[*] Running inference on holdout test set...")
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n" + "=" * 40)
    print("NoCap.AI // PERFORMANCE BENCHMARK")
    print("=" * 40)
    print(f"Accuracy : {accuracy * 100:.2f}%")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall   : {recall * 100:.2f}%")
    print(f"F1-Score : {f1 * 100:.2f}%")
    print("\nConfusion Matrix [[TN, FP], [FN, TP]]:")
    print(f"  {cm}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Real (Authentic)', 'Fake (Threat)']))

    # 6. Extract Top Informative Features for Explainability
    feature_names = pipeline.named_steps['tfidf'].get_feature_names_out()
    coefs = pipeline.named_steps['clf'].coef_[0]
    
    # Positive coef -> Class 1 (Fake News / Threat indicators)
    # Negative coef -> Class 0 (Real News / Authenticity indicators)
    top_fake_indices = np.argsort(coefs)[-30:][::-1]
    top_real_indices = np.argsort(coefs)[:30]

    top_fake_tokens = [{"word": feature_names[i], "weight": round(float(coefs[i]), 4)} for i in top_fake_indices]
    top_real_tokens = [{"word": feature_names[i], "weight": round(float(-coefs[i]), 4)} for i in top_real_indices]

    # 7. Select Curated Sample Articles for 1-Click Streamlit Presets
    print("[*] Curating realistic sample test cases for SOC interactive testing...")
    sample_presets = []
    
    # Find genuine high-confidence Real and Fake samples from test set
    test_df = pd.DataFrame({
        'content': X_test,
        'label': y_test,
        'pred': y_pred,
        'prob_fake': y_prob[:, 1]
    })

    # Sample 1: Breaking Reuters wire (Real)
    real_sample_1 = test_df[(test_df['label'] == 0) & (test_df['prob_fake'] < 0.05) & (test_df['content'].str.contains('Reuters'))].iloc[0]
    sample_presets.append({
        "category": "Verified Wire (Reuters)",
        "label_name": "Authentic",
        "ground_truth": 0,
        "title": "Reuters Diplomatic Dispatch",
        "content": real_sample_1['content'][:2500]
    })

    # Sample 2: Domestic Investigative Report (Real)
    real_sample_2 = test_df[(test_df['label'] == 0) & (test_df['prob_fake'] < 0.05) & (~test_df['content'].str.contains('Reuters'))].iloc[0]
    sample_presets.append({
        "category": "Investigative Public Policy (Real)",
        "label_name": "Authentic",
        "ground_truth": 0,
        "title": "Policy & Congressional Analysis",
        "content": real_sample_2['content'][:2500]
    })

    # Sample 3: Sensationalist Conspiracy / Clickbait (Fake)
    fake_sample_1 = test_df[(test_df['label'] == 1) & (test_df['prob_fake'] > 0.95)].iloc[0]
    sample_presets.append({
        "category": "Clickbait Conspiracy Disinformation (Fake)",
        "label_name": "Fake News / Threat",
        "ground_truth": 1,
        "title": "Sensational Alert",
        "content": fake_sample_1['content'][:2500]
    })

    # Sample 4: Fabricated Political Scandal (Fake)
    fake_sample_2 = test_df[(test_df['label'] == 1) & (test_df['prob_fake'] > 0.95)].iloc[1]
    sample_presets.append({
        "category": "Fabricated Wire Hoax (Fake)",
        "label_name": "Fake News / Threat",
        "ground_truth": 1,
        "title": "Unverified Breaking Alert",
        "content": fake_sample_2['content'][:2500]
    })

    # 8. Save Artifacts using Joblib and JSON
    os.makedirs("saved_models", exist_ok=True)
    model_save_path = "saved_models/nocap_pipeline.joblib"
    metrics_save_path = "saved_models/model_metrics.json"
    samples_save_path = "saved_models/sample_articles.json"

    print(f"[*] Serializing pipeline to '{model_save_path}' with joblib...")
    joblib.dump(pipeline, model_save_path, compress=3)

    metrics_payload = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "dataset": csv_path,
        "total_records": total_raw,
        "usable_records": len(df),
        "class_distribution": {
            "real_articles": int(label_counts.get(0, 0)),
            "fake_articles": int(label_counts.get(1, 0))
        },
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": cm,
        "vocabulary_size": len(vectorizer.vocabulary_),
        "top_fake_indicators": top_fake_tokens,
        "top_real_indicators": top_real_tokens,
        "training_time_sec": round(train_duration, 2)
    }

    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    with open(samples_save_path, "w", encoding="utf-8") as f:
        json.dump(sample_presets, f, indent=2)

    total_time = time.time() - start_time
    print(f"[+] All artifacts successfully saved in 'saved_models/'.")
    print(f"[+] Total execution time: {total_time:.2f}s")
    print("=" * 60)

if __name__ == "__main__":
    main()
