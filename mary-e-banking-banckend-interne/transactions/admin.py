# transactions/admin.py
from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'reference', 'client', 'type_transaction', 'montant',
        'statut', 'effectue_par', 'created_at'
    ]
    list_filter = ['type_transaction', 'statut', 'created_at']
    search_fields = ['reference', 'client__nom', 'client__numero_compte']
    readonly_fields = ['reference', 'ancien_solde', 'nouveau_solde', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informations transaction', {
            'fields': ('reference', 'type_transaction', 'montant', 'description', 'statut')
        }),
        ('Compte concerné', {
            'fields': ('client', 'ancien_solde', 'nouveau_solde')
        }),
        ('Responsable', {
            'fields': ('effectue_par', 'created_at')
        }),
    )