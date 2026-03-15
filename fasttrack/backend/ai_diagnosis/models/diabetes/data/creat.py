import pandas as pd
import numpy as np

rows = 1000
data = []

for _ in range(rows):

    age = np.random.randint(20, 80)
    sex = np.random.randint(0, 2)
    bmi = np.random.uniform(18, 40)
    bp = np.random.randint(90, 180)
    chol = np.random.randint(150, 300)
    glucose = np.random.randint(70, 200)
    hr = np.random.randint(60, 120)
    smoking = np.random.randint(0, 2)
    pedigree = round(np.random.uniform(0.1, 2.5),2)

    risk = 0

    if glucose > 140:
        risk += 3
    if bmi > 30:
        risk += 2
    if age > 50:
        risk += 1
    if bp > 140:
        risk += 1
    if smoking == 1:
        risk += 1

    outcome = 1 if risk >= 4 else 0

    data.append([age,sex,bmi,bp,chol,glucose,hr,smoking,pedigree,outcome])

df = pd.DataFrame(data, columns=[
    "Age","Sex","BMI","BloodPressure","Cholesterol",
    "Glucose","HeartRate","Smoking","DiabetesPedigreeFunction","Outcome"
])

df.to_csv("diabetes_dataset_1000.csv",index=False)
print("Dataset created")