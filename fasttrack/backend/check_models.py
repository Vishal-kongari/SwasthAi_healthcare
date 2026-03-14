import joblib
import sys

models = {
    "diabetes": "ai_diagnosis/models/diabetes/models/diabetes_model.pkl",
    "heart": "ai_diagnosis/models/heartdisease/models/heart_model.pkl",
    "kidney": "ai_diagnosis/models/kidneydisease/models/kidney_model.pkl",
    "lung": "ai_diagnosis/models/lungdisease/models/lung_model.pkl"
}

for name, path in models.items():
    try:
        model = joblib.load(path)
        print(f"{name}: {model.n_features_in_}")
    except Exception as e:
        print(f"{name}: error {e}")
