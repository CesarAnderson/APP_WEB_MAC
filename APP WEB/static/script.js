// script.js
const imagenInput = document.getElementById('imagenInput');
const subirBtn = document.getElementById('subirBtn');
const mensajeExito = document.getElementById('mensajeExito');
const resultadosContainer = document.getElementById('resultadosContainer');
const imagenMostrada = document.getElementById('imagenMostrada');

subirBtn.addEventListener('click', async () => {
    const archivos = imagenInput.files;
    if (archivos.length === 0) {
        mostrarMensaje('Por favor, seleccione al menos un archivo.', 'error');
        return;
    }

    mostrarMensaje('Procesando archivos...', 'info');
    resultadosContainer.innerHTML = '<p class="text-center">Cargando...</p>';

    const resultados = [];
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
    resultados.forEach(item => {
        const row = tbody.insertRow();
        row.className = 'bg-white';

        const celdaNombre = row.insertCell();
        const link = document.createElement('a');
        link.textContent = item.filename;
        link.className = 'text-blue-600 hover:text-blue-900 cursor-pointer';
        link.onclick = () => {
            imagenMostrada.src = item.imageUrl || '';
            imagenMostrada.alt = item.filename;
        };
        celdaNombre.appendChild(link);

        [
            item.fecha_factura || '-',
            item.numero_factura || '-',
            item.importe_total || '-',
            item.base_imponible || '-',
            item.iva || '-'
        ].forEach(text => {
            const cell = row.insertCell();
            cell.textContent = text;
            cell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
        });

        const estadoCell = row.insertCell();
        estadoCell.textContent = item.error ? 'Error' : 'Procesado';
        estadoCell.className = `px-6 py-4 whitespace-nowrap text-sm ${item.error ? 'text-red-500' : 'text-green-500'}`;
    });

    resultadosContainer.appendChild(tabla);
    mostrarMensaje('Procesamiento completado', 'success');
}

function mostrarMensaje(mensaje, tipo) {
    mensajeExito.textContent = mensaje;
    mensajeExito.className = `p-4 mb-6 rounded-lg ${
        tipo === 'error' ? 'bg-red-100 text-red-700 border-l-4 border-red-500' :
        tipo === 'success' ? 'bg-green-100 text-green-700 border-l-4 border-green-500' :
        'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
    }`;
    mensajeExito.style.display = 'block';
}