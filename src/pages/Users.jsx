import React, { useEffect, useState, useCallback } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { 
    PencilIcon, TrashIcon, PlusIcon, XMarkIcon, 
    MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, InformationCircleIcon 
} from '@heroicons/react/24/outline'; 

const PRIMARY_COLOR = 'rgba(5, 25, 49)'; 
const ERROR_CLASS_MAIN = 'p-4 font-bold text-white bg-red-700 rounded-lg shadow-xl border-2 border-red-800';
const ERROR_CLASS_MODAL = 'p-3 font-semibold text-red-800 bg-red-100 rounded-lg border border-red-300'; 

// ===============================================
// 1. MODAL DE FORMULARIO
// ===============================================
const UserFormModal = ({ isOpen, onClose, userToEdit, onSave, selectOptions, isLoadingOptions }) => {
    if (!isOpen) return null;
    if (isLoadingOptions) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: PRIMARY_COLOR }}></div>
                <p>Cargando opciones...</p>
            </div>
        </div>
    );

    const isEditing = !!userToEdit;
    const { apiClient } = useAuth();
    const { roles, companies, regionals, positions, costCenters } = selectOptions;
    const [filteredCostCenters, setFilteredCostCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name_user: '', last_name_user: '', birthdate: '', email: '', number_document: '',
        company_id: '', regional_id: '', position_id: '', cost_center_id: '',
        password: '', confirm_password: '', role_name: ''
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                ...userToEdit,
                birthdate: userToEdit.birthdate?.split('T')[0] || '',
                password: '', confirm_password: '',
                role_name: userToEdit.roles?.[0]?.name || roles[0]?.name || ''
            });
        } else {
            setFormData({
                name_user: '', last_name_user: '', birthdate: '', email: '', number_document: '',
                company_id: companies[0]?.id || '', regional_id: regionals[0]?.id || '',
                position_id: positions[0]?.id || '', cost_center_id: '',
                password: '', confirm_password: '', role_name: roles[0]?.name || ''
            });
        }
    }, [userToEdit, isOpen, roles, companies, regionals, positions]);

    useEffect(() => {
        const regId = parseInt(formData.regional_id);
        setFilteredCostCenters(costCenters.filter(cc => cc.regional_id === regId));
    }, [formData.regional_id, costCenters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirm_password) return setError("Contraseñas no coinciden");
        
        setLoading(true);
        try {
            const res = isEditing 
                ? await apiClient.put(`/users/${userToEdit.id}`, formData)
                : await apiClient.post('/users', formData);
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
                <h3 className="text-2xl font-bold mb-4 border-b pb-2" style={{ color: PRIMARY_COLOR }}>
                    {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
                {error && <div className={ERROR_CLASS_MODAL + " mb-4"}>{error}</div>}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name_user" placeholder="Nombre" value={formData.name_user} onChange={handleChange} className="p-2 border rounded" required />
                    <input type="text" name="last_name_user" placeholder="Apellido" value={formData.last_name_user} onChange={handleChange} className="p-2 border rounded" required />
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="p-2 border rounded" required />
                    <input type="text" name="number_document" placeholder="Documento" value={formData.number_document} onChange={handleChange} className="p-2 border rounded" required />
                    <select name="company_id" value={formData.company_id} onChange={handleChange} className="p-2 border rounded" required>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name_company || c.name}</option>)}
                    </select>
                    <select name="regional_id" value={formData.regional_id} onChange={handleChange} className="p-2 border rounded" required>
                        {regionals.map(r => <option key={r.id} value={r.id}>{r.name_regional || r.name}</option>)}
                    </select>
                    <select name="cost_center_id" value={formData.cost_center_id} onChange={handleChange} className="p-2 border rounded">
                        <option value="">Sin Centro de Costo</option>
                        {filteredCostCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.cost_center_name || cc.name}</option>)}
                    </select>
                    <select name="position_id" value={formData.position_id} onChange={handleChange} className="p-2 border rounded" required>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.name_position || p.name}</option>)}
                    </select>
                    <select name="role_name" value={formData.role_name} onChange={handleChange} className="p-2 border rounded" required>
                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} className="p-2 border rounded" required={!isEditing} />
                    <input type="password" name="confirm_password" placeholder="Confirmar Contraseña" onChange={handleChange} className="p-2 border rounded" required={!isEditing} />
                    <button type="submit" disabled={loading} className="md:col-span-2 py-3 text-white rounded font-bold transition" style={{ backgroundColor: PRIMARY_COLOR }}>
                        {loading ? 'Guardando...' : 'Guardar Usuario'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ===============================================
// 2. MODAL DE DETALLES (INSTANTÁNEO)
// ===============================================
const UserDetailsModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    const dataSections = [
        {
            title: "Datos Personales",
            items: [
                { label: "Nombre", value: `${user.name_user} ${user.last_name_user}` },
                { label: "Email", value: user.email },
                { label: "Documento", value: user.number_document },
            ]
        },
        {
            title: "Estructura",
            items: [
                { label: "Empresa", value: user.company?.name_company || 'N/A' },
                { label: "Regional", value: user.regional?.name_regional || 'N/A' },
                { label: "Centro de Costo", value: user.cost_center?.cost_center_name || 'No asignado' },
                { label: "Cargo", value: user.position?.name_position || 'N/A' },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
                <h3 className="text-2xl font-bold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
                    <InformationCircleIcon className="w-6 h-6 mr-2" /> Detalle
                </h3>
                <div className="space-y-4">
                    {dataSections.map((s, i) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg border">
                            <h4 className="font-bold text-xs uppercase text-gray-400 mb-2">{s.title}</h4>
                            {s.items.map((item, j) => (
                                <div key={j} className="mb-1">
                                    <span className="text-xs text-gray-500 block">{item.label}</span>
                                    <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <span className="text-xs text-indigo-400 block uppercase font-bold">Rol Asignado</span>
                        <span className="text-sm font-bold text-indigo-700">{user.roles?.[0]?.name || 'Sin rol'}</span>
                    </div>
                </div>
                <button onClick={onClose} className="w-full mt-6 py-2 text-white rounded font-bold" style={{ backgroundColor: PRIMARY_COLOR }}>Cerrar</button>
            </div>
        </div>
    );
};

// ===============================================
// 3. COMPONENTE PRINCIPAL
// ===============================================
export default function Users() {
    const { apiClient, logOut } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [filters, setFilters] = useState({ search: '', company_id: '', cost_center_id: '', position_id: '' });
    const [selectOptions, setSelectOptions] = useState({ roles: [], companies: [], regionals: [], positions: [], costCenters: [] });
    const [optionsLoading, setOptionsLoading] = useState(false);

    const fetchOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const [c, r, p, ro, cc] = await Promise.all([
                apiClient.get('/companies'), apiClient.get('/regionals'),
                apiClient.get('/positions'), apiClient.get('/roles'), apiClient.get('/cost-centers')
            ]);
            setSelectOptions({
                companies: c.data.data || c.data, regionals: r.data.data || r.data,
                positions: p.data.data || p.data, roles: ro.data.data || ro.data,
                costCenters: cc.data.data || cc.data
            });
        } catch (e) { console.error(e); }
        finally { setOptionsLoading(false); }
    }, [apiClient]);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, per_page: 10, ...filters });
            const res = await apiClient.get(`/users?${params.toString()}`);
            setUsers(res.data.data);
            setPagination({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e) {
            if (e.response?.status === 401) logOut();
            setError("Error al cargar usuarios");
        } finally { setLoading(false); }
    }, [apiClient, filters, logOut]);

    useEffect(() => { fetchUsers(); fetchOptions(); }, [fetchUsers, fetchOptions]);

    // OPTIMIZACIÓN CLAVE: Ver detalles es instantáneo porque ya tenemos la data
    const handleViewDetails = (user) => setViewingUser(user);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar usuario?")) return;
        try {
            await apiClient.delete(`/users/${id}`);
            fetchUsers(pagination.current_page);
        } catch (e) { alert("Error al eliminar"); }
    };

    return (
        <AuthenticatedLayout title="Usuarios">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>Gestión de Personal</h2>
                    <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex items-center px-4 py-2 text-white rounded-lg shadow" style={{ backgroundColor: PRIMARY_COLOR }}>
                        <PlusIcon className="w-5 h-5 mr-1" /> Nuevo
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Buscar..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="p-2 border rounded" />
                    <select value={filters.company_id} onChange={e => setFilters({...filters, company_id: e.target.value})} className="p-2 border rounded">
                        <option value="">Todas las Empresas</option>
                        {selectOptions.companies.map(c => <option key={c.id} value={c.id}>{c.name_company || c.name}</option>)}
                    </select>
                    <button onClick={() => fetchUsers(1)} className="text-white rounded py-2 font-bold" style={{ backgroundColor: PRIMARY_COLOR }}>Filtrar</button>
                    <button onClick={() => { setFilters({search:'', company_id:'', cost_center_id:'', position_id:''}); fetchUsers(1); }} className="bg-gray-100 text-gray-600 rounded py-2">Limpiar</button>
                </div>

                {loading ? <div className="text-center p-10">Cargando...</div> : (
                    <div className="bg-white rounded-xl shadow overflow-hidden border">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase" style={{ color: PRIMARY_COLOR }}>Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase" style={{ color: PRIMARY_COLOR }}>Cargo</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase" style={{ color: PRIMARY_COLOR }}>Rol</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase" style={{ color: PRIMARY_COLOR }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{u.name_user} {u.last_name_user}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{u.position?.name_position || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                                                {u.roles?.[0]?.name || 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleViewDetails(u)} className="text-indigo-600 font-bold text-xs hover:underline">VER MÁS</button>
                                            <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-600 inline-block"><PencilIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-600 inline-block"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Paginación simple */}
                        <div className="p-4 bg-gray-50 border-t flex justify-between items-center text-xs">
                            <span>Total: {pagination?.total} usuarios</span>
                            <div className="space-x-2">
                                <button disabled={pagination?.current_page === 1} onClick={() => fetchUsers(pagination.current_page - 1)} className="p-1 border rounded disabled:opacity-50">Ant.</button>
                                <span className="font-bold">Página {pagination?.current_page}</span>
                                <button disabled={pagination?.current_page === pagination?.last_page} onClick={() => fetchUsers(pagination.current_page + 1)} className="p-1 border rounded disabled:opacity-50">Sig.</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={editingUser} onSave={() => fetchUsers(pagination?.current_page || 1)} selectOptions={selectOptions} isLoadingOptions={optionsLoading} />
            <UserDetailsModal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} user={viewingUser} />
        </AuthenticatedLayout>
    );
}