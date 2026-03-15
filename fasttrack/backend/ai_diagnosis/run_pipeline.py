import sys
import json
import os
import joblib
import numpy as np

# Canonical 9 features in fixed order (same as OCR extraction and all datasets):
# Age, Sex, BMI, BloodPressure, Cholesterol, Glucose, HeartRate, Smoking, LiverEnzymeLevel
FEATURE_ORDER = [
    'age', 'sex', 'bmi', 'bloodPressure', 'cholesterol', 'glucose',
    'heartRate', 'smoking', 'liverEnzymeLevel'
]
DEFAULTS = {
    'age': 40,
    'sex': 0,
    'bmi': 25.0,
    'bloodPressure': 120,
    'cholesterol': 200,
    'glucose': 100,
    'heartRate': 72,
    'smoking': 0,
    'liverEnzymeLevel': 40,
}

# Load local models safely (use relative paths so it works across machines)
def load_model(rel_path):
    try:
        base = os.path.dirname(os.path.abspath(__file__))
        abs_path = os.path.join(base, rel_path)
        return joblib.load(abs_path)
    except Exception as e:
        print(f"Warning: Could not load model {rel_path}: {e}", file=sys.stderr)
        return None

diabetes_model = load_model("models/diabetes/models/diabetes_disease_model.pkl")
heart_model = load_model("models/heartdisease/models/heart_disease_model.pkl")
kidney_model = load_model("models/kidneydisease/models/ckd_model.pkl")
lung_model = load_model("models/lungdisease/models/lung_model.pkl")


def parse_input_to_canonical_9(features_dict):
    """
    Build a single 9-feature array in fixed order from OCR/extracted dict.
    Keys may be camelCase or lowercase; 'bp' maps to bloodPressure.
    """
    # Normalize keys: allow bp -> bloodPressure, etc.
    d = {k.lower(): v for k, v in (features_dict or {}).items()}
    if 'bp' in d and 'bloodpressure' not in d:
        d['bloodpressure'] = d['bp']
    if 'liverenzymelevel' not in d and 'liverenzyme' in d:
        d['liverenzymelevel'] = d['liverenzyme']

    arr = []
    for key in FEATURE_ORDER:
        val = d.get(key, DEFAULTS.get(key, 0))
        try:
            arr.append(float(val))
        except (TypeError, ValueError):
            arr.append(DEFAULTS.get(key, 0))
    return np.array(arr, dtype=np.float64).reshape(1, -1)


def get_expected_features(model):
    """Return the number of features the model expects (sklearn)."""
    if model is None:
        return 9
    return getattr(model, 'n_features_in_', 9)


def prepare_for_model(canonical_9_arr, expected_len):
    """
    Return an array of shape (1, expected_len).
    - If expected_len == 9: return canonical_9_arr as is.
    - If expected_len > 9: pad with zeros (append 0s).
    - If expected_len < 9: take first expected_len columns.
    """
    n = canonical_9_arr.shape[1]
    if expected_len == n:
        return canonical_9_arr
    if expected_len > n:
        pad = np.zeros((1, expected_len - n), dtype=np.float64)
        return np.hstack([canonical_9_arr, pad])
    return canonical_9_arr[:, :expected_len]


def run_predictions(parsed_data):
    results = {}
    canonical_9 = parse_input_to_canonical_9(parsed_data)

    def run_one(name, model):
        if model is None:
            return
        try:
            n = get_expected_features(model)
            X = prepare_for_model(canonical_9, n)
            pred = model.predict(X)[0]
            proba = model.predict_proba(X)[0]
            # Handle binary: class 1 probability
            prob = proba[1] if len(proba) > 1 else proba[0]
            risk = "HIGH" if prob >= 0.7 else "MEDIUM" if prob >= 0.4 else "LOW"
            results[name] = {"prediction": int(pred), "probability": float(prob), "risk": risk}
        except Exception as e:
            results[name] = {"error": str(e)}

    # Same order as data: diabetes, heart, kidney, lung
    run_one("diabetes", diabetes_model)
    run_one("heart", heart_model)
    run_one("kidney", kidney_model)
    run_one("lung", lung_model)

    return results


if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            input_json = sys.argv[1]
            parsed_data = json.loads(input_json)
            predictions = run_predictions(parsed_data)
            print(json.dumps(predictions))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print(json.dumps({"error": "No input data provided"}))
