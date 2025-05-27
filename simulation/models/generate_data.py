# generate_data.py
import pandas as pd
import numpy as np

def generate_cow_data(n_samples=500):
    np.random.seed(42)

    cows = []
    for _ in range(n_samples):
        temp = np.random.normal(38.5, 0.5)
        hr = np.random.normal(80, 15)
        hunger = np.random.uniform(0, 100)
        tiredness = np.random.uniform(0, 100)
        age = np.random.uniform(0, 20)

        # Labeling rules
        if temp > 39.5 or temp < 37:
            label = "Sick - Temp"
        elif hr > 100 or hr < 50:
            label = "Sick - HR"
        elif hunger < 30:
            label = "Hungry"
        elif tiredness > 75:
            label = "Tired"
        elif age > 15:
            label = "Elderly"
        else:
            label = "Healthy"

        cows.append({
            "Temperature": round(temp, 2),
            "HeartRate": round(hr, 1),
            "Hunger": round(hunger, 1),
            "Tiredness": round(tiredness, 1),
            "Age": round(age, 1),
            "Label": label
        })

    df = pd.DataFrame(cows)
    df.to_csv("cow_data.csv", index=False)
    print("✅ Generated cow_data.csv")

if __name__ == "__main__":
    generate_cow_data()
