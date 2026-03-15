import pandas as pd
import numpy as np

np.random.seed(42)

rows = 10000

data = {
    "Age": np.random.randint(20, 80, rows),
    "Sex": np.random.randint(0, 2, rows),
    "BMI": np.round(np.random.uniform(18, 40, rows), 2),
    "BloodPressure": np.random.randint(90, 180, rows),
    "Cholesterol": np.random.randint(150, 300, rows),
    "Glucose": np.random.randint(70, 200, rows),
    "HeartRate": np.random.randint(60, 120, rows),
    "Smoking": np.random.randint(0, 2, rows),
    "LiverEnzymeLevel": np.random.randint(10, 150, rows)
}

df = pd.DataFrame(data)

# Base medical risk score
risk_score = (
    (df["Glucose"] > 150).astype(int) +
    (df["Cholesterol"] > 240).astype(int) +
    (df["BMI"] > 30).astype(int) +
    (df["BloodPressure"] > 145).astype(int) +
    (df["Smoking"] == 1).astype(int)
)

# Convert risk to probability
probability = risk_score / 6

# Add noise to reduce accuracy
noise = np.random.normal(0, 0.15, rows)

probability = probability + noise

# Final outcome
df["Outcome"] = (probability > 0.5).astype(int)

df.to_csv("health_dataset.csv", index=False)

print("Dataset created successfully with moderate noise")