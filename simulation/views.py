import os
import joblib
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.shortcuts import render
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

def simulate(request):
    return render(request, 'simulation/field.html', {
        'timestamp': now().timestamp()
    })

