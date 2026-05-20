# clients/serializers.py
from rest_framework import serializers
from datetime import date
from .models import Client

class ClientCreateSerializer(serializers.ModelSerializer):
    """
    Pour la création d'un compte client par un employé.
    Le compte est créé SANS mot de passe.
    """
    
    class Meta:
        model = Client
        fields = [
            'nom', 'post_nom', 'prenom', 'email', 'telephone',
            'birthday', 'genre', 'carte_identite', 'photo_passeport',
            'devise', 'type_compte'
        ]
    
    def validate_email(self, value):
        if Client.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un client avec cet email existe déjà.")
        return value
    
    def validate_telephone(self, value):
        if not value.replace('+', '').isdigit():
            raise serializers.ValidationError("Le téléphone ne doit contenir que des chiffres et +")
        return value
    
    def validate_birthday(self, value):
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("Le client doit avoir au moins 18 ans.")
        return value
    
    def validate_carte_identite(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("L'image ne doit pas dépasser 5MB.")
        return value
    
    def validate_photo_passeport(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("La photo ne doit pas dépasser 5MB.")
        return value


# ===== SERIALIZERS POUR L'APP INTERNE =====

class ClientDetailSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    created_by_name = serializers.SerializerMethodField()
    mot_de_passe_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'nom', 'post_nom', 'prenom', 'nom_complet',
            'email', 'telephone', 'birthday', 'age', 'genre',
            'carte_identite', 'photo_passeport',
            'numero_compte', 'devise', 'type_compte', 'solde',
            'mot_de_passe_status', 'statut', 
            'created_by_name', 'created_at', 'updated_at'
        ]
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None
    
    def get_mot_de_passe_status(self, obj):
        """Indique si le client a défini son mot de passe"""
        if obj.password_is_set:
            return "Défini"
        return "Non défini"


class ClientListSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    mot_de_passe_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'nom_complet', 'numero_compte', 'email',
            'telephone', 'type_compte', 'solde', 'statut',
            'mot_de_passe_status', 'created_at'
        ]
    
    def get_mot_de_passe_status(self, obj):
        return "✓" if obj.password_is_set else "✗"


class CompteActivationSerializer(serializers.Serializer):
    numero_compte = serializers.CharField(max_length=20)
    
    def validate_numero_compte(self, value):
        if not Client.objects.filter(numero_compte=value).exists():
            raise serializers.ValidationError("Aucun compte trouvé.")
        return value


class CompteReveleSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not Client.objects.filter(email=value).exists():
            raise serializers.ValidationError("Aucun compte trouvé avec cet email.")
        return value


class CompteBloqueSerializer(serializers.Serializer):
    numero_compte = serializers.CharField(max_length=20)
    raison = serializers.CharField(max_length=255, required=False, allow_blank=True)


class SoldeQuerySerializer(serializers.Serializer):
    numero_compte = serializers.CharField(max_length=20)


class RechercheCompteSerializer(serializers.Serializer):
    """
    Pour chercher un compte par numéro (étape 1 de l'activation client)
    """
    numero_compte = serializers.CharField(max_length=20)
    
    def validate_numero_compte(self, value):
        try:
            client = Client.objects.get(numero_compte=value)
            self.client = client
        except Client.DoesNotExist:
            raise serializers.ValidationError("Aucun compte trouvé avec ce numéro.")
        return value