// src/views/EventsView.jsx
import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';

const ENDPOINT = '/events';

export default function EventsView() {
    const { apiClient } = useAuth();
    // Color principal solicitado para el diseño
    const PRIMARY_COLOR = 'rgba(5, 25, 49)'; 

    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({ 
        title_event: '',      // <-- CORREGIDO
        description_event: '',// <-- CORREGIDO
        event_date: '' 
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(ENDPOINT);
            setEvents(response.data);
        } catch (err) {
            setError('Error al cargar eventos. Verifique su rol y conexión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const resetForm = () => {
        setFormData({ 
            title_event: '', 
            description_event: '', 
            event_date: '' 
        }); 
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Aseguramos que los campos coincidan con la migración
            const dataToSend = {
                title_event: formData.title_event,
                description_event: formData.description_event,
                event_date: formData.event_date
            };
            
            if (editingId) {
                await apiClient.put(`${ENDPOINT}/${editingId}`, dataToSend);
                alert('Evento actualizado exitosamente!');
            } else {
                await apiClient.post(ENDPOINT, dataToSend);
                alert('Evento creado exitosamente!');
            }
            resetForm();
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el evento.');
            console.error(err);
        }
    };

    const handleEdit = (event) => {
        setEditingId(event.id);
        // Formatea la fecha y hora a 'YYYY-MM-DDTHH:MM' para el input datetime-local
        const date = new Date(event.event_date);
        const formattedDate = date.toISOString().slice(0, 16);
        setFormData({
            title_event: event.title_event,       // <-- CORREGIDO
            description_event: event.description_event, // <-- CORREGIDO
            event_date: formattedDate,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que quieres eliminar este evento?')) return;
        try {
            await apiClient.delete(`${ENDPOINT}/${id}`);
            alert('Evento eliminado!');
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar el evento.');
            console.error(err);
        }
    };

    return (
        <AuthenticatedLayout title="Gestión de Eventos">
            <div className="p-6">
                <h3 className="text-2xl font-light text-gray-800 border-b pb-2 mb-6">
                    {editingId ? 'Editar Evento' : 'Crear Nuevo Evento'}
                </h3>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">¡Error! {error}</div>}

                {/* Formulario minimalista */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100">
                    <input 
                        className="p-3 border border-gray-300 rounded focus:ring-1 focus:ring-opacity-50 col-span-1 md:col-span-2 focus:border-transparent transition" 
                        name="title_event" // <-- CORREGIDO
                        value={formData.title_event} 
                        onChange={handleChange} 
                        placeholder="Título del Evento" 
                        required 
                    />
                    <textarea 
                        className="p-3 border border-gray-300 rounded focus:ring-1 focus:ring-opacity-50 col-span-1 md:col-span-2 focus:border-transparent transition" 
                        name="description_event" // <-- CORREGIDO
                        value={formData.description_event} 
                        onChange={handleChange} 
                        placeholder="Descripción"
                        rows="3"
                    ></textarea>
                    <label className="block col-span-1 md:col-span-2">
                        <span className="text-gray-600 text-sm font-medium">Fecha y Hora del Evento:</span>
                        <input 
                            className="p-3 border border-gray-300 rounded w-full mt-1 focus:ring-1 focus:ring-opacity-50 focus:border-transparent transition" 
                            type="datetime-local" 
                            name="event_date" 
                            value={formData.event_date} 
                            onChange={handleChange} 
                            required 
                        />
                    </label>
                    <div className="col-span-1 md:col-span-2 flex gap-4 pt-2">
                        <button 
                            type="submit" 
                            style={{ backgroundColor: PRIMARY_COLOR }} 
                            className="text-white py-3 px-6 rounded-full font-semibold shadow-md hover:shadow-lg transition flex-grow"
                        >
                            {editingId ? 'Actualizar Evento' : 'Crear Evento'}
                        </button>
                        {editingId && (
                            <button 
                                type="button" 
                                onClick={resetForm} 
                                className="bg-gray-200 text-gray-700 py-3 px-6 rounded-full font-semibold hover:bg-gray-300 transition"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>

                {/* Lista de Eventos */}
                <h3 className="text-2xl font-light text-gray-800 border-b pb-2 mb-6">
                    Listado de Eventos
                </h3>
                {loading ? (
                    <p className="text-gray-500">Cargando eventos...</p>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">Título</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha y Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-center rounded-tr-lg">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.title_event}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(event.event_date).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{event.description_event.substring(0, 50)}...</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                            <button 
                                                onClick={() => handleEdit(event)} 
                                                className="text-blue-700 hover:text-blue-900 mr-3 font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(event.id)} 
                                                className="text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}