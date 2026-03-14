import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load dataset
df = pd.read_csv("data/dataset.csv")

# Convert categorical values
df["GENDER"] = df["GENDER"].map({"M":1,"F":0})
df["LUNG_CANCER"] = df["LUNG_CANCER"].map({"YES":1,"NO":0})

# Features and label
X = df.drop("LUNG_CANCER", axis=1)
y = df["LUNG_CANCER"]

# Train test split (stratified for balanced classes)
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
joblib.dump(model, "models/lung_model.pkl")

print("Model saved successfully")