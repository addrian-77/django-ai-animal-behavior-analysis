from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import numpy as np
from tabpfn import TabPFNClassifier


# Initialize model once at startup
X_dummy = np.array([[38.0, 60, 80, 10], [40.5, 52, 40, 90]])
y_dummy = np.array([0, 1])
model = TabPFNClassifier(device='cpu')
model.fit(X_dummy, y_dummy)

@csrf_exempt
def cow_prediction(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        features = np.array([[body["temperature"], body["heartrate"], body["hunger"], body["tiredness"]]])
        pred = model.predict(features)[0]
        label = ["healthy", "low_hr", "fever"][pred]  # Customize to your labels
        return JsonResponse({"prediction": label})
    return JsonResponse({"error": "Invalid request"}, status=400)


def simulate(request):
    return render(request, 'simulation/field.html')
