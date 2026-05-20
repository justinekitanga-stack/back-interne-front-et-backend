# accounts/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    """Sérialiseur pour afficher/lister les employés"""
    
    class Meta:
        model = Employee
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'employee_id', 'phone', 'role', 'statut', 'is_active',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer un employé"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone', 'role'
        ]
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Les mots de passe ne correspondent pas'
            })
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Générer un ID employé automatiquement
        import random
        import string
        validated_data['employee_id'] = f"EMP-{''.join(random.choices(string.digits, k=6))}"
        
        employee = Employee(**validated_data)
        employee.set_password(password)
        employee.save()
        return employee


class LoginSerializer(serializers.Serializer):
    """Sérialiseur pour la connexion"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Personnalisation du token JWT avec les infos employé"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        # Vérifier que l'employé est actif
        if user.statut != Employee.Statut.ACTIF:
            raise serializers.ValidationError(
                'Votre compte est inactif ou suspendu. Contactez votre administrateur.'
            )
        
        # Ajouter les infos de l'employé dans la réponse
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.get_full_name(),
            'employee_id': user.employee_id,
            'role': user.role,
        }
        
        return data