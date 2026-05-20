# accounts/management/commands/create_admin.py
from django.core.management.base import BaseCommand
from accounts.models import Employee

class Command(BaseCommand):
    help = 'Créer un administrateur'
    
    def handle(self, *args, **options):
        if Employee.objects.filter(username='admin').exists():
            self.stdout.write(self.style.WARNING('Un admin existe déjà'))
            return
        
        admin = Employee.objects.create_superuser(
            username='admin',
            email='admin@banque.cd',
            password='Admin123@',
            first_name='Admin',
            last_name='Système',
            employee_id='EMP-000001',
            role='ADMIN',
            statut='ACTIF'
        )
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Administrateur créé avec succès!\n'
            f'   Username: admin\n'
            f'   Password: Admin123@\n'
            f'   Role: ADMIN\n'
        ))