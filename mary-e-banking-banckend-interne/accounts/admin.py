# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(UserAdmin):
    """Configuration de l'interface admin pour les employés"""
    
    # Champs affichés dans la liste
    list_display = [
        'username', 'email', 'employee_id', 'full_name', 
        'role', 'statut', 'is_active', 'date_joined'
    ]
    
    # Filtres dans la barre latérale
    list_filter = [
        'role', 'statut', 'is_active', 'date_joined'
    ]
    
    # Champs de recherche
    search_fields = [
        'username', 'email', 'first_name', 'last_name', 'employee_id'
    ]
    
    # Ordre par défaut
    ordering = ['-date_joined']
    
    # Organisation des champs dans le formulaire
    fieldsets = (
        ('Informations de connexion', {
            'fields': ('username', 'password')
        }),
        ('Informations personnelles', {
            'fields': ('first_name', 'last_name', 'email', 'phone')
        }),
        ('Informations professionnelles', {
            'fields': ('employee_id', 'role', 'statut')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Dates importantes', {
            'fields': ('last_login', 'date_joined')
        }),
    )
    
    # Champs dans le formulaire d'ajout
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'phone',
                'employee_id', 'role', 'statut'
            ),
        }),
    )
    
    # Champs en lecture seule
    readonly_fields = ['date_joined', 'last_login']
    
    def full_name(self, obj):
        """Afficher le nom complet dans la liste"""
        return obj.get_full_name()
    full_name.short_description = 'Nom complet'