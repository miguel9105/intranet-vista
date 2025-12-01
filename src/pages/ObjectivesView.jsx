// src/views/ObjectivesView.jsx
import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { Target, AlignLeft, Calendar, Save, X } from 'lucide-react'; 

const ENDPOINT = '/objectives';

// Función auxiliar para formatear la fecha a YYYY-MM-DD (necesario para input type="date")
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString.substring(0, 10);
};

// ====================================================================
// ✅ SOLUCIÓN: Componente Input Personalizado MOVIDO FUERA del componente principal
// Esto previene que se recree en cada render y cause la pérdida de foco.
// ====================================================================
const CustomInput = ({ icon: Icon, label, name, value, onChange, ...props }) => (
    <div className="relative group">
        <label className="text-gray-600 text-sm font-medium block mb-1">{label}</label>
        <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-transparent focus-within:ring-2 transition duration-300 bg-gray-50/70 p-2">
            {Icon && <Icon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 transition-colors group-focus-within:text-blue-700" />}
            <input
                className="w-full p-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800"
                name={name}
                value={value} 
                onChange={onChange} 
                {...props}
            />
        </div>
    </div>
);


export default function ObjectivesView() {
    const { apiClient } = useAuth();
    const PRIMARY_COLOR = 'rgba(5, 25, 49)'; 
    
    const [objectives, setObjectives] = useState([]);
    const [formData, setFormData] = useState({ 
        title_objective: '',         
        description_objective: '',   
        start_date_objective: '',    
        end_date_objective: ''       
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchObjectives();
    }, []);

    const fetchObjectives = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(ENDPOINT);
            setObjectives(response.data);
        } catch (err) {
            setError('Error al cargar objetivos. Verifique su rol y conexión.');
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
            title_objective: '', 
            description_objective: '', 
            start_date_objective: '', 
            end_date_objective: '' 
        }); 
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        const dataToSend = {
            title_objective: formData.title_objective,
            description_objective: formData.description_objective,
            start_date_objective: formatDateForInput(formData.start_date_objective),
            end_date_objective: formatDateForInput(formData.end_date_objective),
        };

        try {
            if (editingId) {
                await apiClient.put(`${ENDPOINT}/${editingId}`, dataToSend);
                alert('Objetivo actualizado exitosamente!');
            } else {
                await apiClient.post(ENDPOINT, dataToSend);
                alert('Objetivo creado exitosamente!');
            }
            resetForm();
            fetchObjectives();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error al guardar el objetivo.';
            setError(errorMessage);
            console.error(err.response?.data || err);
        }
    };

    const handleEdit = (obj) => {
        setEditingId(obj.id);
        
        setFormData({
            title_objective: obj.title_objective,         
            description_objective: obj.description_objective, 
            start_date_objective: formatDateForInput(obj.start_date_objective), 
            end_date_objective: formatDateForInput(obj.end_date_objective),     
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que quieres eliminar este objetivo?')) return;
        try {
            await apiClient.delete(`${ENDPOINT}/${id}`);
            alert('Objetivo eliminado!');
            fetchObjectives();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar el objetivo.');
            console.error(err);
        }
    };

    return (
        <AuthenticatedLayout title="Gestión de Objetivos">
            <div className="p-6">
                <h3 className="text-2xl font-light text-gray-800 border-b pb-2 mb-6">
                    {editingId ? 'Editar Objetivo' : 'Crear Nuevo Objetivo'}
                </h3>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">¡Error! {error}</div>}

                {/* ESTRUCTURA DE FORMULARIO LLAMATIVA Y DIFERENTE */}
                <form 
                    onSubmit={handleSubmit} 
                    style={{ borderTopColor: PRIMARY_COLOR }}
                    className="bg-white p-8 rounded-xl shadow-2xl transition-all duration-500 mb-8 max-w-4xl mx-auto border-t-8 border-opacity-70"
                >
                    <div className="grid grid-cols-1 gap-6">
                        
                        {/* Sección 1: Título y Descripción (Énfasis en el objetivo) */}
                        <h4 className="text-xl font-medium text-gray-700 flex items-center mb-2">
                            <Target className="w-6 h-6 mr-2" style={{ color: PRIMARY_COLOR }} /> 
                            Detalles del Objetivo
                        </h4>
                        
                        <CustomInput 
                            icon={Target}
                            label="Título Principal"
                            name="title_objective" 
                            value={formData.title_objective} 
                            onChange={handleChange}          
                            placeholder="Ej: Aumentar la producción en un 15%" 
                            required 
                            type="text"
                        />
                        
                        <div className="relative group">
                            <label className="text-gray-600 text-sm font-medium block mb-1">Descripción Detallada</label>
                            <div className="flex items-start border border-gray-300 rounded-lg focus-within:border-transparent focus-within:ring-2 transition duration-300 bg-gray-50/70 p-2">
                                <AlignLeft className="w-5 h-5 text-gray-400 mt-2 mr-3 flex-shrink-0 transition-colors group-focus-within:text-blue-700" />
                                <textarea 
                                    className="w-full p-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800" 
                                    name="description_objective" 
                                    value={formData.description_objective} 
                                    onChange={handleChange} 
                                    placeholder="Detalles sobre cómo se logrará el objetivo y sus métricas..."
                                    rows="4"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* Sección 2: Fechas */}
                        <div className="border-t pt-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <h4 className="text-xl font-medium text-gray-700 flex items-center col-span-1 md:col-span-2 mb-2">
                                <Calendar className="w-6 h-6 mr-2" style={{ color: PRIMARY_COLOR }} /> 
                                Plazos
                            </h4>
                            
                            <CustomInput 
                                icon={Calendar}
                                label="Fecha de Inicio"
                                name="start_date_objective" 
                                value={formData.start_date_objective} 
                                onChange={handleChange} 
                                required 
                                type="date"
                            />
                            
                            <CustomInput 
                                icon={Calendar}
                                label="Fecha Límite"
                                name="end_date_objective" 
                                value={formData.end_date_objective} 
                                onChange={handleChange} 
                                required 
                                type="date"
                            />
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-4 pt-8 justify-end">
                        <button 
                            type="submit" 
                            style={{ backgroundColor: PRIMARY_COLOR }} 
                            className="flex items-center text-white py-3 px-8 rounded-full font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-[1.01]"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {editingId ? 'Actualizar Objetivo' : 'Crear Objetivo'}
                        </button>
                        {editingId && (
                            <button 
                                type="button" 
                                onClick={resetForm} 
                                className="flex items-center bg-gray-300 text-gray-800 py-3 px-6 rounded-full font-semibold hover:bg-gray-400 transition"
                            >
                                <X className="w-5 h-5 mr-2" />
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>

                {/* Lista de Objetivos (Minimalista) */}
                <h3 className="text-2xl font-light text-gray-800 border-b pb-2 mb-6 mt-10">
                    Listado de Objetivos
                </h3>
                {loading ? (
                    <p className="text-gray-500">Cargando objetivos...</p>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}> 
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">Título</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Inicio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {objectives.map((obj) => (
                                    <tr key={obj.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obj.title_objective}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{obj.description_objective.substring(0, 50)}...</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateForInput(obj.start_date_objective)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateForInput(obj.end_date_objective)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button 
                                                onClick={() => handleEdit(obj)} 
                                                className="text-blue-700 hover:text-blue-900 mr-3 font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(obj.id)} 
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