# notifications/admin.py
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'title', 'notification_type', 
        'is_read', 'created_at'
    ]
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Destinataire', {
            'fields': ('user',)
        }),
        ('Contenu', {
            'fields': ('title', 'message', 'notification_type')
        }),
        ('Statut', {
            'fields': ('is_read', 'read_at', 'created_at')
        }),
    )