# api/serializers.py
# Este archivo define los serializers de la aplicación, que son responsables de convertir los modelos de Django a formatos JSON (y viceversa) para ser utilizados en las API REST. Aquí se incluyen serializers para usuarios, clientes, productos, cotizaciones, y otros modelos clave de la aplicación. Además, se implementan métodos personalizados para manejar la lógica de creación y actualización de objetos complejos como las cotizaciones.

from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Importamos todos los modelos necesarios
from .models import (
    Roles,
    SolicitudesWeb,
    Sucursales,
    PerfilUsuario,
    Clientes,
    Categorias,
    Productos,
    StockSucursal,
    Cotizaciones,
    DetalleCotizacion,
    HistorialSeguimiento,
    Movimiento,
    SolicitudTraspaso
)

# ==============================================================================
# 1. SERIALIZERS DE USUARIOS Y AUTENTICACIÓN
# ==============================================================================
class MiTokenPersonalizadoSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inyectamos los datos reales al payload del JWT
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name

        try:
            perfil = user.perfilusuario
            if perfil and perfil.sucursal:
                token['sucursal_usuario'] = perfil.sucursal.nombre
                token['sucursal_id'] = perfil.sucursal.id_sucursal
            else:
                token['sucursal_usuario'] = 'Principal'
                token['sucursal_id'] = None
                
            if perfil and perfil.rol:
                token['rol'] = perfil.rol.nombre_rol
        except Exception:
            token['sucursal_usuario'] = 'Principal'
            token['sucursal_id'] = None

        return token

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roles
        fields = ['id_rol', 'nombre_rol']

class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursales
        fields = ['id_sucursal', 'nombre', 'direccion', 'telefono']

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    rol = RolSerializer(read_only=True)
    sucursal = SucursalSerializer(read_only=True)
    
    class Meta:
        model = PerfilUsuario
        fields = ['rol', 'sucursal']

class UserSerializer(serializers.ModelSerializer):
    # Anidamos el perfil para enviar Rol y Sucursal junto con el usuario (tambien si es activo o no)
    perfilusuario = PerfilUsuarioSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'perfilusuario']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    id_rol = serializers.IntegerField(write_only=True)
    id_sucursal = serializers.IntegerField(write_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'id_rol', 'id_sucursal', 'is_active']

    def create(self, validated_data):
        id_rol = validated_data.pop('id_rol')
        id_sucursal = validated_data.pop('id_sucursal')
        
        # Crear usuario
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        
        # Validar y asignar perfil
        try:
            rol = Roles.objects.get(id_rol=id_rol)
            sucursal = Sucursales.objects.get(id_sucursal=id_sucursal)
            PerfilUsuario.objects.create(user=user, rol=rol, sucursal=sucursal)
        except (Roles.DoesNotExist, Sucursales.DoesNotExist):
            user.delete() 
            raise serializers.ValidationError("Rol o Sucursal no válidos.")
        
        return user
    def validate_username(self, value):
        if len(value.strip()) < 4:
            raise serializers.ValidationError("El usuario debe tener mínimo 4 caracteres.")
        if value.isdigit():
            raise serializers.ValidationError("El usuario no puede ser solo números.")
        return value


# ==============================================================================
# 2. SERIALIZERS DEL NÚCLEO (CLIENTES, CATEGORÍAS, PRODUCTOS)
# ==============================================================================

class ClienteSerializer(serializers.ModelSerializer):
    creado_por_usuario_username = serializers.CharField(source='creado_por_usuario.username', read_only=True)

    class Meta:
        model = Clientes
        fields = [
            'id_cliente', 'nombre_cliente', 'nit_ci', 'telefono', 
            'email', 'direccion', 'created_at', 'updated_at', 
            'creado_por_usuario', 'creado_por_usuario_username'
        ]
        read_only_fields = ['creado_por_usuario', 'created_at', 'updated_at']
    
    def validate_nombre_cliente(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("El nombre del cliente debe ser real (mínimo 3 letras).")
        if value.isdigit():
            raise serializers.ValidationError("El nombre del cliente no puede contener únicamente números.")
        return value


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorias
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    """
    Serializer para Productos.
    Calcula el stock total, pero NO permite editarlo aquí directamente
    para asegurar que todo pase por el Kardex (StockSucursalViewSet).
    """
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre_categoria')
    
    # CAMPO CALCULADO (SOLO LECTURA)
    stock_total = serializers.SerializerMethodField()

    imagen_url = serializers.SerializerMethodField()

    disponibilidad = serializers.SerializerMethodField()

    def get_imagen_url(self, obj):
        request = self.context.get('request')
        if obj.imagen:
            return request.build_absolute_uri(obj.imagen.url)
        return None

    class Meta:
        model = Productos
        fields = '__all__'
        read_only_fields = ['stock_total', 'created_at', 'updated_at']

    # Lógica para obtener el stock total (Suma de todas las sucursales)
    def get_stock_total(self, obj):
        total = StockSucursal.objects.filter(producto=obj).aggregate(total=Sum('cantidad'))['total']
        return total if total is not None else 0
    
    def get_disponibilidad(self, obj):
        # Buscamos todos los registros de stock en el Kardex para este producto
        stock_qs = StockSucursal.objects.filter(producto=obj)
        
        # Armamos una lista con el formato exacto que React está esperando
        return [
            {
                "sucursal": stock.sucursal.nombre,
                "cantidad": stock.cantidad
            }
            for stock in stock_qs
        ]


class StockSucursalSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre_producto', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)

    class Meta:
        model = StockSucursal
        fields = [
            'id_stock', 'producto', 'producto_nombre', 'sucursal', 
            'sucursal_nombre', 'cantidad', 'ultima_actualizacion'
        ]


# ==============================================================================
# 3. SERIALIZERS DE COTIZACIONES Y CRM
# ==============================================================================

class DetalleCotizacionSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre_producto', read_only=True)
    producto_sku = serializers.CharField(source='producto.sku', read_only=True)

    class Meta:
        model = DetalleCotizacion
        fields = [
            'id_detalle', 'producto', 'producto_nombre', 'producto_sku',
            'cantidad', 'precio_unitario_cotizado'
        ]
        read_only_fields = ['id_detalle']


class CotizacionSerializer(serializers.ModelSerializer):
    detalles = DetalleCotizacionSerializer(many=True)

    # Info extra para mostrar en el frontend
    cliente_nombre = serializers.CharField(source='cliente.nombre_cliente', read_only=True)
    vendedor_nombre = serializers.CharField(source='usuario_vendedor.username', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    
    # AÑADIDO (allow_null=True es clave para que no falle cuando NO viene de la web)
    solicitud_web_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    sucursal_direccion = serializers.CharField(source='sucursal.direccion', read_only=True)

    class Meta:
        model = Cotizaciones
        fields = [
            'id_cotizacion', 'codigo_cotizacion', 'cliente', 'cliente_nombre',
            'usuario_vendedor', 'vendedor_nombre', 'sucursal', 'sucursal_nombre', 'sucursal_direccion',
            'fecha_creacion', 'fecha_validez', 'estado', 'subtotal',
            'descuento', 'total', 'detalles', 'solicitud_web_id'
        ]
        read_only_fields = [
            'id_cotizacion', 'codigo_cotizacion', 'usuario_vendedor', 
            'sucursal', 'fecha_creacion', 'subtotal', 'total'
        ]

    def create(self, validated_data):
        # 1. ATRApar y QUITAR el campo extra ANTES de guardar la cotización. 
        # (Si no lo quitamos con pop(), Django arrojará el TypeError que viste)
        solicitud_id = validated_data.pop('solicitud_web_id', None)
        detalles_data = validated_data.pop('detalles')

        # 2. Generar código (Ej: COT-2025-0001)
        timestamp = timezone.now()
        last_cot = Cotizaciones.objects.order_by('id_cotizacion').last()
        ultimo_id = (last_cot.id_cotizacion + 1) if last_cot else 1
        
        codigo = f"COT-{timestamp.year}-{ultimo_id:04d}"
        validated_data['codigo_cotizacion'] = codigo
        
        # 3. Calcular totales
        subtotal = 0
        for item in detalles_data:
            subtotal += item['cantidad'] * item['precio_unitario_cotizado']
        
        descuento = validated_data.get('descuento', 0)
        validated_data['subtotal'] = subtotal
        validated_data['total'] = subtotal - descuento

        # 4. Transacción Atómica
        with transaction.atomic():
            cotizacion = Cotizaciones.objects.create(**validated_data)
            
            for detalle_data in detalles_data:
                DetalleCotizacion.objects.create(cotizacion=cotizacion, **detalle_data)
            
            # 5. 👇 LÓGICA DE VINCULACIÓN CON LA WEB
            if solicitud_id:
                try:
                    # Importamos localmente por si acaso para evitar errores
                    from .models import SolicitudesWeb 
                    solicitud = SolicitudesWeb.objects.get(id_solicitud=solicitud_id)
                    solicitud.cotizacion = cotizacion
                    solicitud.estado = 'ATENDIDA'
                    solicitud.save()
                except SolicitudesWeb.DoesNotExist:
                    pass
        
        return cotizacion
    


class HistorialSeguimientoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = HistorialSeguimiento
        fields = [
            'id_seguimiento', 'cotizacion', 'usuario', 'usuario_nombre',
            'fecha_seguimiento', 'tipo_interaccion', 'notas'
        ]
        read_only_fields = ['usuario', 'fecha_seguimiento']


# ==============================================================================
# 4. SERIALIZERS DE KARDEX E INVENTARIO
# ==============================================================================

class MovimientoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre_producto', read_only=True)
    # Usaremos 'nombre' basado en SucursalSerializer de arriba.
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True) 
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Movimiento
        fields = '__all__'

class SolicitudTraspasoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre_producto', read_only=True)
    origen_nombre = serializers.CharField(source='sucursal_origen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='sucursal_destino.nombre', read_only=True)
    solicitante_nombre = serializers.CharField(source='solicitante.username', read_only=True)

    class Meta:
        model = SolicitudTraspaso
        fields = '__all__'
        # IMPORTANTE: Estos campos son read_only para que el frontend no tenga que enviarlos !!!!!!!!
        read_only_fields = ['solicitante', 'fecha_solicitud', 'fecha_respuesta', 'estado']


class SolicitudWebSerializer(serializers.ModelSerializer):
    cotizacion_codigo = serializers.CharField(source='cotizacion.codigo_cotizacion', read_only=True)
    class Meta:
        model = SolicitudesWeb
        fields = '__all__'