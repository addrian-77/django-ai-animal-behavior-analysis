from django.contrib import admin
from django.urls import path
from simulation import views

urlpatterns = [
    # path('api/diagnose/', views.diagnose_cow),  # ⬅️ uses the view above
    path('admin/', admin.site.urls),
    path('', views.simulate, name='simulate'),  # or whatever your homepage is
    path('predict/', views.cow_prediction, name='cow_prediction'),
]
