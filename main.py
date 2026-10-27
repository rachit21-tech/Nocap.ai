"""
NoCap FastAPI Backend — main.py
================================
Production FastAPI backend for Fake News Detection.
Loads TF-IDF Vectorizer and Logistic Regression model trained on WELFake_Dataset.csv.
Provides /api/analyze endpoint for real-time inference.
"""

import os
import re
import time
import joblib
import numpy as np
import pandas as pd
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

# -----------------------------------------------------------------------------
# 1. APPLICATION SETUP & CORS
# -----------------------------------------------------------------------------
app = FastAPI(
    title="NoCap Fake News Detection API",
    description="Real-time NLP classification using TF-IDF and Logistic Regression on WELFake Corpus",
    version="2.0.0"
)

# Enable CORS for Next.js / React frontend (localhost:3000, localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = "models"
VEC_PATH = os.path.join(MODELS_DIR, "vectorizer.joblib")
MODEL_PATH = os.path.join(MODELS_DIR, "model.joblib")
DATASET_PATH = "WELFake_Dataset.csv"

# Global model state
vectorizer: Optional[TfidfVectorizer] = None
model: Optional[LogisticRegression] = None

# -----------------------------------------------------------------------------
# 2. TRAINING & MODEL LOADING UTILITIES
# -----------------------------------------------------------------------------
def train_and_save_model():
    """Trains Logistic Regression on WELFake_Dataset.csv and exports artifacts."""
    global vectorizer, model
    print("\n[TRAIN] Initializing training pipeline on WELFake_Dataset.csv...")

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset '{DATASET_PATH}' not found in current directory.")

    df = pd.read_csv(DATASET_PATH)
    df["title"] = df["title"].fillna("")
    df["text"] = df["text"].fillna("")
    df.dropna(subset=["label"], inplace=True)
    df["content"] = (df["title"] + " " + df["text"]).str.strip()
    df = df[df["content"] != ""].reset_index(drop=True)
    df["label"] = df["label"].astype(int)

    X = df["content"].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    vec = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        sublinear_tf=True,
        ngram_range=(1, 2)
    )
    X_train_vec = vec.fit_transform(X_train)

    clf = LogisticRegression(
        max_iter=300,
        C=1.0,
        random_state=42,
        solver="lbfgs",
        n_jobs=-1
    )
    clf.fit(X_train_vec, y_train)

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(vec, VEC_PATH, compress=3)
    joblib.dump(clf, MODEL_PATH, compress=3)

    vectorizer = vec
    model = clf
    print(f"[SAVE] Exported models to '{MODELS_DIR}/'")

def load_models():
    """Loads fitted vectorizer and model from disk or trains if missing."""
    global vectorizer, model
    if os.path.exists(VEC_PATH) and os.path.exists(MODEL_PATH):
        try:
            vectorizer = joblib.load(VEC_PATH)
            model = joblib.load(MODEL_PATH)
            print("[INIT] Models loaded successfully from disk.")
            return
        except Exception as e:
            print(f"[WARN] Error loading models: {e}. Retraining...")

    train_and_save_model()

@app.on_event("startup")
def startup_event():
    load_models()

# -----------------------------------------------------------------------------
# 3. REQUEST / RESPONSE SCHEMAS
# -----------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="News article text or headline to analyze")

class AnalyzeResponse(BaseModel):
    prediction: str = Field(..., description="'Fake' or 'Real'")
    confidence: float = Field(..., description="Confidence score percentage between 50.0 and 100.0")
    is_fake: bool = Field(..., description="True if classified as Fake news")
    prob_fake: float = Field(..., description="Probability of Fake class (0-100)")
    prob_real: float = Field(..., description="Probability of Real class (0-100)")
    word_count: int
    sentence_count: int
    caps_ratio: float
    status: str = "success"

# -----------------------------------------------------------------------------
# 4. API ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {
        "service": "NoCap Fake News Detection API",
        "status": "online",
        "model_loaded": model is not None and vectorizer is not None,
        "docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model_ready": model is not None,
        "vectorizer_ready": vectorizer is not None
    }

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_news(payload: AnalyzeRequest):
    """
    Accepts raw text, executes TF-IDF vectorization, runs Logistic Regression inference,
    and returns prediction verdict with confidence and metadata.
    """
    global vectorizer, model
    clean_text = payload.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Input text cannot be empty or solely whitespace."
        )

    if vectorizer is None or model is None:
        load_models()
        if vectorizer is None or model is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Machine learning model assets are not loaded."
            )

    # 1. Transform text
    X_vec = vectorizer.transform([clean_text])

    # 2. Predict Probabilities
    probs = model.predict_proba(X_vec)[0]
    prob_real = float(probs[0] * 100)
    prob_fake = float(probs[1] * 100)

    is_fake = prob_fake >= 50.0
    prediction = "Fake" if is_fake else "Real"
    confidence = round(prob_fake if is_fake else prob_real, 1)

    # 3. Extract Real Text Telemetry
    raw_words = clean_text.split()
    word_count = len(raw_words)
    sentences = [s.strip() for s in re.split(r"[.!?]+", clean_text) if s.strip()]
    sentence_count = max(len(sentences), 1 if word_count > 0 else 0)

    alpha_chars = [c for c in clean_text if c.isalpha()]
    caps_chars = [c for c in alpha_chars if c.isupper()]
    caps_ratio = round((len(caps_chars) / len(alpha_chars) * 100), 1) if alpha_chars else 0.0

    return AnalyzeResponse(
        prediction=prediction,
        confidence=confidence,
        is_fake=is_fake,
        prob_fake=round(prob_fake, 1),
        prob_real=round(prob_real, 1),
        word_count=word_count,
        sentence_count=sentence_count,
        caps_ratio=caps_ratio,
        status="success"
    )

if __name__ == "__main__":
    import uvicorn
    print("\n[LAUNCH] Starting Uvicorn server on http://localhost:8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
