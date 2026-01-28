import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    ChartCard, InteractiveSunburst, DonutWithTotal, StackedBar, BackBtn, 
    LocalFilterSection, TableToolbar, TableView 
} from './DashboardComponents';

// Definición de columnas específica para Seguimientos
const ALL_COLUMNS_GESTION = [
    { key: 'Credito', label: 'Crédito' },
    { key: 'Cedula_Cliente', label: 'Cédula' },
    { key: 'Nombre_Cliente', label: 'Cliente' },
    { key: 'Celular', label: 'Celular' },
    { key: 'Nombre_Ciudad', label: 'Ciudad' },
    { key: 'Zona', label: 'Zona' },
    { key: 'Regional_Cobro', label: 'Regional' },
    { key: 'Estado_Gestion', label: 'Gestión' },
    { key: 'Estado_Pago', label: 'Estado Pago' },
    { key: 'Dias_Atraso_Final', label: 'Días Atraso' },
    { key: 'Valor_Vencido', label: 'Valor Vencido' },
    { key: 'Total_Recaudo', label: 'Total Recaudo' },
    { key: 'Cargo_Usuario', label: 'Cargo Usuario' },
    { key: 'Nombre_Usuario', label: 'Gestor' },
    { key: 'Novedad', label: 'Última Novedad' },
    { key: 'Tipo_Novedad', label: 'Tipo Novedad' },
    { key: 'Fecha_Cuota_Vigente', label: 'Fecha Cuota' },
    { key: 'Valor_Cuota_Vigente', label: 'Valor Cuota' },
    { key: 'Codeudor1', label: 'Doc. Codeudor 1' },
    { key: 'Nombre_Codeudor1', label: 'Nom. Codeudor 1' },
    { key: 'Telefono_Codeudor1', label: 'Tel. Codeudor 1' }
];

const ALL_COLUMNS_RODAMIENTO = [
    { key: 'Credito', label: 'Crédito' },
    { key: 'Cedula_Cliente', label: 'Cédula' },
    { key: 'Nombre_Cliente', label: 'Cliente' },
    { key: 'Celular', label: 'Celular' },
    { key: 'Rodamiento', label: 'Rodamiento' },
    { key: 'Rodamiento_Cartera', label: 'Rod. Cartera' },
    { key: 'Franja_Cartera', label: 'Franja' },
    { key: 'Valor_Vencido', label: 'Valor Vencido' },
    { key: 'Meta_Saldo', label: 'Meta Saldo' },
    { key: 'Meta_Intereses', label: 'Meta Intereses' },
    { key: 'Dias_Atraso_Final', label: 'Días Atraso' },
    { key: 'Total_Recaudo', label: 'Total Recaudo' },
    { key: 'Nombre_Ciudad', label: 'Ciudad' },
    { key: 'Zona', label: 'Zona' },
    { key: 'Regional_Cobro', label: 'Regional' },
    { key: 'Codeudor1', label: 'Doc. Codeudor 1' },
    { key: 'Nombre_Codeudor1', label: 'Nom. Codeudor 1' }
];

export default function Seguimientos({ data, selectedFilters, apiClient, jobId }) {
    // Estados Sunburst
    const [selGestion, setSelGestion] = useState(null);
    const [selConPago, setSelConPago] = useState(null);
    const [selSinPago, setSelSinPago] = useState(null);

    // Filtros Locales
    const [localFiltersGestion, setLocalFiltersGestion] = useState({ estado_pago: [], estado_gestion: [], cargos: [] });
    const [localFiltersRodamiento, setLocalFiltersRodamiento] = useState({ rodamiento: [] });
    const [showLocalFiltersGestion, setShowLocalFiltersGestion] = useState(true);
    const [showLocalFiltersRodamiento, setShowLocalFiltersRodamiento] = useState(true);

    // Tablas
    const [gestionTable, setGestionTable] = useState({ data: [], loading: false, search: '', pagination: { current: 1, total_pages: 0, total_records: 0 } });
    const [rodamientoTable, setRodamientoTable] = useState({ data: [], loading: false, search: '', pagination: { current: 1, total_pages: 0, total_records: 0 } });
    const [visibleColsGestion, setVisibleColsGestion] = useState(['Cedula_Cliente', 'Nombre_Cliente', 'Estado_Gestion', 'Estado_Pago', 'Regional_Cobro', 'Novedad']);
    const [visibleColsRodamiento, setVisibleColsRodamiento] = useState(['Credito', 'Cedula_Cliente', 'Rodamiento', 'Franja_Cartera', 'Valor_Vencido']);

    // Helpers lógicos
    const applyFilters = (dataSet) => {
        if (!Array.isArray(dataSet)) return [];
        return dataSet.filter(item => 
            Object.entries(selectedFilters).every(([key, values]) => {
                if (!values || !Array.isArray(values) || values.length === 0) return true;
                return values.includes(item[key]);
            })
        );
    };

    const processGeneric = (list, xKey, stackKey, valKey) => {
        const filtered = applyFilters(Array.isArray(list) ? list : (list?.grouped || []));
        const map = {}; const keysSet = new Set();
        filtered.forEach(d => {
            const xVal = d[xKey] || 'N/A';
            const sKey = String(d[stackKey] || 'OTROS').toUpperCase();
            const val = Number(d[valKey] || d['count'] || 1);
            if (!map[xVal]) map[xVal] = { name: xVal };
            map[xVal][sKey] = (map[xVal][sKey] || 0) + val;
            keysSet.add(sKey);
        });
        return { data: Object.values(map).sort((a,b) => String(a.name).localeCompare(String(b.name))), keys: Array.from(keysSet) };
    };

    const buildDrilldown = (list, mainKey, subKey, valKey) => {
        const filtered = applyFilters(Array.isArray(list) ? list : (list?.grouped || []));
        const grouped = filtered.reduce((acc, item) => {
            const main = String(item[mainKey] || 'SIN DATO').toUpperCase();
            const sub = String(item[subKey] || 'OTROS').toUpperCase();
            const val = Number(item[valKey] || item['count'] || 1);
            if (!acc[main]) acc[main] = { name: main, value: 0, children: {} };
            acc[main].value += val;
            acc[main].children[sub] = (acc[main].children[sub] || 0) + val;
            return acc;
        }, {});
        return Object.values(grouped).map(m => ({
            name: m.name, value: m.value,
            children: Object.entries(m.children).map(([name, val]) => ({ name, value: val }))
        }));
    };

    const toggleColumn = (key, setter, current) => {
        setter(current.includes(key) ? current.filter(k => k !== key) : [...current, key]);
    };

    // Opciones para filtros locales
    const localOptions = useMemo(() => {
        if (!data) return { estado_pago: [], estado_gestion: [], cargos: [], rodamiento: [] };
        const getUniques = (arr, key) => [...new Set(arr.map(x => x[key]).filter(Boolean))].sort();
        return { 
            estado_pago: getUniques(data.donut_data || [], 'Estado_Pago'),
            estado_gestion: getUniques(data.sunburst_grouped || [], 'Estado_Gestion'),
            cargos: getUniques(data.sunburst_grouped || [], 'Cargo_Usuario'),
            rodamiento: getUniques(data.rodamiento_data || [], 'Rodamiento')
        };
    }, [data]);

    // Data Fetching Tablas
    const fetchTableData = useCallback(async (source, page = 1, search = '', filters = {}, setter) => {
        if (!jobId) return;
        setter(prev => ({ ...prev, loading: true, search }));
        try {
            const payload = { job_id: jobId, origen: source, page, page_size: 15, search_term: search, ...filters };
            const response = await apiClient.post('/wallet/buscar', payload);
            setter(prev => ({ 
                ...prev, 
                data: response.data.data || [], 
                loading: false, 
                pagination: { current: response.data.meta?.page || page, total_pages: response.data.meta?.pages || 0, total_records: response.data.meta?.total || 0 } 
            }));
        } catch (error) { setter(prev => ({ ...prev, loading: false })); }
    }, [jobId, apiClient]);

    // Efectos de carga inicial al montar el componente (Click en tab)
    useEffect(() => {
        if(jobId) {
            fetchTableData('seguimientos_gestion', 1, gestionTable.search, localFiltersGestion, setGestionTable);
        }
    }, [localFiltersGestion, jobId]); // Eliminamos fetchTableData de dependencias para evitar loops si no es memoizado correctamente arriba, pero usando useCallback está bien.

    useEffect(() => {
        if(jobId) {
            fetchTableData('seguimientos_rodamientos', 1, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable);
        }
    }, [localFiltersRodamiento, jobId]);

    // Procesamiento de Gráficas
    const charts = useMemo(() => {
        if (!data) return null;
        const filteredDonut = applyFilters(data.donut_data || []);
        const recaudoMap = filteredDonut.reduce((acc, curr) => {
            const key = curr.Estado_Pago || 'SIN DATO';
            acc[key] = (acc[key] || 0) + (curr.count || 0);
            return acc;
        }, {});

        return {
            recaudo: Object.entries(recaudoMap).map(([name, value]) => ({ name, value })),
            gestion: buildDrilldown(data.sunburst_grouped, 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            conPago: buildDrilldown((data.detalle_pago?.grouped || []).filter(d => d.Estado_Pago !== 'SIN PAGO'), 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            sinPago: buildDrilldown(data.detalle_sin_pago?.grouped || [], 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            rodamiento: processGeneric(data.rodamiento_data, 'Franja_Cartera', 'Rodamiento', 'Número de Cuentas')
        };
    }, [data, selectedFilters]);

    if (!charts) return null;

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <ChartCard title="Recaudo"><DonutWithTotal data={charts.recaudo} total={charts.recaudo?.reduce((a,b)=>a+b.value,0)} /></ChartCard>
                <ChartCard title={selGestion ? `Detalle: ${selGestion.name}` : "Gestión"} action={selGestion && <BackBtn onClick={() => setSelGestion(null)} />}><InteractiveSunburst data={charts.gestion} activeSelection={selGestion} onSelect={setSelGestion} /></ChartCard>
                <ChartCard title={selConPago ? `Detalle Pago: ${selConPago.name}` : "Gestión con Pago"} action={selConPago && <BackBtn onClick={() => setSelConPago(null)} />}><InteractiveSunburst data={charts.conPago} activeSelection={selConPago} onSelect={setSelConPago} /></ChartCard>
                <ChartCard title={selSinPago ? `Detalle Sin Pago: ${selSinPago.name}` : "Gestión sin Pago"} action={selSinPago && <BackBtn onClick={() => setSelSinPago(null)} />}><InteractiveSunburst data={charts.sinPago} activeSelection={selSinPago} onSelect={setSelSinPago} /></ChartCard>
                <div className="xl:col-span-2"><ChartCard title="Rodamiento de Cartera"><StackedBar data={charts.rodamiento.data} keys={charts.rodamiento.keys} /></ChartCard></div>
            </div>

            {/* TABLAS */}
            <div className="space-y-6">
                <LocalFilterSection title="Filtros Localizados Gestión" isOpen={showLocalFiltersGestion} onToggle={() => setShowLocalFiltersGestion(!showLocalFiltersGestion)} filters={localFiltersGestion} onFilterChange={(k, v) => setLocalFiltersGestion(prev => ({...prev, [k]: v}))} configs={[{ key: 'estado_pago', label: 'Pago', options: localOptions.estado_pago },{ key: 'estado_gestion', label: 'Gestión', options: localOptions.estado_gestion },{ key: 'cargos', label: 'Cargos', options: localOptions.cargos }]} />
                <TableToolbar onSearch={(v) => fetchTableData('seguimientos_gestion', 1, v, localFiltersGestion, setGestionTable)} searchValue={gestionTable.search} allColumns={ALL_COLUMNS_GESTION} visibleColumns={visibleColsGestion} onToggleColumn={(key) => toggleColumn(key, setVisibleColsGestion, visibleColsGestion)} />
                <TableView title="Tabla de Gestión" data={gestionTable.data} columns={ALL_COLUMNS_GESTION.filter(c => visibleColsGestion.includes(c.key))} loading={gestionTable.loading} pagination={gestionTable.pagination} onPageChange={(p) => fetchTableData('seguimientos_gestion', p, gestionTable.search, localFiltersGestion, setGestionTable)} />
                
                <LocalFilterSection title="Filtros Localizados Rodamientos" isOpen={showLocalFiltersRodamiento} onToggle={() => setShowLocalFiltersRodamiento(!showLocalFiltersRodamiento)} filters={localFiltersRodamiento} onFilterChange={(k, v) => setLocalFiltersRodamiento(prev => ({...prev, [k]: v}))} configs={[{ key: 'rodamiento', label: 'Rodamiento', options: localOptions.rodamiento }]} />
                <TableToolbar onSearch={(v) => fetchTableData('seguimientos_rodamientos', 1, v, localFiltersRodamiento, setRodamientoTable)} searchValue={rodamientoTable.search} allColumns={ALL_COLUMNS_RODAMIENTO} visibleColumns={visibleColsRodamiento} onToggleColumn={(key) => toggleColumn(key, setVisibleColsRodamiento, visibleColsRodamiento)} />
                <TableView title="Tabla de Rodamientos" data={rodamientoTable.data} columns={ALL_COLUMNS_RODAMIENTO.filter(c => visibleColsRodamiento.includes(c.key))} loading={rodamientoTable.loading} pagination={rodamientoTable.pagination} onPageChange={(p) => fetchTableData('seguimientos_rodamientos', p, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable)} />
            </div>
        </div>
    );
}