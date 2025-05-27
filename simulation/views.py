import os
import json
import joblib
import numpy as np

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.timezone import now
import time

# --- Load trained model, label encoder, and scaler ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'tabpfn_model.pkl')
model, le, scaler = joblib.load(MODEL_PATH)

# --- View for AI prediction from POST request ---
@csrf_exempt
def cow_prediction(request):
    if request.method == 'POST':
        start = time.time()
        try:
            body = json.loads(request.body)
            # Expecting features in this order
            features = np.array([[ 
                body["temperature"], 
                body["heartrate"], 
                body["hunger"], 
                body["tiredness"], 
                body.get("age", 3.0)  # optional: use a default age
            ]])

            # Scale features
            features_scaled = scaler.transform(features)

            # Predict and decode label
            pred_idx = model.predict(features_scaled)[0]
            label = le.inverse_transform([pred_idx])[0]

            end = time.time()
            prediction_time = end - start
            return JsonResponse({"prediction": label, "prediction_time": prediction_time})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)

# --- View for simulation page ---
def simulate(request):
    return render(request, 'simulation/field.html', {
        'timestamp': now().timestamp()
    })
