import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# -----------------------------
# 1️⃣ Load Dataset
# -----------------------------

df = pd.read_csv("/Users/asmithareddy/Desktop/swasthAI/SwasthAi_healthcare/fasttrack/backend/ai_diagnosis/models/heartdisease/data/heart_dataset_1200.csv")

print("Dataset Loaded")
print(df.head())

# -----------------------------
# 2️⃣ Define Features and Target
# -----------------------------
X = df.drop("target", axis=1)
y = df["target"]

# -----------------------------
# 3️⃣ Train Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -----------------------------
# 4️⃣ Train Model
# -----------------------------
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

# -----------------------------
# 5️⃣ Evaluate Model
# -----------------------------
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nModel Accuracy:", accuracy)
print("\nClassification Report:\n", classification_report(y_test, predictions))

# -----------------------------
# 6️⃣ Save Model
# -----------------------------
model_path = "heart_disease_model.pkl"

joblib.dump(model, model_path)

print("\nModel saved at:", model_path)