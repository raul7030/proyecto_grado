from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from django.db.models import Sum, F
from django.utils import timezone
from api.models import Productos, Cotizaciones, DetalleCotizacion, Clientes, Sucursales

from api.views import extraer_datos_tecnicos
from api.serializers import RegisterSerializer, ClienteSerializer, RegisterSerializer
from rest_framework.exceptions import ValidationError

class CotizacionLogicaTests(TestCase):
    
    def setUp(self):
        # 1. Crear dependencias obligatorias (User y Sucursal)
        self.vendedor = User.objects.create_user(username='admin_test', password='123')
        
        self.sucursal = Sucursales.objects.create(
            nombre='Central',
            direccion='Av. Prueba'
        )

        # 2. Crear Cliente (Campo correcto: nombre_cliente)
        self.cliente = Clientes.objects.create(
            nombre_cliente="Constructora de Prueba SRL"
        )
        
        # 3. Crear Producto (Campo correcto: sku obligatorio)
        self.producto = Productos.objects.create(
            sku="BOM-TEST-01",
            nombre_producto="Bomba de Agua PKM65", 
            precio_base=Decimal('500.00')
        )
        
        # 4. Crear Cotización (Llenando TODAS tus reglas de negocio obligatorias)
        self.cotizacion = Cotizaciones.objects.create(
            codigo_cotizacion="COT-999",
            cliente=self.cliente,
            usuario_vendedor=self.vendedor,
            sucursal=self.sucursal,
            fecha_validez=timezone.now().date()
        )

    def test_calculo_total_matematico(self):
        # 5. Agregar detalle (Campo correcto: precio_unitario_cotizado)
        DetalleCotizacion.objects.create(
            cotizacion=self.cotizacion,
            producto=self.producto,
            cantidad=2,
            precio_unitario_cotizado=self.producto.precio_base  
        )
        
        # 6. Simulamos el cálculo matemático del motor de base de datos
        resultado = DetalleCotizacion.objects.filter(cotizacion=self.cotizacion).aggregate(
            total=Sum(F('cantidad') * F('precio_unitario_cotizado'))
        )
        
        total_calculado = resultado['total']
        
        # 7. COMPROBAR: 2 unidades * 500.00 Bs = 1000.00 Bs
        self.assertEqual(total_calculado, Decimal('1000.00'), "El cálculo matemático falló.")


# ====================================================================
# SUITE 2: PRUEBAS DEL MOTOR DE INTELIGENCIA ARTIFICIAL (NLP)
# ====================================================================
class MotorNLPTests(TestCase):
    
    def test_extraccion_datos_hp_y_pisos(self):
        """ Prueba que la IA extraiga los HP y pisos de un texto natural. """
        # Arrange
        mensaje_cliente = "Hola, necesito una bomba de 2.5 hp para subir agua a 4 pisos por favor"

        # Act
        resultado = extraer_datos_tecnicos(mensaje_cliente)

        # Assert
        self.assertEqual(resultado['hp'], 2.5, "La IA falló al extraer los Caballos de Fuerza (HP)")
        self.assertEqual(resultado['pisos'], 4, "La IA falló al extraer la cantidad de pisos")
        self.assertFalse(resultado['quiere_silencio'], "Detectó petición de silencio por error")

    def test_extraccion_necesidad_silencio(self):
        """ Prueba que la IA detecte requerimientos especiales (ruido). """
        mensaje_cliente = "busco una bomba para mi casa pero que no haga ruido"
        resultado = extraer_datos_tecnicos(mensaje_cliente)

        self.assertTrue(resultado['quiere_silencio'], "La IA no detectó la palabra clave 'ruido/silencio'")

# ====================================================================
# SUITE 3: PRUEBAS DE INTEGRIDAD Y SEGURIDAD DE DATOS (SERIALIZERS)
# ====================================================================
class ValidacionUsuariosTests(TestCase):
    
    def test_rechazo_usuario_invalido(self):
        """ Prueba estricta: El error DEBE ser por el username corto. """
        # Enviamos datos PERFECTOS, excepto el username
        datos_malos = {
            'username': '1', 
            'password': 'PasswordFuerte123!', # Password válido para que no falle por esto
            'email': 'correo_valido@test.com',
            'first_name': 'Juan',
            'last_name': 'Perez',
            'id_rol': 1,
            'id_sucursal': 1
        }
        
        serializer = RegisterSerializer(data=datos_malos)
        serializer.is_valid() # Ejecutamos la validación
        
        # LA VERDADERA PRUEBA: Buscamos si el sistema generó un error ESPECÍFICAMENTE para 'username'
        self.assertIn(
            'username', 
            serializer.errors, 
            "¡ALERTA DE SEGURIDAD! El sistema permitió crear el usuario con nombre '1'"
        )

class ValidacionClientesTests(TestCase):
    
    def test_rechazo_cliente_invalido(self):
        """ Prueba estricta: El sistema no debe aceptar clientes con nombres de 1 letra o solo números """
        # Enviamos un cliente con nombre inválido
        datos_malos = {
            'nombre_cliente': '1', # Esto debería bloquearse
            'nit_ci': '12345678',
            'telefono': '77712345'
        }

        serializer = ClienteSerializer(data=datos_malos)
        serializer.is_valid()

        # LA VERDADERA PRUEBA: Buscamos el error específico en 'nombre_cliente'
        self.assertIn(
            'nombre_cliente', 
            serializer.errors, 
            "¡ALERTA DE SEGURIDAD! El sistema permitió guardar un cliente llamado '1'"
        )