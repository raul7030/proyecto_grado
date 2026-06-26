# api/urls.py
# Este archivo define las rutas de la API REST para la aplicación. Utiliza un router default de Django REST Framework para registrar las vistas de los ViewSets, lo que permite generar automáticamente las rutas CRUD para cada modelo. Además, se incluyen rutas específicas para la autenticación JWT, el registro de usuarios, y una ruta personalizada para ingresar stock manualmente. Estas rutas son consumidas por el frontend para interactuar con la base de datos y realizar operaciones como gestionar sucursales, clientes, productos, cotizaciones, y más.
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ingresar_stock_manual
from django.conf import settings
from django.conf.urls.static import static
from . import views

# Importamos TODAS las vistas
from .views import (
    CustomTokenObtainPairView, 
    RegisterView, 
    UserInfoView,
    SucursalViewSet, 
    ClienteViewSet, 
    CategoriaViewSet, 
    ProductoViewSet,
    StockSucursalViewSet, 
    CotizacionViewSet, 
    HistorialSeguimientoViewSet,
    MovimientoViewSet, 
    SolicitudTraspasoViewSet,
    RolViewSet,      
    UsuarioViewSet   
)

router = DefaultRouter()

# Mantenimientos Principales
router.register(r'sucursales', SucursalViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)

# Gestión de Solicitudes Web
router.register(r'solicitudes-web', views.SolicitudWebViewSet)

# Gestión de Inventario
router.register(r'stock', StockSucursalViewSet)
router.register(r'movimientos', MovimientoViewSet, basename='movimiento') 
router.register(r'traspasos', SolicitudTraspasoViewSet)

# Gestión Comercial (CRM)
router.register(r'cotizaciones', CotizacionViewSet)

# El frontend busca '/api/seguimientos/', así que registramos esa ruta exacta.
router.register(r'seguimientos', HistorialSeguimientoViewSet, basename='seguimientos')

# Gestión de Usuarios y Roles
router.register(r'roles', RolViewSet)
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    # Rutas del Router (API CRUD)
    path('', include(router.urls)),

    # Rutas de Autenticación
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/me/', UserInfoView.as_view(), name='user_info'),
    path('ingresar-stock/', ingresar_stock_manual, name='ingresar_stock_manual'),
    path('password-reset/', views.solicitar_recuperacion, name='password_reset_request'),
    path('password-reset/confirm/<str:uidb64>/<str:token>/', views.confirmar_recuperacion, name='password_reset_confirm'),
    path('chatbot/', views.chatbot_recomendacion, name='chatbot_recomendacion'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)