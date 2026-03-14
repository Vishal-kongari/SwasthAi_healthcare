import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load dataset
df = pd.read_csv("data/kidney_disease.csv")

# Remove id column
df = df.drop("id", axis=1)

# Replace missing values
df = df.replace("?", np.nan)

# Convert classification column
df["classification"] = df["classification"].str.strip()
df["classification"] = df["classification"].map({
    "ckd":1,
    "notckd":0
})

# Convert categorical columns
categorical_cols = [
    "rbc","pc","pcc","ba","htn","dm",
    "cad","appet","pe","ane"
]

for col in categorical_cols:
    df[col] = df[col].astype("category").cat.codes

# Convert numeric columns
df = df.apply(pd.to_numeric, errors="coerce")

# Fill missing values
df = df.fillna(df.median())

# Features and label
X = df.drop("classification", axis=1)
y = df["classification"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=500,
    max_depth=12,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, pred))
print(classification_report(y_test, pred))

# Save model
joblib.dump(model, "models/kidney_model.pkl")

print("Kidney model saved successfully")