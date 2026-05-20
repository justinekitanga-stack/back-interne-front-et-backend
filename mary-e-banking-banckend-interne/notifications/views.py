# notifications/views.py
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Notification
from .serializers import NotificationSerializer, MarkReadSerializer


class NotificationListView(APIView):
    """
    Liste des notifications de l'employé connecté.
    GET /api/notifications/list/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        
        # Filtres
        type_notif = request.query_params.get('type')
        only_unread = request.query_params.get('unread', 'false').lower() == 'true'
        search = request.query_params.get('search')
        
        if type_notif:
            notifications = notifications.filter(notification_type=type_notif.upper())
        
        if only_unread:
            notifications = notifications.filter(is_read=False)
        
        if search:
            notifications = notifications.filter(
                Q(title__icontains=search) | Q(message__icontains=search)
            )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        start = (page - 1) * limit
        end = start + limit
        
        total = notifications.count()
        
        # Stats
        stats = {
            'total': total,
            'non_lues': notifications.filter(is_read=False).count(),
            'info': notifications.filter(notification_type='INFO').count(),
            'success': notifications.filter(notification_type='SUCCESS').count(),
            'warning': notifications.filter(notification_type='WARNING').count(),
            'error': notifications.filter(notification_type='ERROR').count(),
        }
        
        serializer = NotificationSerializer(notifications[start:end], many=True)
        
        return Response({
            'status': 'success',
            'stats': stats,
            'page': page,
            'limit': limit,
            'data': serializer.data
        })


class UnreadCountView(APIView):
    """
    Nombre de notifications non lues.
    GET /api/notifications/unread-count/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        count = Notification.get_unread_count(request.user)
        
        return Response({
            'status': 'success',
            'data': {
                'unread_count': count,
                'has_unread': count > 0
            }
        })


class NotificationDetailView(APIView):
    """
    Détail d'une notification et la marquer comme lue.
    GET /api/notifications/detail/{id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
            
            # Marquer comme lue automatiquement quand on voit le détail
            if not notification.is_read:
                from django.utils import timezone
                notification.is_read = True
                notification.read_at = timezone.now()
                notification.save(update_fields=['is_read', 'read_at'])
            
            serializer = NotificationSerializer(notification)
            
            return Response({
                'status': 'success',
                'data': serializer.data
            })
            
        except Notification.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Notification non trouvée'
            }, status=status.HTTP_404_NOT_FOUND)


class MarkReadView(APIView):
    """
    Marquer des notifications comme lues.
    POST /api/notifications/mark-read/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MarkReadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if serializer.validated_data.get('mark_all'):
            # Marquer toutes comme lues
            count = Notification.mark_as_read(request.user)
            message = f"Toutes vos notifications ({count}) ont été marquées comme lues."
        else:
            # Marquer des notifications spécifiques
            notification_ids = serializer.validated_data['notification_ids']
            count = Notification.mark_as_read(request.user, notification_ids)
            message = f"{count} notification(s) marquée(s) comme lue(s)."
        
        # Retourner le nouveau compte
        unread_count = Notification.get_unread_count(request.user)
        
        return Response({
            'status': 'success',
            'message': message,
            'data': {
                'marked_read': count,
                'unread_count': unread_count
            }
        })


class DeleteNotificationView(APIView):
    """
    Supprimer une notification.
    DELETE /api/notifications/delete/{id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
            notification.delete()
            
            return Response({
                'status': 'success',
                'message': 'Notification supprimée'
            })
            
        except Notification.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Notification non trouvée'
            }, status=status.HTTP_404_NOT_FOUND)


class DeleteAllNotificationsView(APIView):
    """
    Supprimer toutes les notifications.
    DELETE /api/notifications/delete-all/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request):
        count = Notification.objects.filter(user=request.user).count()
        Notification.objects.filter(user=request.user).delete()
        
        return Response({
            'status': 'success',
            'message': f'{count} notification(s) supprimée(s)'
        })