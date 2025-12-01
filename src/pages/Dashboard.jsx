// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext'; 
import { 
    UsersIcon, BriefcaseIcon, TrophyIcon, MegaphoneIcon, CakeIcon, 
    CalendarIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/outline'; 
import { motion } from 'framer-motion'; 

/**
 * Función para obtener la URL base del servidor Laravel.
 * Si el baseURL de Axios es 'http://api.intranet.test/api', esta función devuelve 'http://api.intranet.test'.
 * Esto es necesario para acceder a la carpeta /storage.
 */
const getBaseUrl = (apiClient) => apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace('/api', '') : 'http://localhost:8000';

// =======================================================================
// --- COMPONENTE CARRUSEL DE NOTICIAS CON GESTIÓN DE IMAGEN Y CONTRASTE ---
// =======================================================================

const NewsCarousel = ({ newsList = [], IMAGE_BASE_URL }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === newsList.length - 1 ? 0 : prevIndex + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? newsList.length - 1 : prevIndex - 1));
    };

    // Auto-avance del carrusel cada 5 segundos
    useEffect(() => {
        if (newsList.length > 1) {
            const interval = setInterval(nextSlide, 5000);
            return () => clearInterval(interval);
        }
    }, [newsList.length]);

    if (newsList.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-emerald-600 text-center text-gray-500 italic h-[450px] flex items-center justify-center">
                <p>No hay noticias publicadas para el carrusel.</p>
            </div>
        );
    }
    
    /**
     * ✅ SOLUCIÓN DE IMAGEN: Transforma la ruta interna de Laravel ('public/news_images/...')
     * a la URL pública accesible por el navegador. Usamos la ruta RELATIVA ('/storage/...')
     * para asegurar el correcto funcionamiento, especialmente en entornos de desarrollo.
     */
    const getImageUrl = (path) => {
        if (!path) return '/placeholder.jpg'; // Imagen por defecto si no hay ruta
        
        // Reemplaza 'public/' por 'storage/'
        const normalizedPath = path.startsWith('public/') ? path.replace('public/', 'storage/') : path;
        
        // Retorna la ruta relativa: /storage/news_images/archivo.jpg
        return `${IMAGE_BASE_URL}/${normalizedPath}`;
    }


    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            className="relative w-full overflow-hidden rounded-xl shadow-xl border border-gray-200 h-[450px]"
        >
            <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {newsList.map((news, index) => (
                    <div 
                        key={news.id || index} 
                        className="w-full flex-shrink-0 relative h-full"
                        style={{ 
                            // Uso de la URL generada para el fondo
                            backgroundImage: `url(${getImageUrl(news.image_path)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* ✅ MEJORA DE CONTRASTE: Overlay más ligero (bg-opacity-20) para 
                            que la imagen se vea más, y un gradiente fuerte en la parte inferior 
                            para asegurar la legibilidad del texto blanco. 
                        */}
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end">
                            <div className="p-6 w-full bg-gradient-to-t from-black/80 to-transparent">
                                {/* Título de la noticia (Campo: title) */}
                                <h3 className="text-3xl font-bold text-white mb-2 leading-snug">{news.title}</h3>
                                
                                {/* Descripción de la noticia (Campo: description) */}
                                <p className="text-sm text-gray-200 line-clamp-2">{news.description}</p>
                                
                                {/* Fecha de publicación (Campo: published_at) */}
                                <p className="text-xs text-yellow-300 mt-2">Publicado: {new Date(news.published_at).toLocaleDateString('es-CO')}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Botones de Navegación */}
            {newsList.length > 1 && (
                <>
                    <button 
                        onClick={prevSlide} 
                        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white transition-colors z-10"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={nextSlide} 
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white transition-colors z-10"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Indicadores de diapositiva */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {newsList.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                ))}
            </div>
        </motion.div>
    );
};


// =======================================================================
// --- OTROS COMPONENTES DE RESUMEN ---
// =======================================================================

// Componente para mostrar los últimos Objetivos
const RecentObjectivesCard = ({ objectivesList = [] }) => (
    <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
    >
        <div className="flex items-center space-x-3 text-indigo-600 mb-4 border-b border-gray-100 pb-2">
            <TrophyIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Objetivos Pendientes</h2>
        </div>
        {objectivesList.length > 0 ? (
            <ul className="space-y-3 pt-2">
                {objectivesList.map((obj, index) => (
                    <li key={obj.id || index} className="flex flex-col text-gray-700 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-300 hover:bg-indigo-100 transition-colors">
                        <span className="font-medium text-indigo-800 truncate">{obj.title_objective}</span>
                        <span className="text-xs text-gray-500 mt-0.5">
                            Fecha Límite: {new Date(obj.end_date_objective).toLocaleDateString('es-CO')}
                        </span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-500 pt-2 text-center italic">No hay objetivos pendientes.</p>
        )}
    </motion.div>
);

// Componente para mostrar los Eventos del mes (o próximos)
const MonthlyEvents = ({ events = [] }) => (
    <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow" 
    >
        <div className="flex items-center space-x-3 text-yellow-600 mb-4 border-b border-gray-100 pb-2">
            <CalendarIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Próximos Eventos</h2>
        </div>
        {events.length > 0 ? (
            <ul className="space-y-3 pt-2">
                {events.map((event, index) => (
                    <li key={event.id || index} className="flex justify-between items-center text-gray-700 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-300 hover:bg-yellow-100 transition-colors">
                        <span className="flex items-center text-yellow-800">
                            <SparklesIcon className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0"/>
                            <span className="truncate">{event.title_event}</span>
                        </span>
                        <span className="font-medium text-yellow-700 text-sm flex-shrink-0 ml-2">
                            {new Date(event.event_date).toLocaleDateString('es-CO')}
                        </span>
                    </li>
                ))}
            </ul>
        ) : (
             <p className="text-gray-500 pt-2 text-center italic">No hay eventos próximos.</p>
        )}
    </motion.div>
);


// -------------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL: Dashboard.jsx ---

export default function Dashboard() {
    const { apiClient, user } = useAuth(); // Obtener el usuario y el cliente de API
    const IMAGE_BASE_URL = getBaseUrl(apiClient); // Obtenemos la URL base del servidor

    // Estados
    const [newsList, setNewsList] = useState([]);
    const [objectivesList, setObjectivesList] = useState([]);
    const [eventsList, setEventsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Datos de ejemplo/mock para otras tarjetas
    // Puedes reemplazar esto con llamadas a la API para contar usuarios, empresas, etc.
    const [metrics, setMetrics] = useState({ users: 24, companies: 8, regionals: 3 }); 
    const [birthdays, setBirthdays] = useState([]); 

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Realizar todas las llamadas API en paralelo
                const [newsResponse, objectivesResponse, eventsResponse] = await Promise.all([
                    apiClient.get('/news'), // API de Noticias
                    apiClient.get('/objectives'), // API de Objetivos
                    apiClient.get('/events'), // API de Eventos
                ]);
                
                // 1. Noticias para el carrusel
                setNewsList(newsResponse.data || []); 

                // 2. Objetivos (Tomar los 5 más recientes/pendientes)
                setObjectivesList(objectivesResponse.data ? objectivesResponse.data.slice(0, 5) : []); 

                // 3. Eventos (Tomar los 5 más recientes/próximos)
                setEventsList(eventsResponse.data ? eventsResponse.data.slice(0, 5) : []); 
                
                // Datos mock para cumpleaños
                setBirthdays([
                    { name: 'Juan Pérez', date: '05/Dic' },
                    { name: 'Ana Gómez', date: '12/Dic' },
                    { name: 'Carlos Ruiz', date: '15/Dic' },
                ]);

            } catch (error) {
                console.error("Error al cargar datos del dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [apiClient]); 


    if (loading) {
        return (
            <AuthenticatedLayout title="Cargando Panel">
                <div className="flex justify-center items-center h-full py-20">
                    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg font-medium text-gray-700">Cargando información del panel...</span>
                </div>
            </AuthenticatedLayout>
        );
    }
    
    // Contenido JSX del Dashboard
    return (
        <AuthenticatedLayout title="Panel de Control">
            <div className="py-12 bg-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* 1. SECCIÓN DE BIENVENIDA Y VIDEO */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white p-8 rounded-xl shadow-lg mb-10 border-t-4 border-indigo-600"
                    >
                        {/* Saludo Personalizado */}
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            ¡Bienvenido, <span className="text-indigo-600">{user?.name || 'Usuario'}</span>!
                        </h1>
                        <p className="text-lg text-gray-500 mt-1">
                            Este es tu resumen ejecutivo del sistema.
                        </p>
                        
                        {/* Contenedor del Video */}
                        <div className="mt-6 w-full aspect-video rounded-lg overflow-hidden shadow-xl">
                             <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/TCeimTP8itc?si=N7m-SsH65DjtoxAo" // REEMPLAZAR con URL de video institucional
                                title="Video Institucional de Bienvenida" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </motion.div>

                    {/* 2. CARRUSEL DE NOTICIAS */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Últimas Noticias</h2>
                        <NewsCarousel newsList={newsList} IMAGE_BASE_URL={IMAGE_BASE_URL} />
                    </div>

                    {/* 3. SECCIÓN DE MÉTRICAS PRINCIPALES (Targetas) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
                                <UsersIcon className="w-7 h-7 text-blue-600 bg-blue-100 p-1 rounded-full" />
                            </div>
                            <p className="text-4xl font-extrabold text-gray-900 mt-2">{metrics.users}</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                            className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Empresas Registradas</p>
                                <BriefcaseIcon className="w-7 h-7 text-red-600 bg-red-100 p-1 rounded-full" />
                            </div>
                            <p className="text-4xl font-extrabold text-gray-900 mt-2">{metrics.companies}</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                            className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-600 hover:bg-yellow-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Próximos Eventos</p>
                                <CalendarIcon className="w-7 h-7 text-yellow-600 bg-yellow-100 p-1 rounded-full" />
                            </div>
                            <p className="text-4xl font-extrabold text-gray-900 mt-2">{eventsList.length}</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                            className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Objetivos Pendientes</p>
                                <TrophyIcon className="w-7 h-7 text-indigo-600 bg-indigo-100 p-1 rounded-full" />
                            </div>
                            <p className="text-4xl font-extrabold text-gray-900 mt-2">{objectivesList.length}</p>
                        </motion.div>
                    </div>

                    {/* 4. SECCIÓN DE RESUMEN: Objetivos y Eventos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <RecentObjectivesCard objectivesList={objectivesList} />
                        <MonthlyEvents events={eventsList} /> 
                    </div>

                    {/* 5. SECCIÓN DE CUMPLEAÑOS */}
                     <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                            className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow" 
                        >
                            <div className="flex items-center space-x-3 text-pink-600 mb-4 border-b border-gray-100 pb-2">
                                <CakeIcon className="w-6 h-6" />
                                <h2 className="text-xl font-semibold text-gray-800">Cumpleaños (Próximos)</h2>
                            </div>
                            <ul className="space-y-3 pt-2">
                                {birthdays.length > 0 ? (
                                    birthdays.map((person, index) => (
                                        <li key={index} className="flex justify-between items-center text-gray-700 p-3 bg-pink-50 rounded-lg border-l-4 border-pink-300 hover:bg-pink-100 transition-colors">
                                            <span className="flex items-center text-pink-800">
                                                <SparklesIcon className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0"/>
                                                <span className="font-medium truncate">{person.name}</span>
                                            </span>
                                            <span className="font-semibold text-pink-700 text-sm flex-shrink-0 ml-2">{person.date}</span>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-gray-500 pt-2 text-center italic">No hay cumpleaños cercanos.</p>
                                )}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}