# notifications/serializers.py
from rest_framework import serializers
from .models import Notification
from django.utils import timezone

class NotificationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour afficher les notifications"""
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    temps_ecoule = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'type_display',
            'is_read', 'temps_ecoule', 'created_at'
        ]
    
    def get_temps_ecoule(self, obj):
        """Calcule le temps écoulé depuis la création"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 30:
            mois = diff.days // 30
            return f"il y a {mois} mois" if mois == 1 else f"il y a {mois} mois"
        
        if diff.days > 0:
            return f"il y a {diff.days} jour(s)"
        
        if diff.seconds >= 3600:
            heures = diff.seconds // 3600
            return f"il y a {heures} heure(s)"
        
        if diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"il y a {minutes} minute(s)"
        
        return "à l'instant"


class MarkReadSerializer(serializers.Serializer):
    """Pour marquer des notifications comme lues"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Liste des IDs à marquer comme lus"
    )
    mark_all = serializers.BooleanField(
        default=False,
        help_text="Marquer toutes les notifications comme lues"
    )
    
    def validate(self, data):
        if not data.get('mark_all') and not data.get('notification_ids'):
            raise serializers.ValidationError(
                "Vous devez fournir 'notification_ids' ou mettre 'mark_all' à true."
            )
        return data