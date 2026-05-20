# transactions/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Opérations
    path('depot/', views.DepotView.as_view(), name='depot'),
    path('retrait/', views.RetraitView.as_view(), name='retrait'),
    path('transfert/', views.TransfertView.as_view(), name='transfert'),
    
    # Consultation
    path('list/', views.TransactionListView.as_view(), name='transaction-list'),
    path('detail/<str:reference>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    path('releve/', views.ReleveCompteView.as_view(), name='releve-compte'),
]