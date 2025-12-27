import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { 
    HomeIcon, UsersIcon, ClipboardIcon, 
    LifebuoyIcon, ArrowLeftEndOnRectangleIcon, 
    Cog6ToothIcon, UserCircleIcon, 
    ChevronDownIcon, ChevronRightIcon, 
    PencilSquareIcon 
} from '@heroicons/react/24/outline';

const DARK_COLOR = 'rgba(4, 24, 48)';

// Lógica de acceso mejorada
const canAccess = (user, permissionName) => {
    if (!user) return false;
    
    const userRoleNames = Array.isArray(user.roles) 
        ? user.roles.map(r => typeof r === 'string' ? r : r.name)
        : [];
        
    // 1. Pase Maestro
    if (userRoleNames.includes('Administrador')) return true;

    // 2. Verificación por permisos (array de strings)
    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.includes(permissionName);
    }
    
    return false; 
};

const SubNavItem = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
        <Link 
            to={to} 
            className={`flex items-center p-2 pl-6 transition-all duration-200 text-sm rounded-lg w-full ${
                isActive ? 'font-semibold bg-gray-200' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ color: isActive ? DARK_COLOR : undefined }}
        >
            {children}
        </Link>
    );
};

const NavItem = ({ to, children, icon: Icon, isCollapsed, subItems = [] }) => {
    const location = useLocation();
    const isAccordion = subItems.length > 0;
    const initialOpen = isAccordion && subItems.some(item => location.pathname === item.to);
    const [isOpen, setIsOpen] = useState(initialOpen);

    const isActive = location.pathname === to && !isAccordion;
    const hasActiveSubItem = isAccordion && subItems.some(item => location.pathname === item.to);
    const itemIsActive = isActive || hasActiveSubItem;
    
    const handleClick = () => { if (isAccordion) setIsOpen(!isOpen); };
    
    const Component = isAccordion ? 'button' : Link;
    const navProps = isAccordion ? { onClick: handleClick } : { to };

    return (
        <div className="relative group">
            <Component 
                {...navProps}
                className={`flex items-center transition-all duration-300 rounded-lg p-3 w-full 
                            ${isCollapsed ? 'justify-center' : ''} 
                            ${itemIsActive ? 'text-white' : 'text-gray-600'} 
                            ${isAccordion ? 'font-bold' : 'font-medium'}`}
                style={{ backgroundColor: itemIsActive ? DARK_COLOR : 'transparent' }}
            >
                <Icon className="w-6 h-6 flex-shrink-0" style={{ color: itemIsActive ? 'white' : DARK_COLOR }} />
                {!isCollapsed && (
                    <span className="ml-4 text-sm flex-grow text-left" style={{ color: itemIsActive ? 'white' : DARK_COLOR }}>
                        {children}
                    </span>
                )}
                {isAccordion && !isCollapsed && (
                    isOpen ? <ChevronDownIcon className="w-4 h-4 ml-auto" /> : <ChevronRightIcon className="w-4 h-4 ml-auto" />
                )}
            </Component>

            {isAccordion && !isCollapsed && isOpen && (
                <div className="py-2 space-y-1">
                    {subItems.map((item, index) => (
                        <SubNavItem key={index} to={item.to}>{item.label}</SubNavItem>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const isCollapsed = !isHovered; 

    // Agrupación de items por permisos
    const configSubItems = [
        canAccess(user, 'view_users') && { label: 'Gestión de Usuarios', to: '/users' },
        canAccess(user, 'view_roles') && { label: 'Roles y Permisos', to: '/roles' },
        canAccess(user, 'view_companies') && { label: 'Empresas Asociadas', to: '/companies' },
        canAccess(user, 'view_positions') && { label: 'Puestos de Trabajo', to: '/positions' },
        canAccess(user, 'view_regionals') && { label: 'Regionalización', to: '/regionals' },
        canAccess(user, 'view_cost_centers') && { label: 'Centros de Costo', to: '/cost-centers' },
    ].filter(Boolean);

    const publishSubItems = [
        canAccess(user, 'view_objectives') && { label: 'Objetivos', to: '/objectives' },
        canAccess(user, 'view_events') && { label: 'Eventos', to: '/events' },
        canAccess(user, 'view_news') && { label: 'Noticias', to: '/news' },
    ].filter(Boolean);

    const operationalSubItems = [
        canAccess(user, 'view_datacredito') && { label: 'Análisis DataCrédito', to: '/analisis-datos' },
        canAccess(user, 'view_inventory') && { label: 'Inventarios', to: '/inventario' },
        canAccess(user, 'view_documents') && { label: 'Repositorio Documental', to: '/documentos' },
    ].filter(Boolean);

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed top-0 left-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-white flex flex-col p-3 shadow-2xl z-50 transition-all duration-300`}
        >
            <div className="mb-8 mt-2 pb-4 border-b border-gray-100">
                <img src="/images/logos/logo.png" alt="Logo" className="w-full h-auto object-contain" />
            </div>

            <nav className="flex-grow space-y-2 overflow-y-auto">
                {canAccess(user, 'view_dashboard') && (
                    <NavItem to="/dashboard" icon={HomeIcon} isCollapsed={isCollapsed}>Dashboard</NavItem>
                )}
                {publishSubItems.length > 0 && (
                    <NavItem to="/publicar" icon={PencilSquareIcon} isCollapsed={isCollapsed} subItems={publishSubItems}>Publicar</NavItem>
                )}
                {operationalSubItems.length > 0 && (
                    <NavItem to="/operaciones" icon={ClipboardIcon} isCollapsed={isCollapsed} subItems={operationalSubItems}>Operaciones</NavItem>
                )}
            </nav>

            <div className="mt-auto pt-4 border-t border-gray-200">
                {configSubItems.length > 0 && (
                    <NavItem to="/configuracion" icon={Cog6ToothIcon} isCollapsed={isCollapsed} subItems={configSubItems}>Configuración</NavItem>
                )}
                <button 
                    onClick={() => logout(() => navigate('/login'))}
                    className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-xl mt-2"
                >
                    <ArrowLeftEndOnRectangleIcon className="w-6 h-6" />
                    {!isCollapsed && <span className="ml-3 font-semibold">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}