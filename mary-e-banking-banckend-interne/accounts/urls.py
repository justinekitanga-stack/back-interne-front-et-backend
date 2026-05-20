# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentification
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Profil personnel
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # Gestion des employés (admin)
    path('employees/', views.EmployeeListView.as_view(), name='employee-list'),
    path('employees/create/', views.EmployeeCreateView.as_view(), name='employee-create'),
    path('employees/<str:employee_id>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/<str:employee_id>/status/', views.EmployeeStatusView.as_view(), name='employee-status'),
]