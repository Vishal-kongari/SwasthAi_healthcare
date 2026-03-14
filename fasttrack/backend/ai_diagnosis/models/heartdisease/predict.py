import os
import joblib
import numpy as np

model = joblib.load(os.path.join(os.path.dirname(__file__), "models/heart_model.pkl"))

def predict_heart_risk(data):

    arr = np.array(data).reshape(1,-1)
    prediction = model.predict(arr)[0]
    probability = model.predict_proba(arr)[0][1]

    prediction_result = {
        "heart_disease_prediction": int(prediction),
        "risk_probability": float(probability)
    }
    
    print(prediction_result)
    
    return prediction_result

if __name__ == "__main__":
    # Example data. Update the number of zeroes to match the model's required features.
    sample_data = [0] * 14 
    print("Testing Heart Disease Model:")
    try:
        predict_heart_risk(sample_data)
    except Exception as e:
        print(f"Error: {e}")