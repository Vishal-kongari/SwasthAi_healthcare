import os
import joblib
import numpy as np
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

lung_model = joblib.load(os.path.join(os.path.dirname(__file__), "models/lung_model.pkl"))

class LungData(BaseModel):

    GENDER:int
    AGE:int
    SMOKING:int
    YELLOW_FINGERS:int
    ANXIETY:int
    PEER_PRESSURE:int
    CHRONIC_DISEASE:int
    FATIGUE:int
    ALLERGY:int
    WHEEZING:int
    ALCOHOL_CONSUMING:int
    COUGHING:int
    SHORTNESS_OF_BREATH:int
    SWALLOWING_DIFFICULTY:int
    CHEST_PAIN:int


@app.post("/predict-lung-cancer")
def predict_lung(data:LungData):

    features = np.array([
        data.GENDER,
        data.AGE,
        data.SMOKING,
        data.YELLOW_FINGERS,
        data.ANXIETY,
        data.PEER_PRESSURE,
        data.CHRONIC_DISEASE,
        data.FATIGUE,
        data.ALLERGY,
        data.WHEEZING,
        data.ALCOHOL_CONSUMING,
        data.COUGHING,
        data.SHORTNESS_OF_BREATH,
        data.SWALLOWING_DIFFICULTY,
        data.CHEST_PAIN
    ]).reshape(1,-1)

    prediction = lung_model.predict(features)[0]
    probability = lung_model.predict_proba(features)[0][1]

    return {
        "lung_cancer_prediction": int(prediction),
        "risk_probability": float(probability),
        "risk_score": round(probability*100,2)
    }