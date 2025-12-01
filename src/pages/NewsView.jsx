// src/views/NewsView.jsx
import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { PhotoIcon, TrashIcon, PencilSquareIcon, CalendarIcon } from '@heroicons/react/24/outline';


const ENDPOINT = '/news';
const PRIMARY_COLOR = 'rgba(5, 25, 49)'; // Color principal solicitado

// =======================================================================
// --- HELPERS (Funciones de soporte) ---
// =======================================================================

/**
 * Función para generar la URL pública de la imagen.
 * Convierte 'public/news_images/file.png' a 'http://base/storage/news_images/file.png'.
 * @param {string} path - La ruta de la imagen almacenada en la base de datos (Ej: 'public/news_images/...')
 * @param {string} baseUrl - La URL base del servidor (Ej: 'http://api.intranet.test')
 */
const getFinalImageUrl = (path, baseUrl) => {
    if (!path) return null;
    // Elimina el prefijo 'public/' de la ruta de almacenamiento
    const pathWithoutPublic = path.startsWith('public/') ? path.replace('public/', '') : path;
    // Asegura que la baseUrl no termine en '/' y agrega '/storage/'
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    // Genera la URL completa
    return `${normalizedBaseUrl}/storage/${pathWithoutPublic}`;
};


// =======================================================================
// --- COMPONENTES ---
// =======================================================================

const NewsCard = ({ news, handleEdit, handleDelete, IMAGE_BASE_URL }) => {
    const imageUrl = getFinalImageUrl(news.image_path, IMAGE_BASE_URL);
    
    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col border border-gray-100">
            {/* Imagen de la Tarjeta */}
            <div className="h-48 relative overflow-hidden">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={news.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <PhotoIcon className="w-10 h-10" />
                    </div>
                )}
            </div>
            
            {/* Contenido de la Tarjeta */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2" title={news.title}>
                    {news.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-grow">
                    {news.description}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                    <CalendarIcon className="w-4 h-4 mr-1"/>
                    <span>Publicado: {new Date(news.published_at).toLocaleDateString()}</span>
                </div>
            </div>
            
            {/* Acciones */}
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                <button 
                    onClick={() => handleEdit(news)} 
                    className="flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium transition"
                >
                    <PencilSquareIcon className="w-5 h-5 mr-1" />
                    Editar
                </button>
                <button 
                    onClick={() => handleDelete(news.id)} 
                    className="flex items-center text-sm text-red-600 hover:text-red-800 font-medium transition"
                >
                    <TrashIcon className="w-5 h-5 mr-1" />
                    Eliminar
                </button>
            </div>
        </div>
    );
};


// =======================================================================
// --- VISTA PRINCIPAL (NewsView) ---
// =======================================================================

export default function NewsView() {
    const { apiClient } = useAuth();
    
    // Determina la URL base para las imágenes a partir del apiClient
    const IMAGE_BASE_URL = apiClient.defaults.baseURL.replace('/api', '');
    
    const [newsList, setNewsList] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', published_at: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // Nuevo estado para la previsualización
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const imageInputRef = useRef(null); 

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(ENDPOINT);
            // Ordenar por fecha de publicación descendente (más recientes primero)
            const sortedNews = response.data.sort((a, b) => 
                new Date(b.published_at) - new Date(a.published_at)
            );
            setNewsList(sortedNews);
        } catch (err) {
            setError('Error al cargar noticias. Verifique su rol (Administrador) y conexión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0] || null;
        setImageFile(file); 
        
        // Generar previsualización de la imagen
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreviewUrl(null);
        }
    };
    
    const resetForm = () => {
        setFormData({ title: '', description: '', published_at: '' });
        setImageFile(null);
        setImagePreviewUrl(null);
        setEditingId(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = ""; 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const dataToSend = new FormData();
        dataToSend.append('title', formData.title);
        dataToSend.append('description', formData.description);
        dataToSend.append('published_at', formData.published_at);
        
        if (imageFile) {
            dataToSend.append('image_path', imageFile); 
        } else if (editingId && !imagePreviewUrl) {
            // Si estamos editando y no se subió una nueva imagen, 
            // no enviamos el campo 'image_path' para que el controlador no lo pise.
        }

        try {
            if (editingId) {
                // Enviar la imagen para Actualización (PATCH/PUT) usando POST
                dataToSend.append('_method', 'POST'); // Se usa POST para subir archivos en la API de Laravel
                
                // NOTA: Si el controlador Laravel usa POST para update con files, no necesitas '_method'.
                // Revisando tu api.php y NewsController.php, ya usas POST para update con files:
                // Route::post('/news/{news}', [NewsController::class, 'update']);
                // Por lo tanto, no es necesario el _method='PUT'.
                
                await apiClient.post(`${ENDPOINT}/${editingId}`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                alert('Noticia actualizada exitosamente!');
            } else {
                // Crear (POST normal)
                await apiClient.post(ENDPOINT, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                alert('Noticia creada exitosamente!');
            }
            resetForm();
            fetchNews();
        } catch (err) {
            const errors = err.response?.data?.errors;
            let errorMessage = 'Error al guardar la noticia. Verifique los campos.';
            if (errors) {
                errorMessage = Object.values(errors).flat().join(' ');
            } else if (err.response?.data?.message) {
                 errorMessage = err.response.data.message;
            }
            setError(errorMessage);
            console.error(err.response?.data || err);
        }
    };

    const handleEdit = (newsItem) => {
        setEditingId(newsItem.id);
        const date = new Date(newsItem.published_at);
        const formattedDate = date.toISOString().slice(0, 16);
        
        setFormData({
            title: newsItem.title,
            description: newsItem.description,
            published_at: formattedDate,
        });
        setImageFile(null); 
        if (imageInputRef.current) {
            imageInputRef.current.value = ""; 
        }
        
        // Establecer la imagen existente como preview
        if (newsItem.image_path) {
             setImagePreviewUrl(getFinalImageUrl(newsItem.image_path, IMAGE_BASE_URL));
        } else {
             setImagePreviewUrl(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¡CUIDADO! ¿Seguro que quieres eliminar esta noticia y su imagen asociada?')) return;
        try {
            await apiClient.delete(`${ENDPOINT}/${id}`);
            alert('Noticia eliminada!');
            fetchNews();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar la noticia.');
            console.error(err);
        }
    };

    const currentImage = editingId 
        ? newsList.find(n => n.id === editingId)?.image_path 
        : null;

    return (
        <AuthenticatedLayout title="Gestión de Noticias">
            <div className="p-6 bg-gray-50 min-h-screen">
                <h3 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-8">
                    {editingId ? 'Editar Noticia' : 'Publicar Nueva Noticia'}
                </h3>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">¡Error! {error}</div>}

                {/* Formulario minimalista con Preview de Imagen */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 bg-white p-8 rounded-xl shadow-lg border-t-4" style={{ borderColor: PRIMARY_COLOR }}>
                    
                    {/* Columna 1 & 2: Campos de Texto */}
                    <div className="lg:col-span-2 space-y-4">
                        <input 
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-opacity-50 text-xl font-semibold" 
                            style={{ '--tw-ring-color': PRIMARY_COLOR }}
                            name="title" 
                            value={formData.title} 
                            onChange={handleChange} 
                            placeholder="Título principal de la Noticia" 
                            required 
                        />
                        <textarea 
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-opacity-50" 
                            style={{ '--tw-ring-color': PRIMARY_COLOR }}
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            placeholder="Descripción detallada de la noticia..."
                            rows="5"
                            required
                        ></textarea>
                        <label className="block">
                            <span className="text-gray-700 font-medium">Fecha y Hora de Publicación:</span>
                            <input 
                                className="p-3 border border-gray-300 rounded-lg w-full mt-1 focus:ring-1 focus:ring-opacity-50" 
                                style={{ '--tw-ring-color': PRIMARY_COLOR }}
                                type="datetime-local" 
                                name="published_at" 
                                value={formData.published_at} 
                                onChange={handleChange} 
                                required 
                            />
                        </label>
                    </div>

                    {/* Columna 3: Gestión y Preview de Imagen */}
                    <div className="lg:col-span-1 flex flex-col space-y-4">
                        <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden border-4 border-dashed flex items-center justify-center relative">
                            {imagePreviewUrl ? (
                                <img 
                                    src={imagePreviewUrl} 
                                    alt="Vista previa de la imagen" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center text-gray-500 p-4">
                                    <PhotoIcon className="w-12 h-12 mx-auto" />
                                    <p className="mt-2 text-sm">Previsualización de imagen</p>
                                </div>
                            )}
                        </div>
                        
                        <label className="block">
                            <span className="text-gray-700 font-medium">Cargar Imagen (Max 2MB):</span>
                            <input 
                                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white mt-1 
                                           file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:text-white"
                                style={{ 
                                    '--file-bg-color': PRIMARY_COLOR,
                                    backgroundColor: 'white'
                                }}
                                type="file" 
                                name="image_path" 
                                onChange={handleFileChange} 
                                ref={imageInputRef}
                                // Requerido solo si es nuevo O si se está editando y no hay imagen previa
                                required={!editingId || !currentImage}
                            />
                        </label>
                        
                        <div className="flex gap-3 pt-2">
                             <button 
                                type="submit" 
                                style={{ backgroundColor: PRIMARY_COLOR }} 
                                className="text-white py-3 px-6 rounded-lg font-bold shadow-md hover:shadow-lg transition flex-grow"
                            >
                                {editingId ? 'Actualizar' : 'Publicar'}
                            </button>
                            {editingId && (
                                <button 
                                    type="button" 
                                    onClick={resetForm} 
                                    className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Listado de Noticias en Tarjetas Minimalistas */}
                <h3 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-8 mt-12">
                    Noticias Publicadas ({newsList.length})
                </h3>
                {loading ? (
                    <p className="text-gray-500 py-10 text-center">Cargando noticias...</p>
                ) : newsList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {newsList.map((news) => (
                            <NewsCard 
                                key={news.id} 
                                news={news} 
                                handleEdit={handleEdit} 
                                handleDelete={handleDelete} 
                                IMAGE_BASE_URL={IMAGE_BASE_URL}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center text-gray-500 bg-white rounded-xl shadow-md">
                        <p>No hay noticias publicadas aún.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}