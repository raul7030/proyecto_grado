# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from .permissions import IsAdminOrReadOnly, IsStockManager
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
# Importaciones de Django
from django.contrib.auth.models import User
# Importaciones para JWT
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes

# Importaciones Locales (Modelos y Serializers)
from .models import (
    Roles, Sucursales, PerfilUsuario,
    Clientes, Categorias, Productos, StockSucursal,
    Cotizaciones, DetalleCotizacion, HistorialSeguimiento,
    Movimiento, SolicitudTraspaso,
    SolicitudesWeb
)

from .serializers import (
    RegisterSerializer, UserSerializer,
    SucursalSerializer, ClienteSerializer, CategoriaSerializer,
    ProductoSerializer, StockSucursalSerializer,
    CotizacionSerializer, HistorialSeguimientoSerializer,
    MovimientoSerializer, SolicitudTraspasoSerializer,
    RolSerializer,
    SolicitudWebSerializer
)

from .nlp_engine import motor_nlp
import re
from django.db.models import Q

# 1. DICCIONARIO PARA ENTIDADES
NUMEROS_TEXTO = {
    "un": 1, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4, 
    "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10
}

# 2. FUNCIÓN DE EXTRACCIÓN DE DATOS TÉCNICOS
def extraer_datos_tecnicos(mensaje):
    """Extrae Pisos, Metros y Caballos de Fuerza (HP) del texto"""
    datos = {"pisos": None, "metros": None, "hp": None, "quiere_silencio": False}
    
    # Extraer pisos
    match_pisos = re.search(r'(?i)(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*(piso|planta)', mensaje)
    if match_pisos:
        val = match_pisos.group(1)
        datos["pisos"] = int(val) if val.isdigit() else NUMEROS_TEXTO.get(val.lower(), 2)
        
    # Extraer metros
    match_metros = re.search(r'(?i)(\d+)\s*(metro|m)', mensaje)
    if match_metros:
        datos["metros"] = int(match_metros.group(1))
        
    # Extraer HP
    match_hp = re.search(r'(?i)(\d+(\.\d+)?)\s*hp', mensaje)
    if match_hp:
        datos["hp"] = float(match_hp.group(1))

    # Detectar necesidad especial
    if "silencios" in mensaje or "ruido" in mensaje:
        datos["quiere_silencio"] = True
        
    return datos


#==============================================================================
# ENDPOINT PRINCIPAL: DASHBOARD GERENCIAL
#==============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_gerencial(request):
    # 1. CAPTURAR FILTROS
    mes = request.GET.get('mes', str(datetime.datetime.now().month))
    anio = int(request.GET.get('anio', datetime.datetime.now().year))
    id_usuario = request.GET.get('id_usuario', '')
    id_cliente = request.GET.get('id_cliente', '')

    # 2. CONSTRUIR EL QUERYSET BASE FILTRADO
    qs = Cotizacion.objects.filter(fecha__year=anio)
    
    if mes != 'todos':
        qs = qs.filter(fecha__month=int(mes))
    if id_usuario:
        qs = qs.filter(id_usuario_id=id_usuario)
    if id_cliente:
        qs = qs.filter(id_cliente_id=id_cliente)

    # 3. KPIs PRINCIPALES (Una sola consulta a la BD)
    # Asume que CotizacionProducto tiene un 'related_name' llamado 'detalles' en el modelo Cotizacion.
    kpis = qs.aggregate(
        total_cotizaciones=Count('id_cotizacion', distinct=True),
        monto_total=Sum(F('detalles__cantidad') * F('detalles__precio'), output_field=DecimalField()),
        dinero_ventas_reales=Sum(
            Case(When(venta='Si', then=F('detalles__cantidad') * F('detalles__precio')), default=0, output_field=DecimalField())
        ),
        dinero_alta=Sum(
            Case(When(oportunidad_venta='Alta', then=F('detalles__cantidad') * F('detalles__precio')), default=0, output_field=DecimalField())
        ),
        count_alta=Count(Case(When(oportunidad_venta='Alta', then=1))),
        count_media=Count(Case(When(oportunidad_venta='Media', then=1))),
        count_baja=Count(Case(When(oportunidad_venta='Baja', then=1))),
    )

    # 4. TOP PRODUCTO
    top_producto = CotizacionProducto.objects.filter(id_cotizacion__in=qs).values(
        'id_producto__item' # O 'id_producto__nombre_producto' según tu modelo
    ).annotate(
        total_cantidad=Sum('cantidad')
    ).order_by('-total_cantidad').first()

    # 5. RANKINGS VENDEDORES
    rank_vend_cant = qs.values('id_usuario__id_usuario', 'id_usuario__nombre').annotate(
        cantidad=Count('id_cotizacion', distinct=True)
    ).order_by('-cantidad')[:3]

    rank_vend_exito = qs.filter(venta='Si').values('id_usuario__id_usuario', 'id_usuario__nombre').annotate(
        monto_ventas=Sum(F('detalles__cantidad') * F('detalles__precio'), output_field=DecimalField())
    ).order_by('-monto_ventas')[:3]

    # 6. RANKINGS CLIENTES
    rank_cli_cant = qs.values('id_cliente__id_cliente', 'id_cliente__razon_social').annotate(
        cantidad=Count('id_cotizacion', distinct=True)
    ).order_by('-cantidad')[:5]

    rank_cli_exito = qs.filter(venta='Si').values('id_cliente__id_cliente', 'id_cliente__razon_social').annotate(
        monto_ventas=Sum(F('detalles__cantidad') * F('detalles__precio'), output_field=DecimalField())
    ).order_by('-monto_ventas')[:5]

    # 7. DATOS GRÁFICOS (Evolución de Cotizaciones por Mes)
    historial = qs.annotate(mes_fecha=TruncMonth('fecha')).values('mes_fecha', 'oportunidad_venta').annotate(
        total=Count('id_cotizacion', distinct=True)
    )

    data_grafico = {
        'Alta': {str(i).zfill(2): 0 for i in range(1, 13)},
        'Media': {str(i).zfill(2): 0 for i in range(1, 13)},
        'Baja': {str(i).zfill(2): 0 for i in range(1, 13)},
    }
    for h in historial:
        mes_str = h['mes_fecha'].strftime('%m')
        oportunidad = h['oportunidad_venta']
        if oportunidad in data_grafico:
            data_grafico[oportunidad][mes_str] = h['total']

    # PREPARAR RESPUESTA JSON
    return Response({
        'kpis': {
            'montoTotal': float(kpis['monto_total'] or 0),
            'totalGlobal': kpis['total_cotizaciones'],
            'montoVentasSi': float(kpis['dinero_ventas_reales'] or 0),
            'montoAlta': float(kpis['dinero_alta'] or 0),
            'countAlta': kpis['count_alta'],
            'countMedia': kpis['count_media'],
            'countBaja': kpis['count_baja'],
            'topProducto': top_producto['id_producto__item'] if top_producto else 'Sin datos',
            'topProductoCant': top_producto['total_cantidad'] if top_producto else 0,
        },
        'rankings': {
            'vendedoresCant': list(rank_vend_cant),
            'vendedoresExito': list(rank_vend_exito),
            'clientesCant': list(rank_cli_cant),
            'clientesExito': list(rank_cli_exito)
        },
        'graficos': {
            'dataAlta': list(data_grafico['Alta'].values()),
            'dataMedia': list(data_grafico['Media'].values()),
            'dataBaja': list(data_grafico['Baja'].values())
        }
    })



##==============================================================================
# ENDPOINT ESPECIAL: CHATBOT DE RECOMENDACIÓN DE PRODUCTOS
##==============================================================================
@api_view(['POST'])
@permission_classes([AllowAny]) 
def chatbot_recomendacion(request):
    mensaje = request.data.get('mensaje', '').lower()
    
    # 1. PREDICCIÓN Y EXTRACCIÓN
    intencion = motor_nlp.predecir_intencion(mensaje)
    entidades = extraer_datos_tecnicos(mensaje) # <--- EXTRACCIÓN DE ENTIDADES
    
    respuesta_texto = ""
    productos_sugeridos = []
    productos = None

    # 2. LÓGICA DE NEGOCIO Y FILTROS
    if intencion == "saludo":
        respuesta_texto = "¡Hola! Soy el Asistente Técnico de San Rafael. ¿Para qué uso necesitas la bomba? (Ej: subir agua a 3 pisos, vaciar una piscina, riego agrícola)."
        
    elif intencion == "bomba_piscina":
        respuesta_texto = "Para tratamiento de piscinas necesitas una bomba autocebante con trampa de pelo. Te recomiendo estos equipos:"
        candidatos = Productos.objects.filter(
            Q(categoria__nombre_categoria__icontains='piscina') | Q(descripcion__icontains='piscina') | Q(descripcion__icontains='autocebante')
        ).distinct()
        productos = motor_nlp.recomendar_por_similitud_neuronal(mensaje, candidatos)
        
    elif intencion == "bomba_domiciliaria":
        pisos = entidades["pisos"] or 2 # Default a 2 pisos

        # MURO DE CONTENCIÓN: Qué NO debe entrar
        exclusiones = Q(categoria__nombre_categoria__icontains='drenaje') | \
                      Q(categoria__nombre_categoria__icontains='piscina') | \
                      Q(categoria__nombre_categoria__icontains='sumergible') | \
                      Q(nombre_producto__icontains='vortex') | \
                      Q(nombre_producto__icontains='achique') | \
                      Q(descripcion__icontains='aguas negras') | \
                      Q(descripcion__icontains='lodo')
        
        # RESPUESTA DINÁMICA Y BÚSQUEDA EXCLUYENTE
        if entidades["quiere_silencio"]:
            respuesta_texto = "Entiendo que el ruido es una preocupación. Para uso residencial, una bomba silenciosa o multi-impulsor es ideal para mantener el confort. Te sugiero estas opciones:"
            candidatos_base = Q(descripcion__icontains='silencios') | Q(nombre_producto__icontains='CPM')
            
        elif entidades["hp"]:
            respuesta_texto = f"Buscando opciones domiciliarias de aproximadamente {entidades['hp']} HP. Una bomba periférica o centrífuga te dará el rendimiento esperado:"
            candidatos_base = Q(nombre_producto__icontains='PKM') | Q(nombre_producto__icontains='CP')
            
        elif pisos <= 3:
            respuesta_texto = f"Para {pisos} pisos, la altura no es problema. Una bomba periférica económica te funcionará perfectamente:"
            candidatos_base = Q(sku__icontains='PKM') | Q(nombre_producto__icontains='PKM') | Q(descripcion__icontains='periferica') | Q(descripcion__icontains='casa')
            
        else:
            respuesta_texto = f"Al tratarse de {pisos} pisos, necesitas empuje extra. Una centrífuga de mayor potencia es lo técnicamente correcto:"
            candidatos_base = Q(sku__icontains='CP') | Q(nombre_producto__icontains='CP') | Q(descripcion__icontains='centrifuga') | Q(descripcion__icontains='presion')
            
        # filter(base).exclude(exclusiones)
        candidatos = Productos.objects.filter(candidatos_base).exclude(exclusiones).distinct()
        productos = motor_nlp.recomendar_por_similitud_neuronal(mensaje, candidatos)

    elif intencion == "bomba_civil":
        altura_texto = f" {entidades['metros']} metros" if entidades['metros'] else "gran altura"
        respuesta_texto = f"Para edificios y presurización a {altura_texto}, los equipos multietapa o grupos de presión son la norma. Revisa estos modelos:"
        
        exclusiones_civil = Q(categoria__nombre_categoria__icontains='drenaje') | Q(nombre_producto__icontains='vortex')
        
        candidatos = Productos.objects.filter(
            Q(categoria__nombre_categoria__icontains='civil') | Q(sku__icontains='CVX') | Q(descripcion__icontains='multietapa') | Q(descripcion__icontains='edificio')
        ).exclude(exclusiones_civil).distinct()
        
        productos = motor_nlp.recomendar_por_similitud_neuronal(mensaje, candidatos)
            
    elif intencion == "bomba_sumergible":
        respuesta_texto = "Para pozos profundos necesitas equipos tipo lápiz que soporten la inmersión constante. Estos son nuestros modelos sumergibles:"
        candidatos = Productos.objects.filter(
            Q(categoria__nombre_categoria__icontains='sumergible') | Q(descripcion__icontains='pozo') | Q(sku__icontains='4SR')
        ).distinct()
        productos = motor_nlp.recomendar_por_similitud_neuronal(mensaje, candidatos)
            
    elif intencion == "bomba_riego":
        respuesta_texto = "El riego requiere buen caudal continuo. Dependiendo de tu fuente de agua, estas motobombas o centrífugas de gran caudal te servirán:"
        candidatos = Productos.objects.filter(
            Q(categoria__nombre_categoria__icontains='riego') | Q(descripcion__icontains='riego') | Q(descripcion__icontains='caudal') | Q(nombre_producto__icontains='motobomba')
        ).distinct()
        productos = motor_nlp.recomendar_por_similitud_neuronal(mensaje, candidatos)
    
    elif intencion == "bomba_drenaje":
        respuesta_texto = "Para vaciar agua estancada o lodo, requieres una bomba sumergible de achique (tipo Vortex). Estas son excelentes opciones:"
        candidatos = Productos.objects.filter(
            Q(categoria__nombre_categoria__icontains='drenaje') | Q(descripcion__icontains='drenaje') | Q(descripcion__icontains='sucia') | Q(nombre_producto__icontains='achique')
        ).distinct()
        productos = motor_nlp.recomendar_por_similitud_neuronal(mensaje, candidatos)
        
    else:
        respuesta_texto = "No logré identificar la aplicación técnica de la bomba. ¿Me podrías indicar si es para casa, un edificio, sacar agua de pozo o para riego?"

    # 3. FORMATEAMOS LOS PRODUCTOS
    if productos:
        for p in productos:
            imagen_url = request.build_absolute_uri(p.imagen.url) if (hasattr(p, 'imagen') and p.imagen) else None
            productos_sugeridos.append({
                'id': p.id_producto,
                'nombre': p.nombre_producto,
                'descripcion': (p.descripcion[:80] + '...') if p.descripcion else 'Sin descripción',
                'precio': str(p.precio_base),
                'sku': p.sku,
                'imagen': imagen_url
            })

    return Response({
        'respuesta': respuesta_texto,
        'productos': productos_sugeridos,
        'intencion_detectada': intencion,
        'datos_extraidos': entidades 
    })



# ==============================================================================
# 1. AUTENTICACIÓN Y USUARIOS
# ==============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # 1. Guardar datos básicos del usuario
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_superuser'] = user.is_superuser
        token['user_id'] = user.id

        # 2. Extraer datos relacionados del Perfil (Roles y Sucursal)
        try:
            perfil = PerfilUsuario.objects.get(user=user)
            
            # Nombre y ID del Rol
            token['rol'] = perfil.rol.nombre_rol if perfil.rol else None
            
            # Nombre y ID de la Sucursal
            if perfil.sucursal:
                token['sucursal_usuario'] = perfil.sucursal.nombre  # Para el texto del Dashboard
                token['sucursal_id'] = perfil.sucursal.id_sucursal  # Para las validaciones lógicas
            else:
                token['sucursal_usuario'] = 'Principal'
                token['sucursal_id'] = None
                
        except PerfilUsuario.DoesNotExist:
            token['rol'] = None
            token['sucursal_usuario'] = 'Principal'
            token['sucursal_id'] = None

        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated] 
    serializer_class = RegisterSerializer

class UserInfoView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ==============================================================================
# 2. MANTENIMIENTOS (CORE)
# ==============================================================================

class SucursalViewSet(viewsets.ModelViewSet):
    queryset = Sucursales.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Clientes.objects.all().order_by('-created_at')
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creado_por_usuario=self.request.user)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categorias.objects.all().order_by('nombre_categoria')
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Productos.objects.all().order_by('nombre_producto')
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


# ==============================================================================
# 3. GESTIÓN CENTRALIZADA DE STOCK (EL GUARDIÁN DEL INVENTARIO)
# ==============================================================================

class StockSucursalViewSet(viewsets.ModelViewSet):
    """
    Controla el Stock. Detecta ediciones manuales y registra 'AJUSTE'.
    Permite registrar ingresos/compras vía endpoint especial.
    """
    queryset = StockSucursal.objects.all()
    serializer_class = StockSucursalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Permite filtrar stock por producto y sucursal específica
        queryset = super().get_queryset()
        producto_id = self.request.query_params.get('producto')
        sucursal_id = self.request.query_params.get('sucursal')
        
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
        return queryset

    # --- A: DETECTAR CAMBIOS MANUALES Y CREAR KARDEX 'AJUSTE' ---
    def perform_update(self, serializer):
        # 1. Obtener datos antes del cambio
        instance = self.get_object()
        cantidad_anterior = instance.cantidad
        
        # 2. Guardar cambio
        stock_nuevo = serializer.save()
        cantidad_nueva = stock_nuevo.cantidad
        
        # 3. Calcular diferencia
        diferencia = cantidad_nueva - cantidad_anterior
        
        # 4. Si hubo cambio, registrar en Kardex automáticamente
        if diferencia != 0:
            Movimiento.objects.create(
                producto=stock_nuevo.producto,
                sucursal=stock_nuevo.sucursal,
                tipo='AJUSTE',
                cantidad=diferencia, # Puede ser + o -
                saldo_historico=cantidad_nueva,
                usuario=self.request.user,
                referencia=f"Corrección Manual de Stock ({cantidad_anterior} -> {cantidad_nueva})"
            )

    # --- B: REGISTRAR INGRESO (COMPRAS / IMPORTACIONES) ---
    @action(detail=False, methods=['post'], url_path='ingreso')
    def registrar_ingreso(self, request):
        producto_id = request.data.get('producto')
        sucursal_id = request.data.get('sucursal')
        cantidad = float(request.data.get('cantidad', 0))
        referencia = request.data.get('referencia', 'Ingreso de Mercadería')

        if not producto_id or not sucursal_id or cantidad <= 0:
            return Response({'error': 'Datos inválidos. Requiere producto, sucursal y cantidad > 0'}, status=400)

        with transaction.atomic():
            # Buscar o Crear Stock en esa sucursal
            stock, created = StockSucursal.objects.select_for_update().get_or_create(
                producto_id=producto_id,
                sucursal_id=sucursal_id,
                defaults={'cantidad': 0}
            )

            # Sumar Stock
            stock.cantidad += cantidad
            stock.save()

            # Crear Kardex
            Movimiento.objects.create(
                producto_id=producto_id,
                sucursal_id=sucursal_id,
                tipo='ENTRADA',
                cantidad=cantidad,
                saldo_historico=stock.cantidad,
                usuario=request.user,
                referencia=referencia
            )

        return Response({'status': 'Ingreso registrado correctamente', 'nuevo_saldo': stock.cantidad})


# ==============================================================================
# 4. LÓGICA DE NEGOCIO (COTIZACIONES Y CRM)
# ==============================================================================
class CotizacionViewSet(viewsets.ModelViewSet):
    queryset = Cotizaciones.objects.all().order_by('-fecha_creacion')
    serializer_class = CotizacionSerializer
    permission_classes = [IsAuthenticated]

    # --- NUEVO MÉTODO PARA SOPORTAR FILTROS DESDE REACT ---
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Capturar parámetros de la URL
        cliente_id = self.request.query_params.get('cliente')
        estado = self.request.query_params.get('estado')
        
        # Aplicar filtros si existen en la petición
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
            
        if estado:
            queryset = queryset.filter(estado__iexact=estado)
            
        return queryset

    def perform_create(self, serializer):
        try:
            perfil = self.request.user.perfilusuario
            serializer.save(
                usuario_vendedor=self.request.user, 
                sucursal=perfil.sucursal
            )
        except PerfilUsuario.DoesNotExist:
            raise PermissionDenied("El usuario no tiene un perfil asignado.")

    def perform_update(self, serializer):
        """
        Lógica Profesional de Transición de Estados.
        Detecta cambios de estado y ajusta el inventario automáticamente.
        """
        # 1. Obtener la instancia ANTES de guardar (para saber cómo estaba)
        cotizacion = self.get_object()
        estado_anterior = cotizacion.estado.upper() # Normalizamos a mayúsculas
        
        # 2. Obtener el nuevo estado que viene del Frontend
        nuevo_estado = serializer.validated_data.get('estado', estado_anterior).upper()

        # Si el estado no cambió, guardamos y salimos (ahorramos proceso)
        if estado_anterior == nuevo_estado:
            serializer.save()
            return

        print(f"🔄 Transición de Estado: {estado_anterior} -> {nuevo_estado}")

        with transaction.atomic():
            # CASO 1: SE ACEPTA LA VENTA (Resta Stock)
            # (Venía de Pendiente/Rechazada/Vencida Y AHORA es Aceptada)
            if estado_anterior != 'ACEPTADA' and nuevo_estado == 'ACEPTADA':
                self._procesar_venta(cotizacion, self.request.user)

            # CASO 2: SE ANULA LA VENTA (Devuelve Stock)
            # (Estaba Aceptada Y AHORA pasa a Pendiente/Rechazada/Vencida)
            elif estado_anterior == 'ACEPTADA' and nuevo_estado != 'ACEPTADA':
                self._revertir_venta(cotizacion, self.request.user)
            
            # CASO 3: CAMBIOS NEUTRALES (Ej: Pendiente -> Rechazada)
            # No se toca el inventario.

            # Finalmente guardamos el cambio de estado
            serializer.save()

    # --- MÉTODOS AUXILIARES PRIVADOS ---

    def _procesar_venta(self, cotizacion, usuario):
        """ Resta stock y genera Kardex de SALIDA """
        detalles = cotizacion.detalles.all() 
        
        if not detalles:
            # Si falla con .detalles, intenta con .detallecotizacion_set (fallback)
            detalles = getattr(cotizacion, 'detalles', None) or cotizacion.detallecotizacion_set.all()

        if not detalles:
            raise ValidationError("No se puede aprobar una cotización sin productos.")

        for detalle in detalles:
            # Bloqueamos la fila de stock
            stock = StockSucursal.objects.select_for_update().filter(
                sucursal=cotizacion.sucursal,
                producto=detalle.producto
            ).first()

            if not stock:
                raise ValidationError(f"El producto '{detalle.producto.nombre_producto}' no existe en la sucursal '{cotizacion.sucursal.nombre}'.")
            
            if stock.cantidad < detalle.cantidad:
                raise ValidationError(f"Stock insuficiente para '{detalle.producto.nombre_producto}'. Disponible: {stock.cantidad}, Requerido: {detalle.cantidad}.")

            # Resta
            stock.cantidad -= detalle.cantidad
            stock.save()

            # Kardex
            Movimiento.objects.create(
                producto=detalle.producto,
                sucursal=cotizacion.sucursal,
                tipo='VENTA',
                cantidad=-detalle.cantidad,
                saldo_historico=stock.cantidad,
                usuario=usuario,
                referencia=f"Venta Cotización #{cotizacion.id_cotizacion}"
            )

    def _revertir_venta(self, cotizacion, usuario):
        """ Suma stock y genera Kardex de ENTRADA """
        detalles = cotizacion.detalles.all()

        for detalle in detalles:
            stock, created = StockSucursal.objects.select_for_update().get_or_create(
                sucursal=cotizacion.sucursal,
                producto=detalle.producto,
                defaults={'cantidad': 0}
            )

            stock.cantidad += detalle.cantidad
            stock.save()

            Movimiento.objects.create(
                producto=detalle.producto,
                sucursal=cotizacion.sucursal,
                tipo='ANULACION_VENTA',
                cantidad=detalle.cantidad,
                saldo_historico=stock.cantidad,
                usuario=usuario,
                referencia=f"Reversión Cotización #{cotizacion.id_cotizacion}"
            )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        # Esta acción ahora es solo un "atajo" que simula un update
        cotizacion = self.get_object()
        serializer = self.get_serializer(cotizacion, data={'estado': 'ACEPTADA'}, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'status': 'Cotización aprobada correctamente'})


class HistorialSeguimientoViewSet(viewsets.ModelViewSet):
    serializer_class = HistorialSeguimientoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = HistorialSeguimiento.objects.all().order_by('-fecha_seguimiento')
        cotizacion_id = self.request.query_params.get('cotizacion')
        if cotizacion_id:
            queryset = queryset.filter(cotizacion_id=cotizacion_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


# ==============================================================================
# 5. GESTIÓN DE INVENTARIO (KARDEX Y TRASPASOS)
# ==============================================================================

class MovimientoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MovimientoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Movimiento.objects.all().order_by('-fecha')

        # Filtro por Rol: Vendedores solo ven su sucursal
        if not (user.is_superuser or user.is_staff):
            try:
                perfil = user.perfilusuario
                queryset = queryset.filter(sucursal=perfil.sucursal)
            except PerfilUsuario.DoesNotExist:
                return Movimiento.objects.none()

        # Filtros opcionales (Producto y Sucursal)
        producto_id = self.request.query_params.get('producto')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)

        sucursal_id = self.request.query_params.get('sucursal')
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        return queryset

# ==============================================================================
# 5.2 SOLICITUDES DE TRASPASO ENTRE SUCURSALES
# ==============================================================================

class SolicitudTraspasoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudTraspaso.objects.all().order_by('-fecha_solicitud')
    serializer_class = SolicitudTraspasoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(solicitante=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        solicitud = self.get_object()
        
        if solicitud.estado != 'PENDIENTE':
            return Response({'error': 'Esta solicitud ya fue procesada'}, status=400)

        with transaction.atomic():
            # 1. Verificar Origen
            stock_origen = StockSucursal.objects.select_for_update().filter(
                sucursal=solicitud.sucursal_origen, 
                producto=solicitud.producto
            ).first()

            if not stock_origen or stock_origen.cantidad < solicitud.cantidad:
                return Response({'error': 'Origen sin stock suficiente'}, status=400)

            # 2. Buscar o Crear Destino
            stock_destino, created = StockSucursal.objects.select_for_update().get_or_create(
                sucursal=solicitud.sucursal_destino,
                producto=solicitud.producto,
                defaults={'cantidad': 0}
            )

            # 3. Mover Stock Físico
            stock_origen.cantidad -= solicitud.cantidad
            stock_origen.save()

            stock_destino.cantidad += solicitud.cantidad
            stock_destino.save()

            # 4. Kardex SALIDA (Origen)
            Movimiento.objects.create(
                producto=solicitud.producto,
                sucursal=solicitud.sucursal_origen,
                tipo='TRASPASO_SALIDA',
                cantidad=-solicitud.cantidad, 
                saldo_historico=stock_origen.cantidad,
                usuario=request.user,
                referencia=f"Envío Traspaso #{solicitud.id}"
            )

            # 5. Kardex ENTRADA (Destino)
            Movimiento.objects.create(
                producto=solicitud.producto,
                sucursal=solicitud.sucursal_destino,
                tipo='TRASPASO_ENTRADA',
                cantidad=solicitud.cantidad, 
                saldo_historico=stock_destino.cantidad,
                usuario=request.user,
                referencia=f"Recepción Traspaso #{solicitud.id}"
            )

            solicitud.estado = 'APROBADA'
            solicitud.fecha_respuesta = timezone.now()
            solicitud.save()

        return Response({'status': 'Traspaso realizado con éxito'})

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != 'PENDIENTE':
            return Response({'error': 'Ya procesada'}, status=400)
        
        solicitud.estado = 'RECHAZADA'
        solicitud.fecha_respuesta = timezone.now()
        solicitud.save()
        return Response({'status': 'Solicitud rechazada'})
    

# ==============================================================================
# 6. SOLICITUDES WEB (LEADS DEL CATÁLOGO PÚBLICO)
# ==============================================================================

class SolicitudWebViewSet(viewsets.ModelViewSet):
    queryset = SolicitudesWeb.objects.all().order_by('-fecha_solicitud')
    serializer_class = SolicitudWebSerializer

    def get_permissions(self):
        # Permitimos que cualquier usuario de internet envíe el formulario (POST)
        if self.action == 'create':
            return [AllowAny()]
        # Pero solo los usuarios autenticados del ERP pueden ver y gestionar la lista
        return [IsAuthenticated()]


# ==============================================================================
# 7. ROLES Y USUARIOS
# ==============================================================================

# ViewSet para listar los Roles en el select del frontend
class RolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Roles.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]

# ViewSet para GESTIONAR Usuarios (CRUD completo)
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    permission_classes = [IsAuthenticated] 

    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        if instance.is_superuser:
            raise PermissionDenied("No se puede eliminar al Superusuario principal.")
        instance.delete()


# ==============================================================================
# ENDPOINT ESPECIAL: INGRESO MANUAL DE STOCK
# ==============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def ingresar_stock_manual(request):
    """
    Endpoint seguro para ingresar stock manual. 
    Actualiza el stock físico y genera el Kardex automáticamente.
    """
    try:
        producto_id = request.data.get('producto')
        sucursal_id = request.data.get('sucursal')
        cantidad = int(request.data.get('cantidad', 0))
        referencia = request.data.get('referencia', 'Ingreso manual de stock')

        if cantidad <= 0:
            return Response({'error': 'La cantidad debe ser mayor a cero.'}, status=400)

        producto = Productos.objects.get(pk=producto_id)
        sucursal = Sucursales.objects.get(pk=sucursal_id)

        # 1. Buscar el stock actual en esa sucursal (si no existe, lo crea en 0)
        stock, created = StockSucursal.objects.get_or_create(
            producto=producto,
            sucursal=sucursal,
            defaults={'cantidad': 0}
        )

        # 2. Sumar la nueva cantidad al stock físico
        stock.cantidad += cantidad
        stock.save()

        # 3. Registrar el movimiento en el Kardex
        Movimiento.objects.create(
            producto=producto,
            sucursal=sucursal,
            cantidad=cantidad,
            tipo='ENTRADA',
            saldo_historico=stock.cantidad,
            referencia=referencia,
            usuario=request.user,
            fecha=timezone.now()
        )

        return Response({'mensaje': 'Stock ingresado y Kardex actualizado exitosamente.'}, status=201)

    except Productos.DoesNotExist:
        return Response({'error': 'El producto seleccionado no existe.'}, status=404)
    except Sucursales.DoesNotExist:
        return Response({'error': 'La sucursal seleccionada no existe.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

# ==============================================================================
# 8. RECUPERACIÓN DE CONTRASEÑA
# ==============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])  # Cualquiera puede pedir restablecer su clave
def solicitar_recuperacion(request):
    """
    Recibe el email del usuario, genera un token seguro y envía el enlace
    de restablecimiento apuntando al Frontend en React.
    """
    email = request.data.get('email', '').strip()
    
    if not email:
        return Response({"error": "El correo electrónico es requerido."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Buscar al usuario por email
    user = User.objects.filter(email=email).first()
    
    # Por seguridad, si el usuario no existe, respondemos con éxito simulado 
    # para evitar que atacantes adivinen qué correos están registrados.
    if not user:
        return Response(
            {"message": "Si el correo está registrado, recibirás un enlace de recuperación en breve."},
            status=status.HTTP_200_OK
        )
        
    # Generar UID y Token únicos y seguros
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    # URL DEL FRONTEND (En producción puedes cambiar localhost por el dominio del VPS)
    frontend_url = "http://localhost:5173" 
    link_recuperacion = f"{frontend_url}/password-reset/confirm/{uidb64}/{token}/"
    
    # Configurar el correo electrónico
    asunto = "Restablecer Contraseña - SR System"
    remitente = settings.DEFAULT_FROM_EMAIL
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px;">
                <h2 style="color: #1e3672; text-align: center;">Distribuidora San Rafael</h2>
                <p>Hola, <strong>{user.first_name or user.username}</strong>.</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el sistema de gestión SR System.</p>
                <p>Para continuar con el proceso, haz clic en el siguiente botón comercial (este enlace expirará pronto):</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{link_recuperacion}" style="background-color: #1e3672; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                        Restablecer Contraseña
                    </a>
                </div>
                
                <p style="font-size: 0.9rem; color: #64748b;">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
                <p style="font-size: 0.8rem; color: #1e3672; word-break: break-all;">{link_recuperacion}</p>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin-bottom: 0;">
                    Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no sufrirá modificaciones.
                </p>
            </div>
        </body>
    </html>
    """
    
    text_content = f"Hola. Para restablecer tu contraseña ingresa aquí: {link_recuperacion}"
    
    try:
        # Enviar correo usando el SMTP configurado
        msg = EmailMultiAlternatives(asunto, text_content, remitente, [user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        
        return Response(
            {"message": "Si el correo está registrado, recibirás un enlace de recuperación en breve."},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"error": f"Error en el servidor de correo: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def confirmar_recuperacion(request, uidb64, token):
    """
    Procesa el formulario final enviado desde React. Valida que el token 
    y el UID sigan siendo válidos y actualiza la contraseña del usuario.
    """
    nueva_contrasena = request.data.get('password', '').strip()
    
    if not nueva_contrasena:
        return Response({"error": "La nueva contraseña es requerida."}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(nueva_contrasena) < 6:
        return Response({"error": "La contraseña debe tener al menos 6 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Decodificar el ID del usuario
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "El enlace de recuperación no es válido o ha expirado."}, status=status.HTTP_400_BAD_REQUEST)
        
    # Verificar si el token es válido para este usuario específico
    if default_token_generator.check_token(user, token):
        # Aplicar la nueva contraseña con encriptación hash estándar de Django
        user.set_password(nueva_contrasena)
        user.save()
        return Response({"message": "Tu contraseña ha sido actualizada con éxito."}, status=status.HTTP_200_OK)
    else:
        return Response({"error": "El token de seguridad ha expirado o ya fue utilizado."}, status=status.HTTP_400_BAD_REQUEST)