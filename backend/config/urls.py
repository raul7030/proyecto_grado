"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # para incluir todas las URLs de app 'api'
    path('api/', include('api.urls')),
]

# 👇 2. Agregar la ruta para que Django pueda mostrar las imágenes de la carpeta 'media'
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)