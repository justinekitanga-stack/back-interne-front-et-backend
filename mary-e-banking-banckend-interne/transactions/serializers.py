# transactions/serializers.py
from rest_framework import serializers
from .models import Transaction
from clients.models import Client

class DepotSerializer(serializers.Serializer):
    """Validation pour un dépôt"""
    numero_compte = serializers.CharField(max_length=20)
    montant = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate_numero_compte(self, value):
        """Vérifie que le compte existe et est actif"""
        try:
            client = Client.objects.get(numero_compte=value)
        except Client.DoesNotExist: 
            raise serializers.ValidationError("Aucun compte trouvé avec ce numéro.")
        
        if client.statut == Client.StatutCompte.INACTIF:
            raise serializers.ValidationError("Ce compte n'est pas encore activé.")
        
        if client.statut == Client.StatutCompte.BLOQUE:
            raise serializers.ValidationError("Ce compte est bloqué.")
        
        if client.statut == Client.StatutCompte.CLOTURE:
            raise serializers.ValidationError("Ce compte est clôturé.")
        
        # Stocker le client pour l'utiliser dans la vue
        self.client = client
        return value
    
    def validate_montant(self, value):
        """Vérifie le montant du dépôt"""
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0.")
        
        if value > 1000000:  # 1 million USD max par dépôt
            raise serializers.ValidationError("Le montant maximum par dépôt est de 1,000,000 USD.")
        
        return value


class RetraitSerializer(serializers.Serializer):
    """Validation pour un retrait"""
    numero_compte = serializers.CharField(max_length=20)
    montant = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate_numero_compte(self, value):
        """Vérifie que le compte existe et est actif"""
        try:
            client = Client.objects.get(numero_compte=value)
        except Client.DoesNotExist:
            raise serializers.ValidationError("Aucun compte trouvé avec ce numéro.")
        
        if client.statut != Client.StatutCompte.ACTIF:
            raise serializers.ValidationError(
                f"Ce compte est {client.get_statut_display().lower()}. "
                "Seuls les comptes actifs peuvent effectuer des retraits."
            )
        
        self.client = client
        return value
    
    def validate_montant(self, value):
        """Vérifie le montant du retrait"""
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0.")
        
        if value > 50000:  # 50,000 USD max par retrait
            raise serializers.ValidationError("Le montant maximum par retrait est de 50,000 USD.")
        
        return value
    
    def validate(self, data):
        """Vérifie que le solde est suffisant"""
        if hasattr(self, 'client'):
            if self.client.solde < data['montant']:
                raise serializers.ValidationError({
                    'montant': f"Solde insuffisant. Solde disponible : {self.client.solde} USD"
                })
        return data


class TransactionDetailSerializer(serializers.ModelSerializer):
    """Détails d'une transaction"""
    nom_client = serializers.CharField(source='client.nom_complet', read_only=True)
    numero_compte = serializers.CharField(source='client.numero_compte', read_only=True)
    type_transaction_display = serializers.CharField(source='get_type_transaction_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    effectue_par_nom = serializers.CharField(source='effectue_par.get_full_name', read_only=True)
    difference = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'type_transaction', 'type_transaction_display',
            'montant', 'description', 'statut', 'statut_display',
            'ancien_solde', 'nouveau_solde', 'difference',
            'nom_client', 'numero_compte',
            'effectue_par_nom', 'created_at'
        ]
    
    def get_difference(self, obj):
        """Calcule la différence entre ancien et nouveau solde"""
        return str(obj.nouveau_solde - obj.ancien_solde)


class TransactionListSerializer(serializers.ModelSerializer):
    """Version résumée pour les listes"""
    nom_client = serializers.CharField(source='client.nom_complet', read_only=True)
    numero_compte = serializers.CharField(source='client.numero_compte', read_only=True)
    type_transaction_display = serializers.CharField(source='get_type_transaction_display', read_only=True)
    effectue_par_nom = serializers.CharField(source='effectue_par.get_full_name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'type_transaction', 'type_transaction_display',
            'montant', 'nom_client', 'numero_compte',
            'statut', 'effectue_par_nom', 'created_at'
        ]

class TransfertSerializer(serializers.Serializer):
    """Validation pour un transfert"""
    compte_source = serializers.CharField(max_length=20)
    compte_dest = serializers.CharField(max_length=20)
    montant = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate_compte_source(self, value):
        try:
            client = Client.objects.get(numero_compte=value)
        except Client.DoesNotExist:
            raise serializers.ValidationError("Compte source introuvable.")
        
        if client.statut != Client.StatutCompte.ACTIF:
            raise serializers.ValidationError(f"Le compte source est {client.get_statut_display().lower()}.")
        
        self.compte_source = client
        return value
    
    def validate_compte_dest(self, value):
        try:
            client = Client.objects.get(numero_compte=value)
        except Client.DoesNotExist:
            raise serializers.ValidationError("Compte destination introuvable.")
        
        if client.statut != Client.StatutCompte.ACTIF:
            raise serializers.ValidationError(f"Le compte destination est {client.get_statut_display().lower()}.")
        
        self.compte_dest = client
        return value
    
    def validate_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0.")
        if value > 100000:
            raise serializers.ValidationError("Le montant maximum par transfert est de 100,000 USD.")
        return value
    
    def validate(self, data):
        if data['compte_source'] == data['compte_dest']:
            raise serializers.ValidationError({
                'compte_dest': 'Impossible de transférer vers le même compte.'
            })
        
        # Vérifier le solde
        if hasattr(self, 'compte_source'):
            if self.compte_source.solde < data['montant']:
                raise serializers.ValidationError({
                    'montant': f"Solde insuffisant. Disponible : {self.compte_source.solde} USD"
                })
        
        return data