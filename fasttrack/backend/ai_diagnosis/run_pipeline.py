import sys
import json
import os
import joblib
import numpy as np

# Load local models safely
def load_model(path):
    try:
        abs_path = os.path.join(os.path.dirname(__file__), path)
        return joblib.load(abs_path)
    except Exception as e:
        return None

diabetes_model = load_model("models/diabetes/models/diabetes_model.pkl")
heart_model = load_model("models/heartdisease/models/heart_model.pkl")
kidney_model = load_model("models/kidneydisease/models/kidney_model.pkl")
lung_model = load_model("models/lungdisease/models/lung_model.pkl")

def parse_input_to_array(features_dict, expected_length, default_val=0):
    """
    Since OCR is messy, we just use a heuristic to pad/fill the required features array
    based on the keys we *could* extract. In a real scenario, you map specific keys to specific indices.
    """
    arr = [default_val] * expected_length
    
    # Simple mapping heuristic
    # Diabetes (8 features): Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age
    if expected_length == 8:
        arr[1] = features_dict.get('glucose', 100)
        arr[2] = features_dict.get('bp', 80)
        arr[5] = features_dict.get('bmi', 25)
        arr[7] = features_dict.get('age', 40)
    
    return np.array(arr).reshape(1, -1)

def run_predictions(parsed_data):
    results = {}
    
    # Diabetes
    if diabetes_model:
        try:
            arr = parse_input_to_array(parsed_data, 8)
            pred = diabetes_model.predict(arr)[0]
            prob = diabetes_model.predict_proba(arr)[0][1]
            risk = "HIGH" if prob >= 0.7 else "MEDIUM" if prob >= 0.4 else "LOW"
            results["diabetes"] = { "prediction": int(pred), "probability": float(prob), "risk": risk }
        except Exception as e:
            results["diabetes"] = { "error": str(e) }
            
    # Heart (13 features)
    if heart_model:
        try:
            arr = parse_input_to_array(parsed_data, 13)
            pred = heart_model.predict(arr)[0]
            prob = heart_model.predict_proba(arr)[0][1]
            risk = "HIGH" if prob >= 0.7 else "MEDIUM" if prob >= 0.4 else "LOW"
            results["heart"] = { "prediction": int(pred), "probability": float(prob), "risk": risk }
        except Exception as e:
            results["heart"] = { "error": str(e) }
            
    # Kidney (24 features)
    if kidney_model:
        try:
            arr = parse_input_to_array(parsed_data, 24)
            pred = kidney_model.predict(arr)[0]
            prob = kidney_model.predict_proba(arr)[0][1]
            risk = "HIGH" if prob >= 0.7 else "MEDIUM" if prob >= 0.4 else "LOW"
            results["kidney"] = { "prediction": int(pred), "probability": float(prob), "risk": risk }
        except Exception as e:
            results["kidney"] = { "error": str(e) }
            
    # Lung (15 features)
    if lung_model:
        try:
            arr = parse_input_to_array(parsed_data, 15)
            pred = lung_model.predict(arr)[0]
            prob = lung_model.predict_proba(arr)[0][1]
            risk = "HIGH" if prob >= 0.7 else "MEDIUM" if prob >= 0.4 else "LOW"
            results["lung"] = { "prediction": int(pred), "probability": float(prob), "risk": risk }
        except Exception as e:
            results["lung"] = { "error": str(e) }
            
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
