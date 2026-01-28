// src/components/PermissionGuard.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PermissionGuard = ({ children, permission }) => {
    const { user, loading } = useAuth();

    // Mientras se verifica el token, no renderizamos nada para evitar saltos
    if (loading) return null;

    // 1. Verificar si es Super_usuario (tal cual está en tu RolesAndPermissionsSeeder.php)
    const isAdmin = user?.roles?.some(role => 
        (typeof role === 'string' ? role : role.name).toUpperCase() === 'SUPER_USUARIO'
    );

    // 2. Verificar si el array de permisos contiene el permiso solicitado
    // Aseguramos que tratamos con strings simples
    const hasPermission = user?.permissions?.some(p => 
        (typeof p === 'string' ? p : p.name) === permission
    );

    // Si no es admin y no tiene el permiso, redirigir
    if (!isAdmin && !hasPermission) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};