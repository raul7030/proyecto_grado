// src/pages/LandingPage.jsx
import styles from './LandingPage.module.css';
import ChatbotWidget from '../components/ChatbotWidget';

const LandingPage = () => {
    
    // Arreglo de eventos
    const eventos = [
        {
            id: 1,
            titulo: "Feria de Innovación Agrícola",
            descripcion: "Descubre las nuevas tecnologías en maquinaria y riego que Grupo San Rafael trae este año para el campo boliviano.",
            imagen: "CASA SOLAR.webp",
            fecha_evento: "2026-05-15"
        },
        {
            id: 2,
            titulo: "Capacitación en Bombas Sumergibles",
            descripcion: "Taller técnico dirigido a instaladores y profesionales del sector hidráulico. Aprende sobre mantenimiento preventivo.",
            imagen: "default.jpg",
            fecha_evento: "2026-06-02"
        },
        {
            id: 3,
            titulo: "Inauguración Nueva Sucursal",
            descripcion: "Ampliamos nuestra cobertura para estar más cerca de ti. Ven a conocer nuestras nuevas instalaciones y aprovecha descuentos.",
            imagen: "misa 2025.webp",
            fecha_evento: "2026-07-20"
        }
    ];

    return (
        <div className={styles.landingContainer}>
            
            {/* =========================================
                SLIDER PRINCIPAL
                ========================================= */}
            <div id="sliderPrincipal" className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-indicators">
                    <button type="button" data-bs-target="#sliderPrincipal" data-bs-slide-to="0" className="active"></button>
                    <button type="button" data-bs-target="#sliderPrincipal" data-bs-slide-to="1"></button>
                    <button type="button" data-bs-target="#sliderPrincipal" data-bs-slide-to="2"></button>
                </div>

                <div className="carousel-inner">
                    <div className="carousel-item active">
                        <img src="/images/portada1.webp" className={`d-block w-100 ${styles.cImgFit}`} alt="Bombas Pedrollo Bolivia" />
                        <div className="carousel-caption d-none d-md-block">
                            <h1 className="fw-bold display-5">Bombas Pedrollo - Caprari - Calpeda</h1>
                            <p className="fs-5">La mejor tecnología italiana para su hogar e industria.</p>
                            <a href="/catalogo" className={`btn fw-bold px-4 mt-2 ${styles.buttonprimary}`}>Ver Catálogo</a>
                        </div>
                    </div>

                    <div className="carousel-item">
                        <video className={`d-block w-100 ${styles.cImgFit}`} autoPlay loop muted playsInline>
                            <source src="/images/portada.mp4" type="video/mp4" />
                            Tu navegador no soporta videos HTML5.
                        </video>
                        <div className="carousel-caption d-none d-md-block">
                            <h2 className="fw-bold display-5">Potencia para el Agro Boliviano</h2>
                            <p className="fs-5">Maquinaria agrícola que impulsa el desarrollo.</p>
                            <a href="/contacto" className={`btn fw-bold px-4 mt-2 ${styles.buttonprimary}`}>Cotizar Ahora</a>
                        </div>
                    </div>

                    <div className="carousel-item">
                        <video className={`d-block w-100 ${styles.cImgFit}`} autoPlay loop muted playsInline>
                            <source src="/images/slide-video-koslan-1.mp4" type="video/mp4" />
                        </video>
                        <div className="carousel-caption d-none d-md-block">
                            <h2 className="fw-bold display-5">Generadores y Motocultores</h2>
                            <p className="fs-5">Alta resistencia y rendimiento garantizado.</p>
                            <a href="/contacto" className={`btn fw-bold px-4 mt-2 ${styles.buttonprimary}`}>Contactar Asesor</a>
                        </div>
                    </div>
                </div>

                <button className="carousel-control-prev" type="button" data-bs-target="#sliderPrincipal" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#sliderPrincipal" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                </button>
            </div>

            {/* =========================================
                CONTENIDO PRINCIPAL
                ========================================= */}
            <div className="container my-5">

                {/* Seccion: Sobre Nosotros */}
                <section className="mb-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <h2 className={`fw-bold text-uppercase mb-4 text-start ${styles.textTitulos}`}>
                                Sobre Nosotros
                            </h2>
                            <p className="lead text-muted text-justify">
                                <strong>Grupo San Rafael</strong> es una empresa enfocada en mejorar la calidad de vida de la comunidad a través de soluciones hídricas y energéticas. Para ello cuenta con servicio técnico especializado, asesoramiento experto, perforación de pozos de agua y representación de marcas de alta gama en bombas de agua y maquinaria agrícola.
                            </p>
                            <p className={`text-muted text-justify ${styles.textmedium}`}>
                                Nos especializamos en soluciones integrales, combinando la venta de equipos con un servicio técnico profesional. Con sucursales a nivel nacional, reafirmamos nuestro compromiso con la innovación y el desarrollo sostenible en Bolivia.
                            </p>
                        </div>
                        <div className="col-lg-6 text-center">
                            <img src="/images/foto-grupal.webp" className={`img-fluid rounded shadow w-100 ${styles.aboutImage}`} alt="Equipo Grupo San Rafael" />
                        </div>
                    </div>
                </section>

                <hr className="my-5" />

                {/* Seccion: Productos Destacados */}
                <section>
                    <h3 className={`fw-bold text-uppercase mb-4 text-center ${styles.textTitulos}`}>
                        Nuestros Productos Destacados
                    </h3>
                    <div id="carruselProductos" className="carousel slide" data-bs-ride="carousel">
                        <div className="carousel-inner p-3"> 
                            
                            {/* Slide 1 Productos */}
                            <div className="carousel-item active">
                                <div className="row">
                                    <div className="col-md-3 mb-3">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/PEDROLLO-PKM.png" className={`img-fluid ${styles.productImage}`} alt="PKM Pedrollo" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Bombas Centrífugas</h5>
                                                <p className="card-text text-muted small mb-4">Ideales para uso doméstico y riego.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mb-3 d-none d-md-block">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/feroz.webp" className={`img-fluid ${styles.productImage}`} alt="Motocultor" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Maquinaria agrícola</h5>
                                                <p className="card-text text-muted small mb-4">Equipos de alta calidad para el campo.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mb-3 d-none d-md-block">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/SEH.webp" className={`img-fluid ${styles.productImage}`} alt="Motobombas" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Motobombas</h5>
                                                <p className="card-text text-muted small mb-4">Ideal para riego en campo.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mb-3 d-none d-md-block">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/MEC.webp" className={`img-fluid ${styles.productImage}`} alt="Mancal" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Mancal de eje libre</h5>
                                                <p className="card-text text-muted small mb-4">Libre para acoplamiento a motor.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Slide 2 Productos */}
                            <div className="carousel-item">
                                <div className="row">
                                    <div className="col-md-3 mb-3">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/E4XED-E6X.webp" className={`img-fluid ${styles.productImage}`} alt="Sumergibles" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Bombas sumergibles</h5>
                                                <p className="card-text text-muted small mb-4">Ideales para pozo profundos.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mb-3 d-none d-md-block">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/DGPED.webp" className={`img-fluid ${styles.productImage}`} alt="Electricas" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Bombas eléctricas</h5>
                                                <p className="card-text text-muted small mb-4">Con variador de frecuencia incorporado.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mb-3 d-none d-md-block">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/CVX.webp" className={`img-fluid ${styles.productImage}`} alt="Verticales" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Multietapa vertical</h5>
                                                <p className="card-text text-muted small mb-4">Para usos civiles, edificios altos, etc.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 mb-3 d-none d-md-block">
                                        <div className="card h-100 shadow-sm border-0">
                                            <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                                <img src="/images/MEC.webp" className={`img-fluid ${styles.productImage}`} alt="Mancal" />
                                            </div>
                                            <div className="card-body text-center p-4">
                                                <h5 className="card-title fw-bold mb-3">Mancal de eje libre</h5>
                                                <p className="card-text text-muted small mb-4">Libre para acoplamiento a motor.</p>
                                                <a href="/catalogo" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver Detalles</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button className="carousel-control-prev w-auto ps-3" type="button" data-bs-target="#carruselProductos" data-bs-slide="prev">
                            <span className={`carousel-control-prev-icon bg-secondary rounded-circle p-3 ${styles.carouselButtonIcon}`} aria-hidden="true"></span>
                        </button>
                        <button className="carousel-control-next w-auto pe-3" type="button" data-bs-target="#carruselProductos" data-bs-slide="next">
                            <span className={`carousel-control-next-icon bg-secondary rounded-circle p-3 ${styles.carouselButtonIcon}`} aria-hidden="true"></span>
                        </button>
                    </div>
                </section>

                <hr className="my-5" />

                {/* Seccion: Marcas */}
                <section>
                    <h4 className={`fw-bold text-uppercase mb-4 text-center ${styles.textTitulos}`}>
                        Marcas que Representamos
                    </h4>
                    <div className={styles.marcasContainer}>
                        <div className={styles.marcasTrack}>
                            
                            {/* GRUPO 1 */}
                            <div className={styles.marcaItem}>
                                <img src="/images/pedrollo.png" className={styles.marcaItemImg} alt="Pedrollo" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="/images/caprari.png" className={styles.marcaItemImg} alt="Caprari" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="https://placehold.co/150x60?text=CALPEDA" className={styles.marcaItemImg} alt="Calpeda" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="/images/changfa.png" className={styles.marcaItemImg} alt="Changfa" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="/images/koshin.png" className={styles.marcaItemImg} alt="Koshin" />
                            </div>

                            {/* GRUPO 2 (Duplicado para el efecto infinito) */}
                            <div className={styles.marcaItem}>
                                <img src="/images/pedrollo.png" className={styles.marcaItemImg} alt="Pedrollo" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="/images/caprari.png" className={styles.marcaItemImg} alt="Caprari" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="https://placehold.co/150x60?text=CALPEDA" className={styles.marcaItemImg} alt="Calpeda" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="/images/changfa.png" className={styles.marcaItemImg} alt="Changfa" />
                            </div>
                            <div className={styles.marcaItem}>
                                <img src="/images/koshin.png" className={styles.marcaItemImg} alt="Koshin" />
                            </div>

                        </div>
                    </div>
                </section>

                <hr className="my-5" />

                {/* Seccion: Aplicaciones */}
                <section className="mb-5">
                    <h3 className={`fw-bold text-uppercase mb-4 text-center ${styles.textTitulos}`}>
                        Aplicaciones y Sectores
                    </h3>
                    <div className="row g-4">
                        <div className="col-md-6 col-lg-3">
                            <div className="card h-100 shadow-sm border-0">
                                <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                    <img src="/images/DOMICILIARIO.webp" className={`img-fluid ${styles.applicationImage}`} alt="Uso doméstico" />
                                </div>
                                <div className="card-body text-center p-4">
                                    <h5 className="card-title fw-bold mb-3">Uso Doméstico</h5>
                                    <p className="card-text text-muted small mb-4">Presurización para edificios y viviendas.</p>
                                    <a href="/catalogo?cat=domestico" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver más</a>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-3">
                            <div className="card h-100 shadow-sm border-0">
                                <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                    <img src="/images/CIVIL.webp" className={`img-fluid ${styles.applicationImage}`} alt="Sector civil" />
                                </div>
                                <div className="card-body text-center p-4">
                                    <h5 className="card-title fw-bold mb-3">Sector Civil</h5>
                                    <p className="card-text text-muted small mb-4">Construcciones, edificios, etc.</p>
                                    <a href="/catalogo?cat=civil" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver más</a>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-3">
                            <div className="card h-100 shadow-sm border-0">
                                <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                    <img src="/images/AGRICOLA.webp" className={`img-fluid ${styles.applicationImage}`} alt="Agrícola" />
                                </div>
                                <div className="card-body text-center p-4">
                                    <h5 className="card-title fw-bold mb-3">Agrícola</h5>
                                    <p className="card-text text-muted small mb-4">Trabajos en el campo.</p>
                                    <a href="/catalogo?cat=agricola" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver más</a>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-3">
                            <div className="card h-100 shadow-sm border-0">
                                <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                    <img src="/images/INDUSTRIAL.webp" className={`img-fluid ${styles.applicationImage}`} alt="Industrial" />
                                </div>
                                <div className="card-body text-center p-4">
                                    <h5 className="card-title fw-bold mb-3">Industrial</h5>
                                    <p className="card-text text-muted small mb-4">Para trabajos exigentes.</p>
                                    <a href="/servicios" className="btn btn-outline-primary w-100 rounded-pill stretched-link">Ver más</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="my-5" />

                {/* Seccion: Eventos y Novedades */}
                <section className="mb-5">
                    <h3 className={`fw-bold text-uppercase mb-4 text-center ${styles.textTitulos}`}>
                        Eventos y Novedades
                    </h3>
                    <div className="row g-4">
                        
                        {/* Iteracion de eventos */}
                        {eventos.length > 0 ? (
                            eventos.map((evento) => (
                                <div className="col-md-6 col-lg-4" key={evento.id}>
                                    <div className="card h-100 shadow-sm border-0">
                                        <div className={`p-4 d-flex align-items-center justify-content-center ${styles.productImageContainer}`}>
                                            <img 
                                                src={`/images/${evento.imagen}`} 
                                                className={`img-fluid shadow-sm ${styles.applicationImage}`} 
                                                alt={evento.titulo} 
                                            />
                                        </div>
                                        <div className="card-body text-center p-4">
                                            <h5 className="card-title fw-bold mb-3">
                                                {evento.titulo}
                                            </h5>
                                            <p className="card-text text-muted small mb-4">
                                                {evento.descripcion.substring(0, 100)}...
                                            </p>
                                            
                                            <div className="text-muted small mb-3">
                                                {new Date(evento.fecha_evento).toLocaleDateString()}
                                            </div>

                                            <a href={`/eventos/${evento.id}`} className="btn btn-outline-primary w-100 rounded-pill stretched-link">Leer más</a>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center w-100">No hay eventos próximos.</p>
                        )}

                    </div>
                </section>

            </div>

            {/* INTEGRACION DEL WIDGET DE CHATBOT */}
            <ChatbotWidget />

        </div>
    );
};

export default LandingPage;