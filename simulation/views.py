import os
import joblib
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.shortcuts import render
<<<<<<< HEAD
import json

# Load model
model_path = os.path.join(os.path.dirname(__file__), 'models', 'tabpfn_model.pkl')
model, label_encoder = joblib.load(model_path)

@csrf_exempt
@require_POST
def diagnose_cow(request):
    try:
        data = json.loads(request.body)
        temperature = float(data.get('temperature'))
        heartrate = float(data.get('heartrate'))  # 🟢 fixed key name
    except Exception as e:
        print("❌ RAW BODY:", request.body)
        print("❌ PARSED ERROR:", e)
        return JsonResponse({'error': 'Invalid input', 'details': str(e)}, status=400)

    X = np.array([[temperature, heartrate]], dtype=np.float32)
    prediction = model.predict(X)
    diagnosis = label_encoder.inverse_transform(prediction)[0]

    return JsonResponse({'diagnosis': diagnosis})

from django.utils.timezone import now
=======
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

>>>>>>> dcc9e7ffd6b5a04e6494fb624e2320ce06940096

def simulate(request):
    return render(request, 'simulation/field.html', {
        'timestamp': now().timestamp()
    })

