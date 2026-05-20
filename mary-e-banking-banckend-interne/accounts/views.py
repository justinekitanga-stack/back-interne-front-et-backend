# accounts/views.py
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import Employee
from .serializers import (
    EmployeeSerializer,
    EmployeeCreateSerializer,
    LoginSerializer,
    CustomTokenObtainPairSerializer
)

class LoginView(TokenObtainPairView):
    """Connexion des employés - Retourne les tokens JWT"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

class ProfileView(APIView):
    """Voir son propre profil"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = EmployeeSerializer(request.user)
        return Response({
            'status': 'success',
            'data': serializer.data
        })

class EmployeeCreateView(APIView):
    """Créer un employé (admin seulement)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def has_permission(self, request):
        return request.user.role == Employee.Role.ADMIN
    
    def post(self, request):
        if not self.has_permission(request):
            return Response(
                {'error': 'Permission refusée. Admin seulement.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = EmployeeCreateSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return Response({
                'status': 'success',
                'message': f'Employé {employee.username} créé avec succès',
                'data': EmployeeSerializer(employee).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class EmployeeListView(APIView):
    """Liste des employés (admin, supervisor)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def has_permission(self, request):
        return request.user.role in [Employee.Role.ADMIN, Employee.Role.SUPERVISOR]
    
    def get(self, request):
        if not self.has_permission(request):
            return Response(
                {'error': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        employees = Employee.objects.all().order_by('-date_joined')
        serializer = EmployeeSerializer(employees, many=True)
        return Response({
            'status': 'success',
            'count': employees.count(),
            'data': serializer.data
        })

class EmployeeDetailView(APIView):
    """Détails d'un employé"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, employee_id):
        try:
            employee = Employee.objects.get(employee_id=employee_id)
            serializer = EmployeeSerializer(employee)
            return Response({
                'status': 'success',
                'data': serializer.data
            })
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employé non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

class EmployeeStatusView(APIView):
    """Activer/Désactiver un employé (admin seulement)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, employee_id):
        if request.user.role != Employee.Role.ADMIN:
            return Response(
                {'error': 'Admin seulement'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            employee = Employee.objects.get(employee_id=employee_id)
            nouveau_statut = request.data.get('statut')
            
            if nouveau_statut not in Employee.Statut.values:
                return Response(
                    {'error': 'Statut invalide'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            employee.statut = nouveau_statut
            employee.save()
            
            return Response({
                'status': 'success',
                'message': f'Statut de {employee.username} changé à {nouveau_statut}'
            })
            
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employé non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )