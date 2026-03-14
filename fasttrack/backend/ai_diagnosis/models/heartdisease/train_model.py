import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load dataset
df = pd.read_csv("data/heart.csv")

# Replace missing values
df = df.replace("?", np.nan)
df = df.dropna()

# Convert all columns to numeric
df = df.apply(pd.to_numeric)

# Convert target to binary
df["target"] = df["target"].apply(lambda x: 1 if x > 0 else 0)

# Features and label
X = df.drop("target", axis=1)
y = df["target"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))

# Save model
joblib.dump(model, "models/heart_model.pkl")

print("Model saved successfully!")