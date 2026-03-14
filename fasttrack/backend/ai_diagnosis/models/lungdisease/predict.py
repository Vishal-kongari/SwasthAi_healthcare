import os
import joblib
import numpy as np

model = joblib.load(os.path.join(os.path.dirname(__file__), "models/lung_model.pkl"))

def predict_lung(data):

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
        "lung_cancer_prediction": int(prediction),
        "risk_probability": float(probability),
        "risk_score": round(probability*100,2),
        "risk_level": risk
    }
    
    print(prediction_result)
    
    return prediction_result

if __name__ == "__main__":
    # Example data. Update the number of zeroes to match the model's required features.
    sample_data = [0] * 15 
    print("Testing Lung Disease Model:")
    try:
        predict_lung(sample_data)
    except Exception as e:
        print(f"Error: {e}")