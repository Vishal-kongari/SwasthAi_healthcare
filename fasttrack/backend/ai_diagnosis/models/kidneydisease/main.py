import os
import joblib
import numpy as np
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

kidney_model = joblib.load(os.path.join(os.path.dirname(__file__), "models/kidney_model.pkl"))

class KidneyData(BaseModel):

    age:float
    bp:float
    sg:float
    al:float
    su:float
    rbc:int
    pc:int
    pcc:int
    ba:int
    bgr:float
    bu:float
    sc:float
    sod:float
    pot:float
    hemo:float
    pcv:float
    wc:float
    rc:float
    htn:int
    dm:int
    cad:int
    appet:int
    pe:int
    ane:int


@app.post("/predict-kidney-disease")

def predict_kidney(data:KidneyData):

    features = np.array([
        data.age,data.bp,data.sg,data.al,data.su,
        data.rbc,data.pc,data.pcc,data.ba,data.bgr,
        data.bu,data.sc,data.sod,data.pot,data.hemo,
        data.pcv,data.wc,data.rc,data.htn,data.dm,
        data.cad,data.appet,data.pe,data.ane
    ]).reshape(1,-1)

    prediction = kidney_model.predict(features)[0]
    probability = kidney_model.predict_proba(features)[0][1]

    return {
        "kidney_disease_prediction": int(prediction),
        "risk_probability": float(probability),
        "risk_score": round(probability*100,2)
    }