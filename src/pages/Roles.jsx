import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext'; 

export default function Roles() {
    const { apiClient } = useAuth();
    
    // --- Estado para Roles ---
    const [roles, setRoles] = useState([]); // Lista de roles existentes
    const [roleName, setRoleName] = useState('');
    const [roleMessage, setRoleMessage] = useState('');
    const [roleError, setRoleError] = useState('');
    const [roleLoading, setRoleLoading] = useState(false);
    
    // --- Estado para Permisos ---
    const [availablePermissions, setAvailablePermissions] = useState([]); // Lista maestra de permisos
    const [selectedPermissions, setSelectedPermissions] = useState([]); // Permisos seleccionados para el nuevo rol
    const [permissionName, setPermissionName] = useState('');
    const [permissionMessage, setPermissionMessage] = useState('');
    const [permissionError, setPermissionError] = useState('');
    const [permissionLoading, setPermissionLoading] = useState(false);

    // --- Funciones de Carga de Datos ---

    /**
     * Carga todos los roles existentes con sus permisos.
     * Endpoint: GET /api/roles
     */
    const fetchRoles = async () => {
        try {
            const response = await apiClient.get('/roles'); // El controlador ya hace with('permissions')
            setRoles(response.data);
        } catch (error) {
            console.error('Error al cargar roles:', error);
            // Manejo de error de carga inicial si es necesario
        }
    };
    
    /**
     * Carga todos los permisos disponibles.
     * Endpoint: GET /api/permissions
     */
    const fetchPermissions = async () => {
        try {
            const response = await apiClient.get('/permissions');
            // Los permisos vienen como un array de objetos con { id, name, ...}
            setAvailablePermissions(response.data);
        } catch (error) {
            console.error('Error al cargar permisos:', error);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);


    // --- Funciones de Creación ---

    /**
     * Función para crear un nuevo Rol y asignar permisos.
     * Endpoint: POST /api/roles
     */
    const createRole = async (e) => {
        e.preventDefault();
        setRoleMessage('');
        setRoleError('');
        
        if (!roleName) {
            setRoleError("El nombre del Rol es obligatorio.");
            return;
        }

        setRoleLoading(true);

        // 1. Convertir los IDs de permisos seleccionados a una lista de NOMBRES
        // El controlador espera los permisos por su nombre (string|exists:permissions,name)
        const permissionsToSend = availablePermissions
            .filter(p => selectedPermissions.includes(p.id))
            .map(p => p.name);

        try {
            // **CONSUMO DEL ENDPOINT**
            const response = await apiClient.post('/roles', { 
                name: roleName,
                permissions: permissionsToSend // Envía la lista de nombres
            });
            
            setRoleMessage(`Rol "${response.data.name}" creado exitosamente y permisos asignados.`);
            setRoleName(''); // Limpiar el campo
            setSelectedPermissions([]); // Limpiar selección de permisos

            fetchRoles(); // Recargar la lista de roles para mostrar el nuevo

        } catch (error) {
            console.error('Error al crear el Rol:', error);
            
            let errorMsg = "Hubo un error al crear el Rol. Verifique la conexión.";
            if (error.response) {
                if (error.response.status === 422) {
                    errorMsg = error.response.data.errors?.name?.[0] || "El nombre del Rol ya existe o es inválido.";
                } else if (error.response.status === 403) {
                    errorMsg = "Acceso denegado. No tienes el rol 'Administrador' requerido.";
                } else {
                    errorMsg = error.response.data.message || errorMsg;
                }
            }
            setRoleError(errorMsg);
            
        } finally {
            setRoleLoading(false);
        }
    };

    /**
     * Función para crear un nuevo Permiso.
     * Endpoint: POST /api/permissions
     */
    const createPermission = async (e) => {
        e.preventDefault();
        setPermissionMessage('');
        setPermissionError('');
        
        if (!permissionName) {
            setPermissionError("El nombre del Permiso es obligatorio.");
            return;
        }

        setPermissionLoading(true);

        try {
            // **CONSUMO DEL ENDPOINT**
            const response = await apiClient.post('/permissions', { name: permissionName });
            
            setPermissionMessage(`Permiso "${response.data.name}" creado exitosamente.`);
            setPermissionName(''); // Limpiar el campo
            
            fetchPermissions(); // Recargar la lista de permisos disponibles

        } catch (error) {
            console.error('Error al crear el Permiso:', error);

            let errorMsg = "Hubo un error al crear el Permiso. Verifique la conexión.";
            
            if (error.response) {
                 if (error.response.status === 422) {
                    errorMsg = error.response.data.errors?.name?.[0] || "El nombre del Permiso ya existe o es inválido.";
                } else if (error.response.status === 403) {
                    errorMsg = "Acceso denegado. No tienes el rol 'Administrador' requerido.";
                } else {
                    errorMsg = error.response.data.message || errorMsg;
                }
            }
            setPermissionError(errorMsg);
            
        } finally {
            setPermissionLoading(false);
        }
    };

    // Función para manejar la selección de checkboxes
    const handlePermissionSelection = (permissionId) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId) // Deseleccionar
                : [...prev, permissionId] // Seleccionar
        );
    };


    return (
        <AuthenticatedLayout title="Roles y Permisos">
            <div className="p-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- COLUMNA 1: CREAR ROL Y ASIGNAR PERMISOS --- */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                        <h3 className="text-2xl font-bold text-indigo-700 mb-6">
                            ➕ Crear Nuevo Rol y Asignar Permisos
                        </h3>
                        <form onSubmit={createRole} className="space-y-6">
                            <div>
                                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Rol
                                </label>
                                <input
                                    type="text"
                                    id="roleName"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Ej: Gestor de Contenido, Auditor"
                                    disabled={roleLoading}
                                    required
                                />
                            </div>
                            
                            {/* Selector de Permisos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Permisos a Asignar
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-md bg-gray-50">
                                    {availablePermissions.length > 0 ? (
                                        availablePermissions.map((permission) => (
                                            <label key={permission.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white p-1 rounded transition">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(permission.id)}
                                                    onChange={() => handlePermissionSelection(permission.id)}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-gray-600 truncate">{permission.name}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="col-span-4 text-center text-gray-500 text-sm">Cargando permisos o no hay permisos creados...</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Mensajes de feedback */}
                            {roleMessage && (
                                <p className="p-3 bg-green-100 text-sm text-green-700 font-medium rounded-lg border border-green-300">✅ {roleMessage}</p>
                            )}
                            
                            {roleError && (
                                <p className="p-3 bg-red-100 text-sm text-red-700 font-medium rounded-lg border border-red-300">❌ {roleError}</p>
                            )}
                            
                            <button
                                type="submit"
                                disabled={roleLoading}
                                className={`w-full lg:w-auto inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-white ${roleLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150`}
                            >
                                {roleLoading ? 'Creando Rol...' : 'Crear Rol y Asignar Permisos'}
                            </button>
                        </form>
                    </div>

                    {/* --- COLUMNA 2: CREAR PERMISO --- */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow border-l-4 border-green-500 h-full">
                        <h3 className="text-2xl font-bold text-green-700 mb-6">
                            🔑 Crear Nuevo Permiso
                        </h3>
                        <form onSubmit={createPermission} className="space-y-4">
                            <div>
                                <label htmlFor="permissionName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Permiso
                                </label>
                                <input
                                    type="text"
                                    id="permissionName"
                                    value={permissionName}
                                    onChange={(e) => setPermissionName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Ej: users-create, inventory-view"
                                    disabled={permissionLoading}
                                    required
                                />
                            </div>
                            
                            {/* Mensajes de feedback */}
                            {permissionMessage && (
                                <p className="p-2 bg-green-100 text-sm text-green-700 font-medium rounded">✅ {permissionMessage}</p>
                            )}
                            
                            {permissionError && (
                                <p className="p-2 bg-red-100 text-sm text-red-700 font-medium rounded">❌ {permissionError}</p>
                            )}
                            
                            <button
                                type="submit"
                                disabled={permissionLoading}
                                className={`w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white ${permissionLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150`}
                            >
                                {permissionLoading ? 'Creando Permiso...' : 'Crear Permiso'}
                            </button>
                        </form>
                    </div>
                </div>
                
                <hr className="my-10 border-gray-300" />
                
                {/* --- SECCIÓN LISTADO DE ROLES --- */}
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                        📋 Roles Existentes ({roles.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.length > 0 ? (
                            roles.map((role) => (
                                <div key={role.id} className="p-4 border rounded-xl bg-gray-50 hover:shadow-md transition duration-200">
                                    <p className="text-xl font-bold text-indigo-700 mb-2">{role.name}</p>
                                    <p className="text-sm font-medium text-gray-500 mb-3">Guard: {role.guard_name}</p>
                                    
                                    <div className="mt-2 border-t pt-3">
                                        <span className="text-sm font-semibold text-gray-700 block mb-2">Permisos ({role.permissions.length}):</span>
                                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                                            {role.permissions.length > 0 ? (
                                                role.permissions.map((p) => (
                                                    <span key={p.id} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                        {p.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400">Este rol no tiene permisos asignados.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-3 text-center text-gray-500 text-lg p-10 bg-gray-50 rounded-lg">
                                No hay roles creados. ¡Empieza a crear uno!
                            </p>
                        )}
                    </div>
                </div>
                
            </div>
        </AuthenticatedLayout>
    );
}