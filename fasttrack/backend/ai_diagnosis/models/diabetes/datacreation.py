import pandas as pd
import numpy as np

np.random.seed(42)

n = 1000

def base_data():
    return {
        "Age": np.random.randint(20, 80, n),
        "Sex": np.random.randint(0, 2, n),
        "BMI": np.round(np.random.uniform(18, 40, n),2),
        "BloodPressure": np.random.randint(90, 180, n),
        "Cholesterol": np.random.randint(150, 300, n),
        "Glucose": np.random.randint(70, 200, n),
        "HeartRate": np.random.randint(60, 120, n),
        "Smoking": np.random.randint(0, 2, n)
    }

# Diabetes Dataset
diabetes = pd.DataFrame(base_data())
diabetes["DiabetesPedigreeFunction"] = np.round(np.random.uniform(0.1, 2.5, n),2)
diabetes["Outcome"] = np.random.randint(0,2,n)
diabetes.to_csv("diabetes_dataset_1000.csv",index=False)

# Heart Disease Dataset
heart = pd.DataFrame(base_data())
heart["MaxHeartRate"] = np.random.randint(90, 200, n)
heart["Outcome"] = np.random.randint(0,2,n)
heart.to_csv("heart_dataset_1000.csv",index=False)

# Liver Disease Dataset
liver = pd.DataFrame(base_data())
liver["LiverEnzymeLevel"] = np.random.randint(10, 150, n)
liver["Outcome"] = np.random.randint(0,2,n)
liver.to_csv("liver_dataset_1000.csv",index=False)

# Kidney Disease Dataset
kidney = pd.DataFrame(base_data())
kidney["CreatinineLevel"] = np.round(np.random.uniform(0.5, 5.0, n),2)
kidney["Outcome"] = np.random.randint(0,2,n)
kidney.to_csv("kidney_dataset_1000.csv",index=False)

print("All datasets generated successfully!")