// src/components/ChatbotWidget.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import styles from './ChatbotWidget.module.css';

// 1. IMPORTA TU IMAGEN AQUÍ
// Asumiendo que guardaste la imagen en src/assets/mascota.png
// import imagenMascota from '../assets/mascota.png'; 

const ChatbotWidget = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'bot', text: '¡Hola! Soy el asistente virtual de San Rafael. ¿Qué tipo de bomba de agua estás buscando hoy?', products: [] }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    
    const chatEndRef = useRef(null);

    // Auto-scroll hacia abajo cuando hay mensajes nuevos
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/chatbot/', { mensaje: userMsg });
            
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: response.data.respuesta,
                products: response.data.productos 
            }]);
            
        } catch (error) {
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: 'Lo siento, estoy teniendo problemas de conexión. Por favor, intenta de nuevo más tarde.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`position-fixed bottom-0 end-0 m-3 m-md-4 ${styles.chatContainer}`}>
            
            {!isOpen ? (
                // === INICIO CAMBIO PARA LA MASCOTA ===
                <button 
                    type="button"
                    // Quitamos las clases de Bootstrap que dan color y padding btn-primary, p-3
                    // Mantenemos d-flex, ms-auto para posicionamiento
                    // border-0 y bg-transparent para que solo se vea la imagen
                    className="border-0 bg-transparent ms-auto d-flex align-items-center justify-content-center p-0"
                    onClick={() => setIsOpen(true)}
                    title="Hablar con un asesor virtual"
                >
                    <img 
                        // OPCIÓN A: Si usaste import arriba
                        // src={imagenMascota} 
                        
                        // OPCIÓN B: Si pusiste la imagen en la carpeta 'public/assets/'
                        src="/images/mascota.png" // <- CAMBIA ESTA RUTA POR LA DE TU IMAGEN
                        
                        alt="Mascota Asesor Virtual San Rafael" 
                        // Usamos clases de Bootstrap para sombra y bordes redondeados si quieres
                        className="shadow-lg rounded-circle img-fluid"
                        // Ajusta el tamaño aquí según necesites
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
                    />
                </button>
                // === FIN CAMBIO PARA LA MASCOTA ===
            ) : (
                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3 rounded-top-4">
                        <div className="fw-bold d-flex align-items-center gap-2">
                            <span>🤖</span> Asistente San Rafael
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setIsOpen(false)}></button>
                    </div>

                    <div className={`card-body d-flex flex-column p-3 ${styles.chatBody}`}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                                <div className={msg.sender === 'user' ? styles.messageUser : styles.messageBot}>
                                    {msg.text}
                                </div>
                                
                                {msg.products && msg.products.length > 0 && (
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        {msg.products.map(p => (
                                            <div key={p.id} className={styles.productCard}>
                                                <div className="fw-bold text-dark">{p.nombre}</div>
                                                <div className="text-muted small">SKU: {p.sku}</div>
                                                <div className="text-success fw-bold">Bs. {p.precio}</div>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary w-100 mt-2"
                                                    onClick={() => {
                                                        setIsOpen(false); // Cerramos el chat para que no estorbe
                                                        // Navegamos al catálogo pasando el producto en el state
                                                        navigate('/catalogo', { state: { productoDesdeChatbot: p } });
                                                    }}
                                                >
                                                    Cotizar Producto
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className={styles.messageBot}>
                                <span className="text-muted small">Escribiendo...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="card-footer bg-white border-top-0 p-3 rounded-bottom-4">
                        <form onSubmit={sendMessage} className="d-flex gap-2">
                            <input 
                                type="text" 
                                className="form-control rounded-pill bg-light"
                                placeholder="Ej: Bomba para 3 pisos..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary rounded-circle px-3" disabled={!input.trim() || isLoading}>
                                ➣
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
