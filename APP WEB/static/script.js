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
        agregarFilaBtn: document.getElementById('agregarFilaBtn'),
        openExcelBtn: document.getElementById('openExcelBtn'),
        modalImageName: document.getElementById('modalImageName'),
        imageInfo: document.getElementById('imageInfo'),
        imageContainer: document.getElementById('imageContainer')
    };

    let resultados = [];
    let editMode = false;
    let currentImageIndex = -1;

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
        const archivos = Array.from(elements.imagenInput.files).slice(0, 15);
        if (archivos.length === 0) {
            mostrarMensaje('Por favor, seleccione al menos un archivo.', 'error');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        const invalidFiles = archivos.filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            mostrarMensaje(`Tipos de archivo no válidos: ${invalidFiles.map(f => f.name).join(', ')}`, 'error');
            return;
        }

        mostrarMensaje('Procesando archivos...', 'info');
        elements.loadingSpinner.classList.remove('hidden');
        elements.resultadosContainer.innerHTML = '';

        resultados = await Promise.all(archivos.map(procesarArchivo));

        elements.loadingSpinner.classList.add('hidden');
        mostrarResultados(resultados);
        elements.exportToExcelBtn.classList.remove('hidden');
        elements.openExcelBtn.classList.remove('hidden');
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
        ['Fecha', 'Número', 'Codigo Empresa', 'Tipo de Gasto', 'Base Imponible', 'IVA', 'Importe', 'Archivo', 'Estado'].forEach(text => {
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
        elements.openExcelBtn.classList.remove('hidden');
        elements.agregarFilaBtn.classList.remove('hidden');
    }

    function crearFila(item, index) {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

        const campos = [
            { key: 'fecha_factura', type: 'date' },
            { key: 'numero_factura', type: 'text' },
            { key: 'codigo_empresa', type: 'text' },
            { key: 'tipo_gasto', type: 'text' },
            { key: 'base_imponible', type: 'number' },
            { key: 'iva', type: 'number' },
            { key: 'importe_total', type: 'number' }
        ];

        campos.forEach(campo => {
            const cell = row.insertCell();
            cell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            if (editMode) {
                const input = document.createElement('input');
                input.type = campo.type;
                input.value = item[campo.key] || '';
                input.className = 'w-full border-gray-300 rounded-md';
                input.addEventListener('change', (e) => {
                    item[campo.key] = e.target.value;
                });
                cell.appendChild(input);
            } else {
                cell.textContent = item[campo.key] || '';
            }
        });

        const fileCell = row.insertCell();
        fileCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'text-indigo-600 hover:text-indigo-900';
        link.textContent = item.filename;
        link.onclick = () => item.imageUrl ? mostrarImagen(index) : null;
        fileCell.appendChild(link);

        const statusCell = row.insertCell();
        statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        statusCell.textContent = item.error ? 'Error' : 'Procesado';

        return row;
    }

    function agregarFila() {
        const nuevaFila = {
            fecha_factura: '',
            numero_factura: '',
            codigo_empresa: '',
            tipo_gasto: '',
            base_imponible: '',
            iva: '',
            importe_total: '',
            filename: 'Nueva fila',
            imageUrl: ''
        };
        resultados.push(nuevaFila);
        const tabla = elements.resultadosContainer.querySelector('table');
        if (tabla) {
            const tbody = tabla.querySelector('tbody');
            const row = crearFila(nuevaFila, resultados.length - 1);
            tbody.appendChild(row);
            // Enfocar el primer input de la nueva fila
            const primerInput = row.querySelector('input');
            if (primerInput) {
                primerInput.focus();
            }
        } else {
            mostrarResultados(resultados);
        }
        elements.exportToExcelBtn.classList.remove('hidden');
        elements.openExcelBtn.classList.remove('hidden');
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

    function mostrarImagen(index) {
        if (index >= 0 && index < resultados.length) {
            currentImageIndex = index;
            const item = resultados[index];
            elements.modalImage.src = item.imageUrl || '';
            elements.modalImage.alt = item.filename;
            elements.modalImageName.textContent = item.filename;
            elements.imageModal.classList.remove('hidden');
            elements.imageModal.classList.add('flex');
            
            mostrarInfoImagen(item);

            // Ajustar la imagen al ancho disponible
            elements.modalImage.style.maxWidth = '100%';
            elements.modalImage.style.height = 'auto';
        }
    }

    function mostrarInfoImagen(item) {
        elements.imageInfo.innerHTML = '';
        
        const campos = [
            { nombre: 'Fecha', valor: item.fecha_factura },
            { nombre: 'Número', valor: item.numero_factura },
            { nombre: 'Codigo Empresa', valor: item.codigo_empresa },
            { nombre: 'Tipo de Gasto', valor: item.tipo_gasto },
            { nombre: 'Base Imponible', valor: item.base_imponible },
            { nombre: 'IVA', valor: item.iva },
            { nombre: 'Importe', valor: item.importe_total }
        ];

        campos.forEach(campo => {
            const div = document.createElement('div');
            div.className = 'mb-4';
            const label = document.createElement('label');
            label.textContent = campo.nombre;
            label.className = 'block text-sm font-bold mb-1';
            const input = document.createElement('input');
            input.type = 'text';
            input.value = campo.valor || '';
            input.className = 'w-full border rounded px-2 py-1';
            input.addEventListener('change', (e) => actualizarCampo(item, campo.nombre, e.target.value));
            div.appendChild(label);
            div.appendChild(input);
            elements.imageInfo.appendChild(div);
        });
    }

    function actualizarCampo(item, campo, valor) {
        const campoMapeado = {
            'Fecha': 'fecha_factura',
            'Número': 'numero_factura',
            'Codigo Empresa': 'codigo_empresa',
            'Tipo de Gasto': 'tipo_gasto',
            'Base Imponible': 'base_imponible',
            'IVA': 'iva',
            'Importe': 'importe_total'
        }[campo];

        if (campoMapeado) {
            item[campoMapeado] = valor;
            mostrarResultados(resultados);
        }
    }

    function navegarImagen(direccion) {
        let newIndex = currentImageIndex + direccion;
        if (newIndex < 0) newIndex = resultados.length - 1;
        if (newIndex >= resultados.length) newIndex = 0;
        mostrarImagen(newIndex);
    }

    function navegarImagenDerecha() {
        navegarImagen(1);
    }

    function navegarImagenIzquierda() {
        navegarImagen(-1);
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
        if (!elements.imageModal.classList.contains('hidden')) {
            switch (e.key) {
                case 'Escape':
                    cerrarModal();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    navegarImagenDerecha();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    navegarImagenIzquierda();
                    break;
            }
        }
    });

    elements.exportToExcelBtn.addEventListener('click', exportarAExcel);
    elements.openExcelBtn.addEventListener('click', abrirExcel);

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
                elements.openExcelBtn.classList.remove('hidden');
            } else {
                mostrarMensaje('Error al exportar a Excel', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al exportar a Excel', 'error');
        }
    }

    async function abrirExcel() {
        try {
            const response = await fetch('/open-excel', {
                method: 'GET',
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    mostrarMensaje('Archivo Excel abierto exitosamente', 'success');
                } else {
                    mostrarMensaje('No se pudo abrir el archivo Excel', 'error');
                }
            } else {
                mostrarMensaje('Error al intentar abrir el archivo Excel', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al intentar abrir el archivo Excel', 'error');
        }
    }
});
