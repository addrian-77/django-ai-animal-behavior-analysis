import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tabpfn import TabPFNClassifier
import joblib
import os


# Generate synthetic data (or replace with real data from your database later)
def generate_data():
    n_samples = 300
    np.random.seed(42)
    temp_healthy = np.random.normal(38.5, 0.3, n_samples)
    hr_healthy = np.random.normal(80, 10, n_samples)
    temp_high = np.random.normal(40.0, 0.3, n_samples)
    hr_high = np.random.normal(85, 10, n_samples)
    temp_heart = np.random.normal(38.5, 0.3, n_samples)
    hr_heart = np.random.normal(120, 10, n_samples)

    data = pd.DataFrame({
        'Temperature': np.concatenate([temp_healthy, temp_high, temp_heart]),
        'HeartRate': np.concatenate([hr_healthy, hr_high, hr_heart]),
        'Label': ['Healthy'] * n_samples + ['High Temp'] * n_samples + ['Heart Problem'] * n_samples
    })
    return data

def train_model():
    df = generate_data()
    X = df[['Temperature', 'HeartRate']].values.astype(np.float32)
    le = LabelEncoder()
    y = le.fit_transform(df['Label'])

    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2)
    model = TabPFNClassifier(device='cpu')
    model.fit(X_train, y_train)

    # Save to the same folder where this script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'tabpfn_model.pkl')
    joblib.dump((model, le), model_path)

    print(f"✅ Model saved to {model_path}")



if __name__ == "__main__":
    train_model()
