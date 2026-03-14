import os
import joblib
import numpy as np

model = joblib.load(os.path.join(os.path.dirname(__file__), "models/diabetes_model.pkl"))

def predict_diabetes(data):

    arr = np.array(data).reshape(1,-1)
    prediction = model.predict(arr)[0]
    probability = model.predict_proba(arr)[0][1]

    if probability < 0.4:
        risk = "LOW"
    elif probability < 0.7:
        risk = "MEDIUM"
    else:
        risk = "HIGH"

    prediction_result = {
        "diabetes_prediction": int(prediction),
        "risk_probability": float(probability),
        "risk_score": round(probability*100,2),
        "risk_level": risk
    }
    
    print(prediction_result)
    
    return prediction_result

if __name__ == "__main__":
    # Example data representing a patient
    sample_data = [1, 85, 66, 29, 0, 26.6, 0.351, 31]
    print("Testing Diabetes Model:")
    predict_diabetes(sample_data)