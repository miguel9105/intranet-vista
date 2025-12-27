import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
    FilePieChart, Loader2, LayoutDashboard, RefreshCw, TrendingUp
} from 'lucide-react';

// --- CONFIGURACIÓN ---
const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#94a3b8'];

const formatCurrency = (val) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

const formatNumber = (val) => 
    new Intl.NumberFormat('es-CO').format(val);

// Tooltip Personalizado Estético
const CustomTooltip = ({ active, payload, label, isCurrency = false }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 p-4 rounded-xl border border-slate-700 text-white shadow-2xl backdrop-blur-sm">
                <p className="font-bold mb-2 border-b border-slate-700 pb-1 text-[10px] uppercase tracking-widest text-indigo-400">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex justify-between gap-6 text-[11px] mb-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-slate-300">{entry.name}:</span>
                        </div>
                        <span className="font-mono font-bold">
                            {isCurrency ? formatCurrency(entry.value) : formatNumber(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Documents() {
    const { apiClient } = useAuth(); 
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [reportData, setReportData] = useState(null);

    // --- TRANSFORMADORES DE DATOS ---
    
    // 1. Regional y Cobro (Apilados)
    const getStackedData = (raw, mainKey, subKey) => {
        if (!Array.isArray(raw)) return { data: [], segments: [] };
        const map = {};
        const segments = new Set();

        raw.forEach(item => {
            const group = item[mainKey] || 'OTRO';
            const sub = item[subKey] || 'N/A';
            const val = parseFloat(item.len) || 0;

            if (!map[group]) map[group] = { name: group };
            map[group][sub] = (map[group][sub] || 0) + val;
            segments.add(sub);
        });

        return { 
            data: Object.values(map), 
            segments: Array.from(segments) 
        };
    };

    // 2. Desembolso (Líneas/Área por Año)
    const getLineData = (raw) => {
        if (!Array.isArray(raw)) return [];
        const map = {};
        raw.forEach(item => {
            const year = item.Año_Desembolso;
            const val = parseFloat(item.Valor_Desembolso) || 0;
            map[year] = (map[year] || 0) + val;
        });
        return Object.entries(map)
            .map(([year, valor]) => ({ year, valor }))
            .sort((a, b) => a.year - b.year);
    };

    // 3. Vigencia (Pastel)
    const getPieData = (raw) => {
        if (!Array.isArray(raw)) return [];
        const map = {};
        raw.forEach(item => {
            const status = item.Estado_Padre || 'S/N';
            map[status] = (map[status] || 0) + (parseFloat(item.len) || 0);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    };

    // --- ACCIONES ---

    const fetchAnalytics = async (key) => {
        setLoading(true);
        try {
            // Se envía el file_key como parámetro de consulta según requiere WalletController
            const response = await apiClient.get(`/wallet/dashboard-principal`, { params: { file_key: key } });
            console.log("Datos recibidos:", response.data);
            setReportData(response.data?.data || response.data);
        } catch (e) {
            console.error("Error al obtener dashboard:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file); // El nombre 'file' coincide con la validación en Laravel

        setUploading(true);
        try {
            // El endpoint coincide con api.php
            const res = await apiClient.post('/reportes/cargar-general', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const data = res.data?.data || res.data;
            // Si el servicio devuelve archivos_generados, tomamos el primer key
            if (data.archivos_generados) {
                const keys = Object.values(data.archivos_generados);
                if (keys.length > 0) fetchAnalytics(keys[0]);
            }
        } catch (e) {
            alert("Error al procesar el archivo. Verifique el formato.");
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    return (
        <AuthenticatedLayout title="Monitor Estratégico">
            <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <header className="bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                                <LayoutDashboard className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Análisis de Cartera</h1>
                                <p className="text-xs text-slate-400 font-medium italic">Gestión operativa de ventas y cobros</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => document.getElementById('file-up').click()}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg text-sm"
                                disabled={uploading || loading}
                            >
                                <RefreshCw size={16} className={uploading ? "animate-spin" : ""} />
                                {uploading ? 'PROCESANDO...' : 'ACTUALIZAR DATOS'}
                            </button>
                            <input id="file-up" type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx,.xls" />
                        </div>
                    </header>

                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Generando métricas...</p>
                        </div>
                    ) : reportData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* REGIONAL (Stacked Bar) */}
                            <ChartCard title="Regional de Venta" desc="Distribución por Regional y Franja Meta">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={getStackedData(reportData.regional, 'Regional_Venta', 'Franja_Meta').data} margin={{ bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" wrapperStyle={{paddingTop: 20}} />
                                        {getStackedData(reportData.regional, 'Regional_Venta', 'Franja_Meta').segments.map((s, i) => (
                                            <Bar key={s} dataKey={s} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === 0 ? [0,0,0,0] : [4,4,0,0]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* COBRO (Stacked Bar) */}
                            <ChartCard title="Gestión de Cobro" desc="Eje de Cobro por Franja Meta">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={getStackedData(reportData.cobro, 'Eje_X_Cobro', 'Franja_Meta').data} margin={{ bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" wrapperStyle={{paddingTop: 20}} />
                                        {getStackedData(reportData.cobro, 'Eje_X_Cobro', 'Franja_Meta').segments.map((s, i) => (
                                            <Bar key={s} dataKey={s} stackId="a" fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* DESEMBOLSO (Area/Line) */}
                            <ChartCard title="Valor Desembolsado" desc="Evolución histórica por año (COP)">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={getLineData(reportData.desembolso)}>
                                        <defs>
                                            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="year" tick={{fontSize: 12, fontWeight: 800, fill: '#475569'}} axisLine={false} />
                                        <YAxis tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} />
                                        <Tooltip content={<CustomTooltip isCurrency={true} />} />
                                        <Area type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={4} fill="url(#colorArea)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* VIGENCIA (Pie) */}
                            <ChartCard title="Estado de Vigencia" desc="Composición de cartera vigentes vs otros">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={getPieData(reportData.vigencia)}
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {getPieData(reportData.vigencia).map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>

                        </div>
                    ) : (
                        <div className="h-96 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm">
                            <div className="bg-slate-100 p-6 rounded-full mb-4">
                                <FilePieChart size={48} className="text-slate-300" />
                            </div>
                            <h3 className="font-black uppercase tracking-[0.2em] text-sm text-slate-500">Sin datos disponibles</h3>
                            <p className="text-xs mt-2 font-medium">Por favor, cargue un archivo Excel para iniciar el análisis</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

const ChartCard = ({ title, desc, children }) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h3 className="text-lg font-black text-slate-800 uppercase leading-none tracking-tight">{title}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.15em] mt-2 italic">{desc}</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors duration-500">
                <TrendingUp size={18} className="text-indigo-600 group-hover:text-white" />
            </div>
        </div>
        <div className="h-[350px] w-full">
            {children}
        </div>
    </div>
);