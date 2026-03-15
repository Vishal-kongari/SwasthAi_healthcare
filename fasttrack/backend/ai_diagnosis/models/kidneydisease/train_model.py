import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# =========================
# Load Dataset
# =========================

df = pd.read_csv("/Users/asmithareddy/Desktop/swasthAI/SwasthAi_healthcare/fasttrack/backend/ai_diagnosis/models/kidneydisease/data/kidney_dataset_1000.csv")

print("Dataset Loaded")
print(df.head())

# =========================
# Drop useless column
# =========================

df = df.drop("id", axis=1)

# =========================
# Target column
# =========================

df["classification"] = df["classification"].map({
    "ckd":1,
    "notckd":0
})

# =========================
# Encode categorical columns
# =========================

categorical_columns = df.select_dtypes(include="object").columns

encoder = LabelEncoder()

for col in categorical_columns:
    df[col] = encoder.fit_transform(df[col].astype(str))

# =========================
# Features & Labels
# =========================

X = df.drop("classification", axis=1)
y = df["classification"]

# =========================
# Train Test Split
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# =========================
# Train Model
# =========================

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

# =========================
# Evaluate
# =========================

pred = model.predict(X_test)

accuracy = accuracy_score(y_test, pred)

print("\nModel Accuracy:", accuracy)
print("\nClassification Report:\n")
print(classification_report(y_test, pred))

# =========================
# Save Model
# =========================

joblib.dump(model, "ckd_model.pkl")

print("\nModel saved as ckd_model.pkl")