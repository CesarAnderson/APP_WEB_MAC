// script.js
document.addEventListener('DOMContentLoaded', () => {
    const imagenInput = document.getElementById('imagenInput');
    const subirBtn = document.getElementById('subirBtn');
    const mensajeExito = document.getElementById('mensajeExito');
    const resultadosContainer = document.getElementById('resultadosContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const dropArea = document.getElementById('dropArea');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');
    const selectedFilesCount = document.getElementById('selectedFilesCount');
    const editModeContainer = document.getElementById('editModeContainer');
    const editModeSwitch = document.getElementById('editModeSwitch');
    const exportToExcelBtn = document.getElementById('exportToExcelBtn');

    let resultados = [];
    let editMode = false;

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('bg-blue-100');
    }

    function unhighlight() {
        dropArea.classList.remove('bg-blue-100');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        imagenInput.files = files;
        updateSelectedFilesCount();
    }

    imagenInput.addEventListener('change', updateSelectedFilesCount);

    function updateSelectedFilesCount() {
        const fileCount = imagenInput.files.length;
        selectedFilesCount.textContent = `${fileCount} archivo${fileCount !== 1 ? 's' : ''} seleccionado${fileCount !== 1 ? 's' : ''}`;
        selectedFilesCount.classList.remove('hidden');
    }

    // Agregar event listener para el switch de modo edición
    editModeSwitch.addEventListener('change', () => {
        editMode = editModeSwitch.checked;
        mostrarResultados(resultados);
    });

    subirBtn.addEventListener('click', async () => {
        const archivos = imagenInput.files;
        if (archivos.length === 0) {
            mostrarMensaje('Por favor, seleccione al menos un archivo.', 'error');
            return;
        }

        // Validate file types
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        const invalidFiles = Array.from(archivos).filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            mostrarMensaje(`Tipos de archivo no válidos: ${invalidFiles.map(f => f.name).join(', ')}`, 'error');
            return;
        }

        mostrarMensaje('Procesando archivos...', 'info');
        loadingSpinner.classList.remove('hidden');
        resultadosContainer.innerHTML = '';

        resultados = []; // Reiniciar resultados
        for (let i = 0; i < archivos.length; i++) {
            try {
                const resultado = await procesarArchivo(archivos[i]);
                resultados.push(resultado);
            } catch (error) {
                console.error('Error al procesar archivo:', error);
                resultados.push({
                    filename: archivos[i].name,
                    error: 'Error al procesar el archivo'
                });
            }
        }

        loadingSpinner.classList.add('hidden');
        editModeContainer.classList.remove('hidden');
        mostrarResultados(resultados);
    });

    async function procesarArchivo(archivo) {
        const formData = new FormData();
        formData.append('imagen', archivo);
        formData.append('filename', archivo.name);

        const response = await fetch('/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    function mostrarResultados(resultados) {
        resultadosContainer.innerHTML = '';
        const tabla = document.createElement('table');
        tabla.className = 'min-w-full divide-y divide-gray-200';
        const thead = tabla.createTHead();
        const headerRow = thead.insertRow();
        ['Archivo', 'Fecha', 'Número', 'Importe', 'Base Imponible', 'IVA', 'Estado'].forEach(text => {
            const th = document.createElement('th');
            th.className = 'px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
            th.textContent = text;
            headerRow.appendChild(th);
        });

        const tbody = tabla.createTBody();
        resultados.forEach((item, index) => {
            const row = tbody.insertRow();
            row.className = 'bg-white';

            const celdaNombre = row.insertCell();
            const link = document.createElement('a');
            link.textContent = item.filename;
            link.className = 'text-blue-600 hover:text-blue-900 cursor-pointer';
            link.onclick = () => {
                modalImage.src = item.imageUrl || '';
                modalImage.alt = item.filename;
                imageModal.classList.remove('hidden');
                imageModal.classList.add('flex');
            };
            celdaNombre.appendChild(link);

            ['fecha_factura', 'numero_factura', 'importe_total', 'base_imponible', 'iva'].forEach(field => {
                const cell = row.insertCell();
                if (editMode) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = item[field] || '-';
                    input.className = 'w-full px-2 py-1 border rounded';
                    input.onchange = (e) => {
                        resultados[index][field] = e.target.value;
                    };
                    cell.appendChild(input);
                } else {
                    cell.textContent = item[field] || '-';
                }
                cell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            });

            const estadoCell = row.insertCell();
            estadoCell.textContent = item.error ? 'Error' : 'Procesado';
            estadoCell.className = `px-6 py-4 whitespace-nowrap text-sm ${item.error ? 'text-red-500' : 'text-green-500'}`;
        });

        resultadosContainer.appendChild(tabla);
        mostrarMensaje('Procesamiento completado', 'success');
        
        // Show the Export to Excel button after results are displayed
        exportToExcelBtn.classList.remove('hidden');
    }

    function mostrarMensaje(mensaje, tipo) {
        mensajeExito.textContent = mensaje;
        mensajeExito.className = `p-4 mb-6 rounded-lg ${
            tipo === 'error' ? 'bg-red-100 text-red-700 border-l-4 border-red-500' :
            tipo === 'success' ? 'bg-green-100 text-green-700 border-l-4 border-green-500' :
            'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
        }`;
        mensajeExito.classList.remove('hidden');
    }

    function closeModalFunction() {
        imageModal.classList.add('hidden');
        imageModal.classList.remove('flex');
    }

    closeModal.addEventListener('click', closeModalFunction);

    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            closeModalFunction();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !imageModal.classList.contains('hidden')) {
            closeModalFunction();
        }
    });

    // Add event listener for the Export to Excel button
    exportToExcelBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/export-to-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resultados),
            });

            if (response.ok) {
                mostrarMensaje('Datos exportados a Excel exitosamente', 'success');
            } else {
                mostrarMensaje('Error al exportar a Excel', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al exportar a Excel', 'error');
        }
    });
});