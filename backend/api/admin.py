# api/admin.py
# Este archivo registra los modelos de la aplicación para que puedan ser gestionados a través del panel de administración de Django.

from django.contrib import admin
from .models import (
    Roles, Sucursales, PerfilUsuario, Clientes,
    Categorias, Productos, StockSucursal,
    Cotizaciones, DetalleCotizacion, HistorialSeguimiento
)

# Registrar los modelos para que aparezcan en /admin
admin.site.register(Roles)
admin.site.register(Sucursales)
admin.site.register(PerfilUsuario)
admin.site.register(Clientes)
admin.site.register(Categorias)
admin.site.register(Productos)
admin.site.register(StockSucursal)
admin.site.register(Cotizaciones)
admin.site.register(DetalleCotizacion)
admin.site.register(HistorialSeguimiento)