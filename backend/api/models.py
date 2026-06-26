# api/models.py
# Este archivo define los modelos de datos para la aplicación, representando las tablas de la base de datos y sus relaciones. Cada clase corresponde a una tabla, y los atributos de cada clase corresponden a las columnas de esa tabla. Además, se incluyen métodos especiales como __str__ para facilitar la representación de los objetos en el panel de administración y otros lugares.
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

# ---------------------------------
# 1. Gestión de Acceso y Usuarios
# ---------------------------------

# Tabla para los roles del sistema
class Roles(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True, null=False)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre_rol

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

# Tabla para las sucursales de la empresa
class Sucursales(models.Model):
    id_sucursal = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, null=False)
    direccion = models.CharField(max_length=255, null=False)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Sucursal"
        verbose_name_plural = "Sucursales"

# Modelo "Perfil" para extender el User de Django.
# Esta es la forma correcta de agregar Rol y Sucursal a los Usuarios de Django.
class PerfilUsuario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    rol = models.ForeignKey(Roles, on_delete=models.PROTECT, null=False)
    sucursal = models.ForeignKey(Sucursales, on_delete=models.PROTECT, null=False)

    def __str__(self):
        return f"{self.user.username} - {self.rol.nombre_rol}"

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuario"

# ---------------------------------
# 2. Gestión de Clientes
# ---------------------------------

class Clientes(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nombre_cliente = models.CharField(max_length=200, null=False)
    nit_ci = models.CharField(max_length=20, unique=True, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    # Usamos settings.AUTH_USER_MODEL para referirnos al User de Django
    creado_por_usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre_cliente

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

# ---------------------------------
# 3. Gestión de Inventario y Productos
# ---------------------------------

class Categorias(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=100, unique=True, null=False)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre_categoria

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

class Productos(models.Model):
    id_producto = models.AutoField(primary_key=True)
    categoria = models.ForeignKey(Categorias, on_delete=models.SET_NULL, null=True, blank=True)
    sku = models.CharField(max_length=50, unique=True, null=False)
    nombre_producto = models.CharField(max_length=200, null=False)
    descripcion = models.TextField(blank=True, null=True)
    precio_base = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)

    def __str__(self):
        return f"{self.nombre_producto} (SKU: {self.sku})"

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

class StockSucursal(models.Model):
    id_stock = models.AutoField(primary_key=True)
    producto = models.ForeignKey(Productos, on_delete=models.CASCADE, null=False)
    sucursal = models.ForeignKey(Sucursales, on_delete=models.CASCADE, null=False)
    cantidad = models.IntegerField(default=0, null=False)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        # Esto asegura que no haya dos registros del mismo producto en la misma sucursal
        unique_together = ('producto', 'sucursal')
        verbose_name = "Stock en Sucursal"
        verbose_name_plural = "Stocks en Sucursal"

# ---------------------------------
# 4. Gestión de Cotizaciones
# ---------------------------------

class Cotizaciones(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'Pendiente', 'Pendiente'
        ACEPTADA = 'Aceptada', 'Aceptada'
        RECHAZADA = 'Rechazada', 'Rechazada'
        VENCIDA = 'Vencida', 'Vencida'

    id_cotizacion = models.AutoField(primary_key=True)
    codigo_cotizacion = models.CharField(max_length=20, unique=True, null=False)
    cliente = models.ForeignKey(Clientes, on_delete=models.PROTECT, null=False)
    usuario_vendedor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=False)
    sucursal = models.ForeignKey(Sucursales, on_delete=models.PROTECT, null=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_validez = models.DateField(null=False)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE, null=False)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    afecta_inventario = models.BooleanField(default=False)


    def __str__(self):
        return f"{self.codigo_cotizacion} - {self.cliente.nombre_cliente}"

    class Meta:
        verbose_name = "Cotización"
        verbose_name_plural = "Cotizaciones"


class DetalleCotizacion(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    cotizacion = models.ForeignKey(Cotizaciones, related_name='detalles', on_delete=models.CASCADE, null=False)
    producto = models.ForeignKey(Productos, on_delete=models.PROTECT, null=False)
    cantidad = models.IntegerField(null=False)
    # "Congela" el precio al momento de cotizar
    precio_unitario_cotizado = models.DecimalField(max_digits=10, decimal_places=2, null=False)

    def __str__(self):
        return f"Detalle {self.id_detalle} de {self.cotizacion.codigo_cotizacion}"

    class Meta:
        verbose_name = "Detalle de Cotización"
        verbose_name_plural = "Detalles de Cotización"


# ---------------------------------
# 5. Seguimiento a Clientes (CRM)
# ---------------------------------

class HistorialSeguimiento(models.Model):
    class TipoInteraccion(models.TextChoices):
        LLAMADA = 'Llamada', 'Llamada'
        EMAIL = 'Email', 'Email'
        VISITA = 'Visita', 'Visita'
        WHATSAPP = 'WhatsApp', 'WhatsApp'
        OTRO = 'Otro', 'Otro'

    id_seguimiento = models.AutoField(primary_key=True)
    cotizacion = models.ForeignKey(Cotizaciones, related_name='seguimientos', on_delete=models.CASCADE, null=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=False)
    fecha_seguimiento = models.DateTimeField(auto_now_add=True)
    tipo_interaccion = models.CharField(max_length=10, choices=TipoInteraccion.choices, null=False)
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Seguimiento de {self.cotizacion.codigo_cotizacion} el {self.fecha_seguimiento.date()}"

    class Meta:
        verbose_name = "Historial de Seguimiento"
        verbose_name_plural = "Historiales de Seguimiento"


# ---------------------------------
# 6. kardex de Inventario
# ---------------------------------
# ... (Tus modelos anteriores) ...

class Movimiento(models.Model):
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada de Almacén'),
        ('VENTA', 'Salida por Venta'),
        ('TRASPASO_SALIDA', 'Envío a otra Sucursal'),
        ('TRASPASO_ENTRADA', 'Recepción de otra Sucursal'),
        ('AJUSTE', 'Ajuste de Inventario'),
    ]

    # CORRECCIÓN: Usamos 'Productos' y 'Sucursales' (Plural)
    producto = models.ForeignKey(Productos, on_delete=models.CASCADE)
    sucursal = models.ForeignKey(Sucursales, on_delete=models.CASCADE)
    
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    saldo_historico = models.IntegerField(editable=False) 
    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    referencia = models.CharField(max_length=100, blank=True, null=True, help_text="ID de Venta o Traspaso")

    def __str__(self):
        return f"{self.tipo} - {self.producto.nombre_producto} ({self.cantidad})"

class SolicitudTraspaso(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
    ]

    solicitante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='solicitudes_creadas')
    
    # CORRECCIÓN: Usamos 'Sucursales'
    sucursal_origen = models.ForeignKey(Sucursales, on_delete=models.CASCADE, related_name='traspasos_salientes')
    sucursal_destino = models.ForeignKey(Sucursales, on_delete=models.CASCADE, related_name='traspasos_entrantes')
    
    # CORRECCIÓN: Usamos 'Productos'
    producto = models.ForeignKey(Productos, on_delete=models.CASCADE)
    
    cantidad = models.PositiveIntegerField()
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"De {self.sucursal_origen} a {self.sucursal_destino}"
    

# ---------------------------------
# 7. Solicitudes Web
# ---------------------------------
class SolicitudesWeb(models.Model):
    ESTADOS = (
        ('PENDIENTE', 'Pendiente de Contacto'),
        ('ATENDIDA', 'Atendida / Cotizada'),
        ('DESCARTADA', 'Descartada'),
    )
    
    id_solicitud = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    telefono = models.CharField(max_length=50)
    email = models.EmailField(null=True, blank=True)
    detalle = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    cotizacion = models.ForeignKey('Cotizaciones', on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes_web')
    
    class Meta:
        verbose_name_plural = "Solicitudes Web"

    def __str__(self):
        return f"{self.nombre} - {self.estado}"