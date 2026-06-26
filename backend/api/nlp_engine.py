# api/nlp_engine.py
import numpy as np
import os
import joblib
from sklearn.neural_network import MLPClassifier
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class ChatbotNeural:
    def __init__(self):
        print("🧠 [IA] Cargando Red Neuronal Transformer...")
        self.transformer = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(base_dir, 'red_neuronal_intenciones.joblib')
        self.clasificador_intenciones = None
        
        # DATASET CON SINÓNIMOS BOLIVIANOS Y CORRECCIÓN DE "SILENCIOSA"
        self.datos_entrenamiento = [
            # 1. SALUDOS
            ("hola", "saludo"), ("buenos dias", "saludo"), ("buenas tardes", "saludo"),
            ("buenas noches", "saludo"), ("buenas", "saludo"), ("que tal", "saludo"),
            ("necesito ayuda", "saludo"), ("quiero hacer una consulta", "saludo"),
            ("tienen bombas de agua", "saludo"), ("hola me pueden asesorar", "saludo"),

            # 2. DOMICILIARIA (Aquí forzamos el aprendizaje de "silenciosa" y modismos)
            ("necesito subir agüita al tanque de mi casa", "bomba_domiciliaria"),
            ("quiero una bomba silenciosa", "bomba_domiciliaria"), # <-- Corrección clave
            ("necesito un motor que no haga ruido para mi casa", "bomba_domiciliaria"), # <-- Corrección clave
            ("bomba super silenciosa para interior", "bomba_domiciliaria"),
            ("motorcito para subir agua al techo", "bomba_domiciliaria"),
            ("bomba para casa de 2 pisos", "bomba_domiciliaria"),
            ("no llega agua a la ducha de arriba", "bomba_domiciliaria"),
            ("bomba pedrollo pkm60", "bomba_domiciliaria"),
            ("bombita de agua casera", "bomba_domiciliaria"),
            ("bomba de 0.5 hp para domicilio", "bomba_domiciliaria"),
            ("hacer correr agua en la casa", "bomba_domiciliaria"),
            ("vomba para mi casita", "bomba_domiciliaria"),
            ("para dos pisos", "bomba_domiciliaria"),
            ("para 3 pisos", "bomba_domiciliaria"),
            ("para una casa", "bomba_domiciliaria"),
            ("quiero una bomba para 4 pisos", "bomba_domiciliaria"),

            # 3. CIVIL / EDIFICIOS
            ("bomba para edificio de 10 pisos", "bomba_civil"),
            ("sistema de presurizacion para condominio", "bomba_civil"),
            ("bomba multietapa para altura", "bomba_civil"),
            ("motor de agua para 8 pisos", "bomba_civil"),
            ("equipo de bombeo para hotel", "bomba_civil"),
            ("subir agua a 40 metros", "bomba_civil"),
            ("bombas en paralelo para edificio residencial", "bomba_civil"),

            # 4. SUMERGIBLE / POZOS
            ("bomba tipo lapiz para pozo profundo", "bomba_sumergible"),
            ("sacar agua de pozo a 50 metros", "bomba_sumergible"),
            ("motor sumergible para pozo de 4 pulgadas", "bomba_sumergible"),
            ("bomba sumergible 4sr pedrollo", "bomba_sumergible"),
            ("extracccion de agua subterranea", "bomba_sumergible"),

            # 5. RIEGO
            ("necesito regar mis cultivos", "bomba_riego"),
            ("motobomba a gasolina para el campo", "bomba_riego"),
            ("bomba centrifuga de gran caudal agricola", "bomba_riego"),
            ("vomba agricola pa regar", "bomba_riego"),
            ("motor para riego por aspersion", "bomba_riego"),

            # 6. DRENAJE
            ("tengo una fuga de agua en el sotano", "bomba_drenaje"),
            ("bomba sumergible para aguas negras", "bomba_drenaje"),
            ("mi casa se inundo necesito sacar el agua", "bomba_drenaje"),
            ("bomba para botar agua sucia", "bomba_drenaje"),
            ("sacar lodo y agua estancada", "bomba_drenaje")
        ]
        
        self._preparar_modelo_intenciones()

    def _preparar_modelo_intenciones(self):
        if os.path.exists(self.model_path):
            self.clasificador_intenciones = joblib.load(self.model_path)
        else:
            print("⚙️ [IA] Entrenando Red Neuronal...")
            corpus = [item[0] for item in self.datos_entrenamiento]
            etiquetas = [item[1] for item in self.datos_entrenamiento]
            X_embeddings = self.transformer.encode(corpus)
            self.clasificador_intenciones = MLPClassifier(hidden_layer_sizes=(100,), max_iter=1000, random_state=42)
            self.clasificador_intenciones.fit(X_embeddings, etiquetas)
            joblib.dump(self.clasificador_intenciones, self.model_path)

    def predecir_intencion(self, mensaje):
        mensaje_embedding = self.transformer.encode([mensaje])
        intencion = self.clasificador_intenciones.predict(mensaje_embedding)[0]
        probabilidades = self.clasificador_intenciones.predict_proba(mensaje_embedding)[0]
        confianza = np.max(probabilidades)
        if confianza < 0.40: 
            return "desconocido"
        return intencion

    def recomendar_por_similitud_neuronal(self, consulta_usuario, queryset_productos, top_n=3):
        if not queryset_productos:
            return []

        lista_productos = list(queryset_productos)
        textos_productos = []
        
        # LA MEJORA CLAVE: EMBEDDINGS ENRIQUECIDOS
        for p in lista_productos:
            cat = p.categoria.nombre_categoria if p.categoria else "General"
            desc = p.descripcion if p.descripcion else ""
            # Creamos un bloque de texto que parezca una ficha técnica para la IA
            texto_tecnico = f"Bomba: {p.nombre_producto} | Categoría: {cat} | Atributos: {desc}"
            textos_productos.append(texto_tecnico)

        vector_consulta = self.transformer.encode([consulta_usuario])
        matriz_productos = self.transformer.encode(textos_productos)

        puntajes_similitud = cosine_similarity(vector_consulta, matriz_productos)[0]
        indices_ordenados = puntajes_similitud.argsort()[::-1]
        
        productos_recomendados = []
        for idx in indices_ordenados:
            if puntajes_similitud[idx] > 0.15: 
                productos_recomendados.append(lista_productos[idx])
            if len(productos_recomendados) == top_n:
                break
                
        if not productos_recomendados:
            return lista_productos[:top_n]

        return productos_recomendados

motor_nlp = ChatbotNeural()