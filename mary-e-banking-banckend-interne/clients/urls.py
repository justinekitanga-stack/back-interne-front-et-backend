# clients/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Création et gestion des comptes (employés)
    path('create/', views.ClientCreateView.as_view(), name='client-create'),
    path('list/', views.ClientListView.as_view(), name='client-list'),
    path('detail/<str:numero_compte>/', views.ClientDetailView.as_view(), name='client-detail'),
    
    # Opérations sur les comptes (employés)
    path('solde/', views.SoldeVerificationView.as_view(), name='solde-verification'),
    path('activer/', views.CompteActivationView.as_view(), name='compte-activation'),
    path('reveler/', views.CompteReveleView.as_view(), name='compte-revele'),
    path('bloquer/', views.CompteBloqueView.as_view(), name='compte-bloque'),
]