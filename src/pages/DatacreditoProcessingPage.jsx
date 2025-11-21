// DatacreditoProcessingPage.jsx (Sin cambios funcionales, ya estaba correcto)

import React, { useState } from 'react';
import { useDataCreditoProcess } from '../context/useDataCreditoProcess'; 
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'; 
import { ChartBarIcon, DocumentCheckIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

function DatacreditoProcessingPage() {
    const { 
        processDatacreditoFiles, 
        status, 
        message, 
        result, 
        progress, 
        isLoading 
    } = useDataCreditoProcess(); //

    const [planoFile, setPlanoFile] = useState(null); //
    const [correccionesFile, setCorreccionesFile] = useState(null); //
    const [empresaNombre, setEmpresaNombre] = useState(''); //

    const handleSubmit = async (e) => { //
        e.preventDefault();
        
        if (!planoFile || !correccionesFile || !empresaNombre) { //
            alert("Por favor, selecciona ambos archivos y el nombre de la empresa.");
            return;
        }

        await processDatacreditoFiles({ planoFile, correccionesFile, empresaNombre }); //
    };

    return (
        <AuthenticatedLayout>
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 flex items-center">
                    <ChartBarIcon className="w-8 h-8 mr-3 text-blue-600" />
                    Procesamiento de Reporte DataCrédito
                </h1>

                <div className="md:grid md:grid-cols-3 gap-8">
                    {/* Columna de Formulario */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">Subida y Configuración de Archivos</h2>
                            
                            {/* Campo de Empresa */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    value={empresaNombre}
                                    onChange={(e) => setEmpresaNombre(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:ring-blue-500"
                                    required
                                    disabled={isLoading} //
                                />
                            </div>

                            {/* Input Plano */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">
                                    <FolderOpenIcon className="w-5 h-5 inline mr-1" /> Archivo Plano (CSV/TXT)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setPlanoFile(e.target.files[0])} //
                                    className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                    required
                                    accept=".csv,.txt"
                                    disabled={isLoading} //
                                />
                            </div>

                            {/* Input Correcciones */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-bold mb-2">
                                    <DocumentCheckIcon className="w-5 h-5 inline mr-1" /> Archivo Correcciones (XLSX)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setCorreccionesFile(e.target.files[0])} //
                                    className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                    required
                                    accept=".xlsx"
                                    disabled={isLoading} //
                                />
                            </div>

                            {/* Botón de Subida */}
                            <button
                                type="submit"
                                disabled={isLoading} //
                                className={`py-2 px-4 rounded-full text-white font-semibold transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isLoading ? `Procesando... ${Math.round(progress)}%` : 'Iniciar Procesamiento Asíncrono'} //
                            </button>
                        </form>
                    </div>
                    
                    {/* Columna de Estado */}
                    <div className="md:col-span-1 mt-6 md:mt-0">
                        <div className="p-6 bg-yellow-50 rounded-xl shadow-lg border border-yellow-200">
                            <h2 className="text-xl font-semibold mb-3 text-yellow-800">Estado del Proceso</h2>
                            <p className="text-lg font-mono text-yellow-900">{status.toUpperCase()}</p>
                            <p className="text-sm text-gray-600 mt-2">{message}</p>

                            {/* Barra de Progreso */}
                            {(isLoading || status === 'completed') && (
                                <div className="mt-4 h-2 bg-gray-300 rounded-full">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${status === 'error' ? 'bg-red-500' : status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${progress}%` }} //
                                    ></div>
                                </div>
                            )}

                            {/* Resultado Final */}
                            {status === 'completed' && result && (
                                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                                    <p className="font-bold text-green-800">✅ ¡Listo! Archivo Finalizado:</p>
                                    <a 
                                        href={result.download_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:text-blue-800 font-semibold mt-2 block break-words"
                                    >
                                        Descargar Resultado (.xlsx)
                                    </a>
                                </div>
                            )}
                             {/* Estado de Error */}
                            {status === 'error' && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 font-medium">
                                    ❌ Ha ocurrido un error. Revisa los mensajes anteriores. //
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default DatacreditoProcessingPage;