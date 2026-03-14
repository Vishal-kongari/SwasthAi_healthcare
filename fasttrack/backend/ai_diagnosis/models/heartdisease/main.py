from fastapi import FastAPI
from pydantic import BaseModel
import os
import joblib
import numpy as np

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Welcome to Swasthai Backend API"}
model = joblib.load(os.path.join(os.path.dirname(__file__), "models/heart_model.pkl"))


class Patient(BaseModel):

    age:int
    sex:int
    cp:int
    trestbps:int
    chol:int
    fbs:int
    restecg:int
    thalach:int
    exang:int
    oldpeak:float
    slope:int
    ca:int
    thal:int


@app.post("/predict-heart-risk")

def predict(data:Patient):

    features = np.array([
        data.age,
        data.sex,
        data.cp,
        data.trestbps,
        data.chol,
        data.fbs,
        data.restecg,
        data.thalach,
        data.exang,
        data.oldpeak,
        data.slope,
        data.ca,
        data.thal
    ]).reshape(1,-1)

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]

    return {
        "heart_disease_prediction": int(prediction),
        "risk_probability": float(probability)
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to Swasthai Backend API"}