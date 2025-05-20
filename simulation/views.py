from django.shortcuts import render

def simulate(request):
    return render(request, 'simulation/field.html')
