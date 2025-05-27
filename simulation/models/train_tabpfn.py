# train_model.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from tabpfn import TabPFNClassifier
import joblib
import os

def train_model():
    df = pd.read_csv("cow_data.csv")
    features = ['Temperature', 'HeartRate', 'Hunger', 'Tiredness', 'Age']

    X = df[features].values.astype(np.float32)
    y = df['Label'].values

    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Split and train
    X_train, _, y_train, _ = train_test_split(X_scaled, y_encoded, test_size=0.2)
    model = TabPFNClassifier(device='cpu')
    model.fit(X_train, y_train)

    # Save model, label encoder, scaler
    joblib.dump((model, le, scaler), "tabpfn_model.pkl")
    print("✅ Trained and saved model to tabpfn_model.pkl")

if __name__ == "__main__":
    train_model()
