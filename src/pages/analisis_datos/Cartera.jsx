import React, { useMemo, useState } from 'react';
import { ChartCard, StackedBar, InteractiveSunburst, BackBtn } from './DashboardComponents';

export default function Cartera({ data, selectedFilters }) {
    // Estado local para sunburst de Cartera
    const [selVigencia, setSelVigencia] = useState(null);

    // Helpers lógicos internos
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
        const map = {}; 
        const keysSet = new Set();
        
        filtered.forEach(d => {
            const xVal = d[xKey] || 'N/A';
            const sKey = String(d[stackKey] || 'OTROS').toUpperCase();
            const val = Number(d[valKey] || d['count'] || 1);
            if (!map[xVal]) map[xVal] = { name: xVal };
            map[xVal][sKey] = (map[xVal][sKey] || 0) + val;
            keysSet.add(sKey);
        });
        
        return { 
            data: Object.values(map).sort((a,b) => String(a.name).localeCompare(String(b.name))), 
            keys: Array.from(keysSet) 
        };
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

    // Procesamiento de Gráficas
    const charts = useMemo(() => {
        if (!data) return null;
        return {
            regional: processGeneric(data?.cubo_regional, 'Regional_Venta', 'Franja_Meta', 'count'),
            cobro: processGeneric(data?.cubo_cobro, 'Eje_X_Cobro', 'Franja_Meta', 'count'),
            desembolsos: processGeneric(data?.cubo_desembolso, 'Año_Desembolso', 'Franja_Meta', 'Valor_Desembolso'),
            vigencia: buildDrilldown(data?.cubo_vigencia, 'Estado_Vigencia_Agrupado', 'Sub_Estado_Vigencia', 'count')
        };
    }, [data, selectedFilters]);

    if (!charts) return null;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <ChartCard title="Regional">
                <StackedBar data={charts.regional.data} keys={charts.regional.keys} />
            </ChartCard>
            <ChartCard title="Cobro">
                <StackedBar data={charts.cobro.data} keys={charts.cobro.keys} />
            </ChartCard>
            <ChartCard title="Desembolsos">
                <StackedBar data={charts.desembolsos.data} keys={charts.desembolsos.keys} isCurrency/>
            </ChartCard>
            <ChartCard 
                title={selVigencia ? `Detalle: ${selVigencia.name}` : "Vigencia"} 
                action={selVigencia && <BackBtn onClick={() => setSelVigencia(null)} />}
            >
                <InteractiveSunburst data={charts.vigencia} activeSelection={selVigencia} onSelect={setSelVigencia} />
            </ChartCard>
        </div>
    );
}