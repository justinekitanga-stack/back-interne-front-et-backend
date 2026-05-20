# clients/views.py - APP INTERNE UNIQUEMENT
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.db.models import Q
from .models import Client
from notifications.models import Notification
from .serializers import (
    ClientCreateSerializer,
    ClientDetailSerializer,
    ClientListSerializer,
    CompteActivationSerializer,
    CompteReveleSerializer,
    CompteBloqueSerializer,
    SoldeQuerySerializer,
)


import logging

logger = logging.getLogger(__name__)

class ClientCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ClientCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        client = serializer.save(created_by=request.user)
        
        # Notification pour l'employé
        Notification.objects.create(
            user=request.user,
            title="Compte créé",
            message=f"Compte {client.numero_compte} créé pour {client.nom_complet}",
            notification_type='SUCCESS'
        )
        
        # Envoyer email
        email_envoye = self._envoyer_email_creation(client)
        
        response_data = {
            'status': 'success',
            'message': f'Compte {client.numero_compte} créé avec succès',
            'data': {
                'client': ClientDetailSerializer(client).data,
                'email_envoye': email_envoye
            }
        }
        
        if not email_envoye:
            response_data['warning'] = "L'email n'a pas pu être envoyé. Veuillez noter le numéro de compte."
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    def _envoyer_email_creation(self, client):
        """Envoie le numéro de compte par email. Retourne True si succès."""
        try:
            subject = f'Votre compte bancaire - {client.numero_compte}'
            
            # Message texte simple
            message_texte = f"""
Bonjour {client.nom_complet},

Votre compte bancaire a été créé avec succès.

Détails du compte :
- Numéro de compte : {client.numero_compte}
- Type de compte : {client.get_type_compte_display()}
- Devise : USD

Votre compte sera activé prochainement par un conseiller.
Vous pourrez alors définir votre mot de passe et accéder à votre espace client.

Cordialement,
Votre Banque
            """
            
            # Envoyer l'email
            result = send_mail(
                subject=subject,
                message=message_texte,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[client.email],
                fail_silently=False,
            )
            
            logger.info(f"Email envoyé à {client.email} : {result}")
            return result > 0
            
        except Exception as e:
            logger.error(f"Erreur d'envoi d'email à {client.email}: {str(e)}")
            return False


class ClientListView(APIView):
    """Liste des clients - GET /api/clients/list/"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        clients = Client.objects.all()
        
        # Filtres
        statut = request.query_params.get('statut')
        type_compte = request.query_params.get('type_compte')
        search = request.query_params.get('search')
        
        if statut:
            clients = clients.filter(statut=statut.upper())
        if type_compte:
            clients = clients.filter(type_compte=type_compte.upper())
        if search:
            clients = clients.filter(
                Q(nom__icontains=search) |
                Q(post_nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(numero_compte__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        start = (page - 1) * limit
        end = start + limit
        
        total = clients.count()
        serializer = ClientListSerializer(clients[start:end], many=True)
        
        return Response({
            'status': 'success',
            'total': total,
            'page': page,
            'limit': limit,
            'data': serializer.data
        })


class ClientDetailView(APIView):
    """Détails d'un client - GET /api/clients/detail/{numero_compte}/"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, numero_compte):
        try:
            client = Client.objects.get(numero_compte=numero_compte)
            serializer = ClientDetailSerializer(client)
            return Response({
                'status': 'success',
                'data': serializer.data
            })
        except Client.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Client non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)


class SoldeVerificationView(APIView):
    """Vérifier le solde - GET /api/clients/solde/?numero_compte=XXX"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = SoldeQuerySerializer(data=request.query_params)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            client = Client.objects.get(numero_compte=serializer.validated_data['numero_compte'])
            
            return Response({
                'status': 'success',
                'data': {
                    'numero_compte': client.numero_compte,
                    'nom_client': client.nom_complet,
                    'solde': str(client.solde),
                    'devise': client.get_devise_display(),
                    'type_compte': client.get_type_compte_display(),
                    'statut': client.get_statut_display()
                }
            })
        except Client.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Compte non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)


class CompteActivationView(APIView):
    """Activer un compte - POST /api/clients/activer/"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = CompteActivationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        client = Client.objects.get(numero_compte=serializer.validated_data['numero_compte'])
        
        if client.statut == Client.StatutCompte.ACTIF:
            return Response({
                'status': 'info',
                'message': 'Ce compte est déjà actif.'
            })
        
        client.statut = Client.StatutCompte.ACTIF
        client.save()
        
        Notification.objects.create(
            user=request.user,
            title="Compte activé",
            message=f"Compte {client.numero_compte} activé",
            notification_type='SUCCESS'
        )
        
        return Response({
            'status': 'success',
            'message': f'Compte {client.numero_compte} activé avec succès',
            'data': {
                'numero_compte': client.numero_compte,
                'statut': client.get_statut_display()
            }
        })


class CompteReveleView(APIView):
    """Révéler un compte - POST /api/clients/reveler/"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = CompteReveleSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        clients = Client.objects.filter(email=email)
        
        if not clients.exists():
            return Response({
                'status': 'error',
                'message': 'Aucun compte trouvé avec cet email'
            }, status=status.HTTP_404_NOT_FOUND)
        
        Notification.objects.create(
            user=request.user,
            title="Révélation de compte",
            message=f"Révélation demandée pour {email}",
            notification_type='INFO'
        )
        
        return Response({
            'status': 'success',
            'message': f'{clients.count()} compte(s) trouvé(s)',
            'data': ClientListSerializer(clients, many=True).data
        })


class CompteBloqueView(APIView):
    """Bloquer un compte - POST /api/clients/bloquer/"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = CompteBloqueSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        client = Client.objects.get(numero_compte=serializer.validated_data['numero_compte'])
        
        if client.statut == Client.StatutCompte.BLOQUE:
            return Response({
                'status': 'info',
                'message': 'Ce compte est déjà bloqué.'
            })
        
        client.statut = Client.StatutCompte.BLOQUE
        client.save()
        
        raison = serializer.validated_data.get('raison', 'Non spécifiée')
        
        Notification.objects.create(
            user=request.user,
            title="Compte bloqué",
            message=f"Compte {client.numero_compte} bloqué. Raison: {raison}",
            notification_type='WARNING'
        )
        
        return Response({
            'status': 'success',
            'message': f'Compte {client.numero_compte} bloqué',
            'data': {
                'numero_compte': client.numero_compte,
                'statut': client.get_statut_display()
            }
        })