# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class Employee(AbstractUser):
    """
    Modèle personnalisé pour les employés de la banque
    AbstractUser contient déjà : username, password, email, first_name, last_name
    """
    
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrateur'
        AGENT = 'AGENT', 'Agent'
        SUPERVISOR = 'SUPERVISOR', 'Superviseur'
    
    class Statut(models.TextChoices):
        ACTIF = 'ACTIF', 'Actif'
        INACTIF = 'INACTIF', 'Inactif'
        SUSPENDU = 'SUSPENDU', 'Suspendu'
    
    # Champs personnalisés
    employee_id = models.CharField(max_length=20, unique=True, verbose_name="ID Employé")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    role = models.CharField(
        max_length=15, 
        choices=Role.choices, 
        default=Role.AGENT,
        verbose_name="Rôle"
    )
    statut = models.CharField(
        max_length=15,
        choices=Statut.choices,
        default=Statut.ACTIF,
        verbose_name="Statut"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    
    class Meta:
        verbose_name = "Employé"
        verbose_name_plural = "Employés"
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.get_full_name()} - {self.employee_id}"
    
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    @property
    def is_supervisor(self):
        return self.role == self.Role.SUPERVISOR
    
    @property
    def is_agent(self):
        return self.role == self.Role.AGENT