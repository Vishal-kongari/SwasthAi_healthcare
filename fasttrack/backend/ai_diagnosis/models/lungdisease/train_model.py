import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# -----------------------------
# 1️⃣ Load Dataset
# -----------------------------
df = pd.read_csv("/Users/asmithareddy/Desktop/swasthAI/SwasthAi_healthcare/fasttrack/backend/ai_diagnosis/models/lungdisease/data/Lung_disease_1000.csv")   # change name if needed

print("Dataset Loaded Successfully")
print(df.head())


# -----------------------------
# 2️⃣ Define Features & Target
# -----------------------------
X = df.drop("Outcome", axis=1)
y = df["Outcome"]


# -----------------------------
# 3️⃣ Train/Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# -----------------------------
# 4️⃣ Train Model
# -----------------------------
model = RandomForestClassifier(
    n_estimators=200,
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
print("\nClassification Report:\n")
print(classification_report(y_test, predictions))


# -----------------------------
# 6️⃣ Save Model
# -----------------------------
joblib.dump(model, "lung_prediction_model.pkl")

print("\nModel saved as health_prediction_model.pkl")