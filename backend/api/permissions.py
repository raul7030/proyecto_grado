# backend/api/permissions.py
from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite lectura a todos (GET), pero escritura (POST, PUT, DELETE) solo al Administrador.
    """
    def has_permission(self, request, view):
        # GET, HEAD, OPTIONS son seguros (lectura)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Verificar si es Administrador
        try:
            # Asumimos que la relación es user -> perfilusuario -> rol -> nombre_rol
            return request.user.perfilusuario.rol.nombre_rol == 'Administrador'
        except:
            return False

class IsStockManager(permissions.BasePermission):
    """
    Permite gestionar stock a Administradores y Almaceneros.
    """
    def has_permission(self, request, view):
        # Los métodos de lectura siempre están permitidos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        try:
            rol = request.user.perfilusuario.rol.nombre_rol
            return rol in ['Administrador', 'Almacenero']
        except:
            return False