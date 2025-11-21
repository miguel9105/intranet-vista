import { useState, useRef } from 'react';
// IMPORTANTE: Asegúrate de que AuthContext proporciona apiClient (usando Axios o Fetch con el token)
import { useAuth } from './AuthContext'; 
import axios from 'axios';

// RUTA CORREGIDA
const PROCESAMIENTO_ENDPOINT = 'procesamiento'; 
const POLLING_INTERVAL = 5000; // 5 segundos

export const useDataCreditoProcess = () => {
    const { apiClient } = useAuth();
    
    const [status, setStatus] = useState('idle'); // idle | loading | uploading | processing | completed | error
    const [message, setMessage] = useState('');
    const [result, setResult] = useState(null);
    const [progress, setProgress] = useState(0);
    
    const pollingIntervalRef = useRef(null);

    // --- Funciones Auxiliares ---

    const clearPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const uploadFileToS3 = async (url, file, contentType) => {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': contentType },
                body: file,
            });
            
            if (!response.ok) {
                // Si S3 devuelve un error, lo capturamos
                throw new Error(`Fallo la subida a S3 con estado: ${response.status} ${response.statusText}`);
            }
            return true;
        } catch (error) {
            console.error("Error al subir a S3:", error);
            // Propagamos el error para que sea capturado en processDatacreditoFiles
            throw new Error(`No se pudo completar la subida de archivos: ${error.message}`);
        }
    };
    
    // --- Paso 4: Polling Robusto (Mantiene la corrección del 404) ---
    const startPolling = (outputKey) => {
        return new Promise((resolve, reject) => {
            clearPolling();

            pollingIntervalRef.current = setInterval(async () => {
                try {
                    setStatus('processing');
                    setMessage(prev => prev.includes('...') ? 'Verificando estado del reporte.' : 'Verificando estado del reporte...');
                    setProgress(p => Math.min(p + 2, 95)); 

                    // LLAMADA CORREGIDA A LA RUTA
                    const response = await apiClient.get(`/${PROCESAMIENTO_ENDPOINT}/estado?key=${outputKey}`); //
                    const statusData = response.data;
                        
                    if (statusData.status === 'completed') {
                        clearPolling();
                        setStatus('completed');
                        setMessage('¡Procesamiento finalizado con éxito!');
                        setResult(statusData); 
                        setProgress(100);
                        resolve(statusData);
                    } else if (statusData.status === 'processing') {
                        setMessage(statusData.message || 'Analizando datos en DataCrédito...'); 
                    } else {
                        throw new Error(`Estado inesperado: ${statusData.status}`);
                    }
                } catch (error) {
                    // Manejo del 404 de S3 (Temporal)
                    if (error.response && error.response.status === 404) {
                        console.warn("Recibido 404 en polling (Archivo no listo aun). Continuando espera...");
                        setMessage('Finalizando generación del archivo (Esperando S3)...');
                        return; 
                    }

                    // Errores fatales
                    clearPolling();
                    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
                    console.error("Error fatal durante el polling:", errorMsg);
                    setStatus('error');
                    setMessage(`Error: ${errorMsg}`);
                    reject(new Error(errorMsg));
                }
            }, POLLING_INTERVAL);
        });
    };

    const processDatacreditoFiles = async ({ planoFile, correccionesFile, empresaNombre }) => {
        // Reset de estados
        setStatus('loading');
        setMessage('Iniciando el proceso...');
        setProgress(5);
        setResult(null);
        clearPolling(); 

        try {
            // --- PASO 1: Generar URLs ---
            setMessage('Paso 1/4: Solicitando autorización de subida...');
            const urlPayload = {
                plano_filename: planoFile.name,
                correcciones_filename: correccionesFile.name,
                plano_content_type: planoFile.type || 'application/octet-stream',
                correcciones_content_type: correccionesFile.type || 'application/octet-stream',
            };
            // LLAMADA CORREGIDA A LA RUTA
            const urlResponse = await apiClient.post(`/${PROCESAMIENTO_ENDPOINT}/generar-urls`, urlPayload); //
            const urlsData = urlResponse.data;
            setProgress(25);

            // --- PASO 2: Subir a S3 ---
            setStatus('uploading');
            setMessage('Paso 2/4: Subiendo archivos al servidor seguro...');
            await Promise.all([
                uploadFileToS3(urlsData.plano.upload_url, planoFile, urlPayload.plano_content_type), //
                uploadFileToS3(urlsData.correcciones.upload_url, correccionesFile, urlPayload.correcciones_content_type) //
            ]);
            setProgress(60);

            // --- PASO 3: Iniciar Proceso ---
            setStatus('processing');
            setMessage('Paso 3/4: Iniciando motor de análisis...');
            const processPayload = {
                plano_key: urlsData.plano.key,
                correcciones_key: urlsData.correcciones.key,
                empresa: empresaNombre,
            };
            // LLAMADA CORREGIDA A LA RUTA
            const processResponse = await apiClient.post(`/${PROCESAMIENTO_ENDPOINT}/iniciar`, processPayload); //
            const outputKey = processResponse.data.output_key;
            setProgress(70);

            // --- PASO 4: Polling ---
            setMessage('Paso 4/4: Esperando reporte final...');
            await startPolling(outputKey); //

        } catch (error) {
            clearPolling();
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message; //
            console.error("Fallo el flujo:", errorMsg);
            setStatus('error');
            setMessage(`Error crítico: ${errorMsg}`); //
            setProgress(0);
        }
    };

    return {
        processDatacreditoFiles,
        status,
        message,
        result,
        progress,
        isLoading: ['loading', 'uploading', 'processing'].includes(status), //
    };
};