document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        imagenInput: document.getElementById('imagenInput'),
        subirBtn: document.getElementById('subirBtn'),
        mensajeExito: document.getElementById('mensajeExito'),
        resultadosContainer: document.getElementById('resultadosContainer'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        dropArea: document.getElementById('dropArea'),
        imageModal: document.getElementById('imageModal'),
        modalImage: document.getElementById('modalImage'),
        closeModal: document.getElementById('closeModal'),
        selectedFilesCount: document.getElementById('selectedFilesCount'),
        editModeSwitch: document.getElementById('editModeSwitch'),
        exportToExcelBtn: document.getElementById('exportToExcelBtn'),
        agregarFilaBtn: document.getElementById('agregarFilaBtn')
    };

    let resultados = [];
    let editMode = false;

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elements.dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        elements.dropArea.addEventListener(eventName, () => elements.dropArea.classList.add('bg-blue-100'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        elements.dropArea.addEventListener(eventName, () => elements.dropArea.classList.remove('bg-blue-100'), false);
    });

    elements.dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        elements.imagenInput.files = e.dataTransfer.files;
        updateSelectedFilesCount();
    }

    elements.imagenInput.addEventListener('change', updateSelectedFilesCount);

    function updateSelectedFilesCount() {
        const fileCount = elements.imagenInput.files.length;
        elements.selectedFilesCount.textContent = `${fileCount} archivo${fileCount !== 1 ? 's' : ''} seleccionado${fileCount !== 1 ? 's' : ''}`;
        elements.selectedFilesCount.classList.remove('hidden');
    }

    elements.editModeSwitch.addEventListener('change', () => {
        editMode = elements.editModeSwitch.checked;
        mostrarResultados(resultados);
    });

    elements.subirBtn.addEventListener('click', handleFileUpload);
    elements.agregarFilaBtn.addEventListener('click', agregarFila);

    async function handleFileUpload() {
        const archivos = elements.imagenInput.files;
        if (archivos.length === 0) {
            mostrarMensaje('Por favor, seleccione al menos un archivo.', 'error');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        const invalidFiles = Array.from(archivos).filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            mostrarMensaje(`Tipos de archivo no válidos: ${invalidFiles.map(f => f.name).join(', ')}`, 'error');
            return;
        }

        mostrarMensaje('Procesando archivos...', 'info');
        elements.loadingSpinner.classList.remove('hidden');
        elements.resultadosContainer.innerHTML = '';

        resultados = await Promise.all(Array.from(archivos).map(procesarArchivo));

        elements.loadingSpinner.classList.add('hidden');
        mostrarResultados(resultados);
        elements.exportToExcelBtn.classList.remove('hidden');
    }

    async function procesarArchivo(archivo) {
        const formData = new FormData();
        formData.append('imagen', archivo);
        formData.append('filename', archivo.name);

        try {
            const response = await fetch('/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error al procesar archivo:', error);
            return {
                filename: archivo.name,
                error: 'Error al procesar el archivo'
            };
        }
    }

    function mostrarResultados(resultados) {
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
            const row = crearFila(item, index);
            tbody.appendChild(row);
        });

        elements.resultadosContainer.innerHTML = '';
        elements.resultadosContainer.appendChild(tabla);
        mostrarMensaje('Procesamiento completado', 'success');
        elements.exportToExcelBtn.classList.remove('hidden');
        elements.agregarFilaBtn.classList.remove('hidden');
    }

    function crearFila(item, index) {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

        const celdaNombre = row.insertCell();
        const link = document.createElement('a');
        link.textContent = item.filename || '-';
        link.className = 'text-blue-600 hover:text-blue-900 cursor-pointer';
        link.onclick = () => item.imageUrl ? mostrarImagen(item) : null;
        celdaNombre.appendChild(link);

        ['fecha_factura', 'numero_factura', 'importe_total', 'base_imponible', 'iva'].forEach(field => {
            const cell = row.insertCell();
            if (editMode) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = item[field] || '';
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
        estadoCell.textContent = item.error ? 'Error' : (item.manuallyAdded ? 'Manual' : 'Procesado');
        estadoCell.className = `px-6 py-4 whitespace-nowrap text-sm ${item.error ? 'text-red-500' : (item.manuallyAdded ? 'text-blue-500' : 'text-green-500')}`;

        return row;
    }

    function agregarFila() {
        const nuevaFila = {
            filename: '',
            fecha_factura: '',
            numero_factura: '',
            importe_total: '',
            base_imponible: '',
            iva: '',
            manuallyAdded: true
        };
        resultados.push(nuevaFila);
        const tabla = elements.resultadosContainer.querySelector('table');
        if (tabla) {
            const tbody = tabla.querySelector('tbody');
            const row = crearFila(nuevaFila, resultados.length - 1);
            tbody.appendChild(row);
        } else {
            mostrarResultados(resultados);
        }
        elements.exportToExcelBtn.classList.remove('hidden');
    }

    function mostrarMensaje(mensaje, tipo) {
        elements.mensajeExito.textContent = mensaje;
        elements.mensajeExito.className = `p-4 mb-6 rounded-lg ${
            tipo === 'error' ? 'bg-red-100 text-red-700 border-l-4 border-red-500' :
            tipo === 'success' ? 'bg-green-100 text-green-700 border-l-4 border-green-500' :
            'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
        }`;
        elements.mensajeExito.classList.remove('hidden');
    }

    function mostrarImagen(item) {
        elements.modalImage.src = item.imageUrl || '';
        elements.modalImage.alt = item.filename;
        elements.imageModal.classList.remove('hidden');
        elements.imageModal.classList.add('flex');
    }

    function cerrarModal() {
        elements.imageModal.classList.add('hidden');
        elements.imageModal.classList.remove('flex');
    }

    elements.closeModal.addEventListener('click', cerrarModal);
    elements.imageModal.addEventListener('click', (e) => {
        if (e.target === elements.imageModal) {
            cerrarModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.imageModal.classList.contains('hidden')) {
            cerrarModal();
        }
    });

    elements.exportToExcelBtn.addEventListener('click', exportarAExcel);

    async function exportarAExcel() {
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
    }
});