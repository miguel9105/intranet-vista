import React, { useState, useRef } from 'react';
import { RefreshCw, UploadCloud } from 'lucide-react';

const FileUploadButton = ({ apiClient, onUploadStart, onUploadSuccess, onUploadError }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        if (onUploadStart) onUploadStart();

        try {
            // 1. Obtener URL firmada
            const { data: signRes } = await apiClient.post('/reportes/generar-url', { 
                filename: file.name, 
                content_type: file.type 
            });

            // 2. Subida directa vía XHR
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signRes.upload_url);
            xhr.setRequestHeader('Content-Type', file.type);
            
            xhr.onload = async () => {
                if (xhr.status === 200) {
                    try {
                        // 3. Iniciar procesamiento
                        const { data: procRes } = await apiClient.post('/reportes/iniciar-procesamiento', { 
                            file_key: signRes.file_key, 
                            empresa: 'FINANSUENOS' 
                        });
                        
                        setIsUploading(false);
                        if (onUploadSuccess) onUploadSuccess(procRes.job_id);
                    } catch (err) {
                        setIsUploading(false);
                        if (onUploadError) onUploadError('Error al iniciar procesamiento');
                    }
                } else {
                    setIsUploading(false);
                    if (onUploadError) onUploadError('Error al subir archivo al servidor');
                }
            };

            xhr.onerror = () => {
                setIsUploading(false);
                if (onUploadError) onUploadError('Error de red durante la subida');
            };

            xhr.send(file);
        } catch (error) {
            setIsUploading(false);
            if (onUploadError) onUploadError('Error al generar URL de subida');
        }
    };

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".csv, .xlsx, .xls"
            />
            <button 
                onClick={() => fileInputRef.current.click()} 
                disabled={isUploading} 
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
                {isUploading ? (
                    <RefreshCw className="animate-spin" size={14}/>
                ) : (
                    <UploadCloud size={14}/>
                )} 
                {isUploading ? 'SUBIENDO...' : 'CARGAR BASE'}
            </button>
        </>
    );
};

export default FileUploadButton;