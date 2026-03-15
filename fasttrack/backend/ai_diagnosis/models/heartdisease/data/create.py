import pandas as pd
import numpy as np

rows = 1200
data = []

for _ in range(rows):

    age = np.random.randint(20,80)
    sex = np.random.randint(0,2)
    bmi = round(np.random.uniform(18,40),2)
    bp = np.random.randint(90,180)
    chol = np.random.randint(150,300)
    glucose = np.random.randint(70,200)
    hr = np.random.randint(60,120)
    smoking = np.random.randint(0,2)
    max_hr = np.random.randint(90,200)

    risk = 0

    if age > 55:
        risk += 2
    if bmi > 30:
        risk += 1
    if bp > 140:
        risk += 1
    if chol > 240:
        risk += 1
    if glucose > 140:
        risk += 1
    if smoking == 1:
        risk += 1
    if max_hr < 120:
        risk += 2

    target = 1 if risk >= 4 else 0

    data.append([age,sex,bmi,bp,chol,glucose,hr,smoking,max_hr,target])

df = pd.DataFrame(data,columns=[
"Age","Sex","BMI","BloodPressure","Cholesterol",
"Glucose","HeartRate","Smoking","MaxHeartRate","target"
])

df.to_csv("heart_dataset_1200.csv",index=False)

print("Dataset generated")