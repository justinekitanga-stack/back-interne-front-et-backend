# transactions/models.py
from django.db import models
from django.conf import settings
from clients.models import Client
import uuid

class Transaction(models.Model):
    """
    Enregistre toutes les transactions (dépôts, retraits) effectuées par les employés.
    """
    
    class TypeTransaction(models.TextChoices):
        DEPOT = 'DEPOT', 'Dépôt'
        RETRAIT = 'RETRAIT', 'Retrait'
        TRANSFERT = 'TRANSFERT', 'Transfert'
    
    class StatutTransaction(models.TextChoices):
        REUSSIE = 'REUSSIE', 'Réussie'
        ECHOUEE = 'ECHOUEE', 'Échouée'
        ANNULEE = 'ANNULEE', 'Annulée'
    
    # Identifiant unique de la transaction
    reference = models.CharField(
        max_length=50, 
        unique=True, 
        editable=False,
        verbose_name="Référence"
    )
    
    # Compte concerné
    client = models.ForeignKey(
        Client, 
        on_delete=models.PROTECT,  # Empêche la suppression du client si transactions existent
        related_name='transactions',
        verbose_name="Client"
    )
    
    # Type et montant
    type_transaction = models.CharField(
        max_length=10, 
        choices=TypeTransaction.choices,
        verbose_name="Type de transaction"
    )
    montant = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        verbose_name="Montant"
    )
    
    # Description optionnelle
    description = models.TextField(
        blank=True, 
        verbose_name="Description"
    )
    
    # Statut
    statut = models.CharField(
        max_length=10, 
        choices=StatutTransaction.choices, 
        default=StatutTransaction.REUSSIE,
        verbose_name="Statut"
    )
    
    # Traçabilité des soldes
    ancien_solde = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        verbose_name="Ancien solde"
    )
    nouveau_solde = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        verbose_name="Nouveau solde"
    )
    
    # Employé qui a effectué la transaction
    effectue_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT, 
        related_name='transactions_effectuees',
        verbose_name="Effectué par",
        null=True,      
        blank=True      
    )
    
    # Dates
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de transaction"
    )
    
    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reference']),
            models.Index(fields=['client', '-created_at']),
            models.Index(fields=['type_transaction']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        # Générer la référence automatiquement
        if not self.reference:
            prefix = 'DEP' if self.type_transaction == self.TypeTransaction.DEPOT else 'RET'
            self.reference = f"{prefix}-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.reference} - {self.get_type_transaction_display()} - {self.montant} USD"