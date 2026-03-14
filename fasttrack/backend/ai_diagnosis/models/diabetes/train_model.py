import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load dataset
df = pd.read_csv("data/diabetes.csv")

# Replace zero values with NaN for medical features
cols = ["Glucose","BloodPressure","SkinThickness","Insulin","BMI"]
df[cols] = df[cols].replace(0, np.nan)

# Fill missing values
df.fillna(df.median(), inplace=True)

# Features and label
X = df.drop("Outcome", axis=1)
y = df["Outcome"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=400,
    max_depth=10,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate model
pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, pred))
print(classification_report(y_test, pred))

# Save model
joblib.dump(model, "models/diabetes_model.pkl")

print("Diabetes model saved successfully")