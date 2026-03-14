import os
import joblib
import numpy as np
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

diabetes_model = joblib.load(os.path.join(os.path.dirname(__file__), "models/diabetes_model.pkl"))

class DiabetesData(BaseModel):

    Pregnancies:int
    Glucose:int
    BloodPressure:int
    SkinThickness:int
    Insulin:int
    BMI:float
    DiabetesPedigreeFunction:float
    Age:int


@app.post("/predict-diabetes")

def predict_diabetes(data:DiabetesData):

    features = np.array([
        data.Pregnancies,
        data.Glucose,
        data.BloodPressure,
        data.SkinThickness,
        data.Insulin,
        data.BMI,
        data.DiabetesPedigreeFunction,
        data.Age
    ]).reshape(1,-1)

    prediction = diabetes_model.predict(features)[0]
    probability = diabetes_model.predict_proba(features)[0][1]

    return {
        "diabetes_prediction": int(prediction),
        "risk_probability": float(probability),
        "risk_score": round(probability*100,2)
    }