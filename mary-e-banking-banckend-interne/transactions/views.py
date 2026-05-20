# transactions/views.py
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction as db_transaction
from django.db import models
from .models import Transaction
from clients.models import Client
from notifications.models import Notification
from .serializers import (
    DepotSerializer,
    RetraitSerializer,
    TransactionDetailSerializer,
    TransactionListSerializer,
    TransfertSerializer,
)


class DepotView(APIView):
    """
    Effectuer un dépôt sur un compte.
    POST /api/transactions/depot/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @db_transaction.atomic  # Assure que tout se fait en une seule transaction DB
    def post(self, request):
        serializer = DepotSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        client = serializer.client
        montant = serializer.validated_data['montant']
        description = serializer.validated_data.get('description', '')
        
        # Sauvegarder l'ancien solde
        ancien_solde = client.solde
        
        # Mettre à jour le solde
        client.solde += montant
        client.save(update_fields=['solde', 'updated_at'])
        
        # Créer la transaction
        transaction = Transaction.objects.create(
            client=client,
            type_transaction=Transaction.TypeTransaction.DEPOT,
            montant=montant,
            description=description,
            statut=Transaction.StatutTransaction.REUSSIE,
            ancien_solde=ancien_solde,
            nouveau_solde=client.solde,
            effectue_par=request.user
        )
        
        # Notification pour l'employé
        Notification.objects.create(
            user=request.user,
            title="Dépôt effectué",
            message=f"Dépôt de {montant} USD sur le compte {client.numero_compte} "
                   f"({client.nom_complet}). Solde: {ancien_solde} → {client.solde} USD",
            notification_type='SUCCESS'
        )
        
        return Response({
            'status': 'success',
            'message': f'Dépôt de {montant} USD effectué avec succès',
            'data': {
                'transaction': TransactionDetailSerializer(transaction).data,
                'resume': {
                    'ancien_solde': str(ancien_solde),
                    'montant_depose': str(montant),
                    'nouveau_solde': str(client.solde)
                }
            }
        }, status=status.HTTP_200_OK)


class RetraitView(APIView):
    """
    Effectuer un retrait sur un compte.
    POST /api/transactions/retrait/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @db_transaction.atomic
    def post(self, request):
        serializer = RetraitSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        client = serializer.client
        montant = serializer.validated_data['montant']
        description = serializer.validated_data.get('description', '')
        
        # Vérification supplémentaire du solde
        if client.solde < montant:
            return Response({
                'status': 'error',
                'message': 'Solde insuffisant',
                'data': {
                    'solde_disponible': str(client.solde),
                    'montant_demande': str(montant)
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sauvegarder l'ancien solde
        ancien_solde = client.solde
        
        # Mettre à jour le solde
        client.solde -= montant
        client.save(update_fields=['solde', 'updated_at'])
        
        # Créer la transaction
        transaction = Transaction.objects.create(
            client=client,
            type_transaction=Transaction.TypeTransaction.RETRAIT,
            montant=montant,
            description=description,
            statut=Transaction.StatutTransaction.REUSSIE,
            ancien_solde=ancien_solde,
            nouveau_solde=client.solde,
            effectue_par=request.user
        )
        
        # Notification pour l'employé
        Notification.objects.create(
            user=request.user,
            title="Retrait effectué",
            message=f"Retrait de {montant} USD du compte {client.numero_compte} "
                   f"({client.nom_complet}). Solde: {ancien_solde} → {client.solde} USD",
            notification_type='SUCCESS'
        )
        
        return Response({
            'status': 'success',
            'message': f'Retrait de {montant} USD effectué avec succès',
            'data': {
                'transaction': TransactionDetailSerializer(transaction).data,
                'resume': {
                    'ancien_solde': str(ancien_solde),
                    'montant_retire': str(montant),
                    'nouveau_solde': str(client.solde)
                }
            }
        }, status=status.HTTP_200_OK)


class TransactionListView(APIView):
    """
    Liste des transactions avec filtres.
    GET /api/transactions/list/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        transactions = Transaction.objects.select_related('client', 'effectue_par').all()
        
        # Filtres
        type_transaction = request.query_params.get('type')
        numero_compte = request.query_params.get('compte')
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        employe_id = request.query_params.get('employe')
        
        if type_transaction:
            transactions = transactions.filter(type_transaction=type_transaction.upper())
        
        if numero_compte:
            transactions = transactions.filter(client__numero_compte=numero_compte)
        
        if date_debut:
            transactions = transactions.filter(created_at__date__gte=date_debut)
        
        if date_fin:
            transactions = transactions.filter(created_at__date__lte=date_fin)
        
        if employe_id:
            transactions = transactions.filter(effectue_par__employee_id=employe_id)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        start = (page - 1) * limit
        end = start + limit
        
        total = transactions.count()
        
        # Statistiques
        total_depots = transactions.filter(type_transaction='DEPOT').count()
        total_retraits = transactions.filter(type_transaction='RETRAIT').count()
        montant_total_depots = transactions.filter(type_transaction='DEPOT').values_list('montant', flat=True)
        montant_total_retraits = transactions.filter(type_transaction='RETRAIT').values_list('montant', flat=True)
        
        serializer = TransactionListSerializer(transactions[start:end], many=True)
        
        return Response({
            'status': 'success',
            'total': total,
            'page': page,
            'limit': limit,
            'stats': {
                'nombre_depots': total_depots,
                'nombre_retraits': total_retraits,
                'total_depots': str(sum(montant_total_depots)),
                'total_retraits': str(sum(montant_total_retraits)),
            },
            'data': serializer.data
        })


class TransactionDetailView(APIView):
    """
    Détails d'une transaction.
    GET /api/transactions/detail/{reference}/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, reference):
        try:
            transaction = Transaction.objects.select_related(
                'client', 'effectue_par'
            ).get(reference=reference)
            
            serializer = TransactionDetailSerializer(transaction)
            
            return Response({
                'status': 'success',
                'data': serializer.data
            })
            
        except Transaction.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Transaction non trouvée'
            }, status=status.HTTP_404_NOT_FOUND)


class ReleveCompteView(APIView):
    """
    Relevé de compte (historique des transactions d'un client).
    GET /api/transactions/releve/?compte=XXX&date_debut=YYYY-MM-DD&date_fin=YYYY-MM-DD
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        numero_compte = request.query_params.get('compte')
        
        if not numero_compte:
            return Response({
                'status': 'error',
                'message': 'Le paramètre "compte" est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            client = Client.objects.get(numero_compte=numero_compte)
        except Client.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Compte non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        
        transactions = Transaction.objects.filter(client=client)
        
        # Filtres de date
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        
        if date_debut:
            transactions = transactions.filter(created_at__date__gte=date_debut)
        if date_fin:
            transactions = transactions.filter(created_at__date__lte=date_fin)
        
        # Calculer le solde d'ouverture (avant date_debut)
        solde_ouverture = client.solde
        if date_debut:
            transactions_apres = Transaction.objects.filter(
                client=client,
                created_at__date__gte=date_debut
            ).aggregate(
                total_depots=models.Sum('montant', filter=models.Q(type_transaction='DEPOT')),
                total_retraits=models.Sum('montant', filter=models.Q(type_transaction='RETRAIT'))
            )
            solde_ouverture = client.solde - (
                (transactions_apres['total_depots'] or 0) - 
                (transactions_apres['total_retraits'] or 0)
            )
        
        serializer = TransactionListSerializer(transactions, many=True)
        
        return Response({
            'status': 'success',
            'data': {
                'client': {
                    'nom': client.nom_complet,
                    'numero_compte': client.numero_compte,
                    'type_compte': client.get_type_compte_display(),
                    'solde_actuel': str(client.solde),
                },
                'solde_ouverture': str(solde_ouverture),
                'nombre_transactions': transactions.count(),
                'transactions': serializer.data
            }
        })
    
class TransfertView(APIView):
    """
    Effectuer un transfert entre deux comptes.
    POST /api/transactions/transfert/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @db_transaction.atomic
    def post(self, request):
        serializer = TransfertSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        compte_source = serializer.compte_source
        compte_dest = serializer.compte_dest
        montant = serializer.validated_data['montant']
        description = serializer.validated_data.get('description', '')
        
        # Vérifier le solde du compte source
        if compte_source.solde < montant:
            return Response({
                'status': 'error',
                'message': 'Solde insuffisant sur le compte source',
                'data': {
                    'solde_disponible': str(compte_source.solde),
                    'montant_demande': str(montant)
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sauvegarder les anciens soldes
        ancien_solde_source = compte_source.solde
        ancien_solde_dest = compte_dest.solde
        
        # Effectuer le transfert
        compte_source.solde -= montant
        compte_dest.solde += montant
        
        compte_source.save(update_fields=['solde', 'updated_at'])
        compte_dest.save(update_fields=['solde', 'updated_at'])
        
        # Créer la transaction de retrait (source)
        transaction_source = Transaction.objects.create(
            client=compte_source,
            type_transaction=Transaction.TypeTransaction.TRANSFERT,
            montant=montant,
            description=f"Transfert vers {compte_dest.numero_compte} - {compte_dest.nom_complet}. {description}",
            statut=Transaction.StatutTransaction.REUSSIE,
            ancien_solde=ancien_solde_source,
            nouveau_solde=compte_source.solde,
            effectue_par=request.user
        )
        
        # Créer la transaction de dépôt (destination)
        transaction_dest = Transaction.objects.create(
            client=compte_dest,
            type_transaction=Transaction.TypeTransaction.TRANSFERT,
            montant=montant,
            description=f"Transfert reçu de {compte_source.numero_compte} - {compte_source.nom_complet}. {description}",
            statut=Transaction.StatutTransaction.REUSSIE,
            ancien_solde=ancien_solde_dest,
            nouveau_solde=compte_dest.solde,
            effectue_par=request.user
        )
        
        # Notification pour l'employé
        Notification.objects.create(
            user=request.user,
            title="Transfert effectué",
            message=f"Transfert de {montant} USD du compte {compte_source.numero_compte} "
                   f"vers {compte_dest.numero_compte}",
            notification_type='SUCCESS'
        )
        
        return Response({
            'status': 'success',
            'message': f'Transfert de {montant} USD effectué avec succès',
            'data': {
                'source': {
                    'compte': compte_source.numero_compte,
                    'client': compte_source.nom_complet,
                    'ancien_solde': str(ancien_solde_source),
                    'nouveau_solde': str(compte_source.solde)
                },
                'destination': {
                    'compte': compte_dest.numero_compte,
                    'client': compte_dest.nom_complet,
                    'ancien_solde': str(ancien_solde_dest),
                    'nouveau_solde': str(compte_dest.solde)
                },
                'transaction_source': TransactionDetailSerializer(transaction_source).data,
                'transaction_dest': TransactionDetailSerializer(transaction_dest).data,
            }
        }, status=status.HTTP_200_OK)