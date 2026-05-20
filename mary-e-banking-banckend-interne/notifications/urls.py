# notifications/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Consultation
    path('list/', views.NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
    path('detail/<int:notification_id>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    
    # Actions
    path('mark-read/', views.MarkReadView.as_view(), name='mark-read'),
    path('delete/<int:notification_id>/', views.DeleteNotificationView.as_view(), name='delete-notification'),
    path('delete-all/', views.DeleteAllNotificationsView.as_view(), name='delete-all'),
]