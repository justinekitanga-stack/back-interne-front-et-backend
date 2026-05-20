# clients/models.py
from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
import random
import string
from datetime import date

class Client(models.Model):
    """
    Modèle représentant un client de la banque.
    Le client pourra se connecter sur l'app externe avec son numéro de compte et mot de passe.
    """
    
    # Choix
    class Genre(models.TextChoices):
        MASCULIN = 'M', 'Masculin'
        FEMININ = 'F', 'Féminin'
    
    class Devise(models.TextChoices):
        USD = 'USD', 'Dollar Américain ($)'
    
    class TypeCompte(models.TextChoices):
        EPARGNE = 'EPARGNE', 'Compte Épargne'
        COURANT = 'COURANT', 'Compte Courant'
        SALAIRE = 'SALAIRE', 'Compte Salaire'
    
    class StatutCompte(models.TextChoices):
        INACTIF = 'INACTIF', 'Inactif'
        ACTIF = 'ACTIF', 'Actif'
        BLOQUE = 'BLOQUE', 'Bloqué'
        CLOTURE = 'CLOTURE', 'Clôturé'
    
    # Informations personnelles
    nom = models.CharField(max_length=100)
    post_nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20)
    birthday = models.DateField()
    genre = models.CharField(max_length=1, choices=Genre.choices)
    
    # Documents
    carte_identite = models.ImageField(upload_to='clients/identites/%Y/%m/')
    photo_passeport = models.ImageField(upload_to='clients/photos/%Y/%m/')
    
    # Compte bancaire
    numero_compte = models.CharField(max_length=20, unique=True, editable=False)
    devise = models.CharField(max_length=3, choices=Devise.choices, default=Devise.USD)
    type_compte = models.CharField(max_length=10, choices=TypeCompte.choices, default=TypeCompte.EPARGNE)
    solde = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # Authentification client (pour l'app externe)
    password = models.CharField(
        max_length=128, 
        verbose_name="Mot de passe",
        help_text="Le client définira son mot de passe lors de la première connexion"
    )
    password_is_set = models.BooleanField(
        default=False,
        verbose_name="Mot de passe défini",
        help_text="Indique si le client a déjà défini son mot de passe"
    )
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Métadonnées
    statut = models.CharField(max_length=10, choices=StatutCompte.choices, default=StatutCompte.INACTIF)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='clients_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['numero_compte']),
            models.Index(fields=['email']),
            models.Index(fields=['statut']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.numero_compte:
            self.numero_compte = self._generer_numero_compte()
        super().save(*args, **kwargs)
    
    def _generer_numero_compte(self):
        """Génère un numéro de compte unique de 12 chiffres"""
        while True:
            numero = ''.join(random.choices(string.digits, k=12))
            if not Client.objects.filter(numero_compte=numero).exists():
                return numero
    
    def set_password(self, raw_password):
        """Définit le mot de passe du client (hashé)"""
        self.password = make_password(raw_password)
        self.password_is_set = True
        self.save(update_fields=['password', 'password_is_set'])
    
    def check_password(self, raw_password):
        """Vérifie le mot de passe du client"""
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return f"{self.nom_complet} - {self.numero_compte}"
    
    @property
    def nom_complet(self):
        return f"{self.nom} {self.post_nom} {self.prenom}"
    
    @property
    def age(self):
        today = date.today()
        return today.year - self.birthday.year - (
            (today.month, today.day) < (self.birthday.month, self.birthday.day)
        )
    
    @property
    def is_authenticated(self):
        """Pour compatibilité avec le système d'auth"""
        return True
    
    @property
    def can_login(self):
        """Le client peut se connecter si le compte est actif et le mot de passe défini"""
        return self.statut == self.StatutCompte.ACTIF and self.password_is_set