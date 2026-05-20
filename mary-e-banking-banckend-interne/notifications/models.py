# notifications/models.py
from django.db import models
from django.conf import settings

class Notification(models.Model):
    """
    Notifications in-app pour les employés de la banque.
    """
    
    class TypeNotification(models.TextChoices):
        INFO = 'INFO', 'Information'
        SUCCESS = 'SUCCESS', 'Succès'
        WARNING = 'WARNING', 'Avertissement'
        ERROR = 'ERROR', 'Erreur'
    
    # Destinataire (employé)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="Employé"
    )
    
    # Contenu
    title = models.CharField(max_length=255, verbose_name="Titre")
    message = models.TextField(verbose_name="Message")
    notification_type = models.CharField(
        max_length=10,
        choices=TypeNotification.choices,
        default=TypeNotification.INFO,
        verbose_name="Type"
    )
    
    # Statut de lecture
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de lecture")
    
    # Date de création
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    
    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.title} - {self.user}"
    
    @classmethod
    def create_notification(cls, user, title, message, notification_type='INFO'):
        """
        Méthode utilitaire pour créer une notification rapidement.
        
        Usage:
        Notification.create_notification(
            user=employe,
            title="Dépôt effectué",
            message="Dépôt de 500 USD sur le compte 123456789012",
            notification_type='SUCCESS'
        )
        """
        return cls.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type
        )
    
    @classmethod
    def get_unread_count(cls, user):
        """Retourne le nombre de notifications non lues pour un employé"""
        return cls.objects.filter(user=user, is_read=False).count()
    
    @classmethod
    def mark_as_read(cls, user, notification_ids=None):
        """
        Marque des notifications comme lues.
        Si notification_ids est None, marque TOUTES comme lues.
        """
        from django.utils import timezone
        
        queryset = cls.objects.filter(user=user, is_read=False)
        
        if notification_ids:
            queryset = queryset.filter(id__in=notification_ids)
        
        return queryset.update(is_read=True, read_at=timezone.now())