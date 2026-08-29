const tablaClientes = document.getElementById('tabla-clientes');
let listaClientesCache = [];
let editImagenSeleccionada = '';

document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    configurarEventosImagenEdit();
});

// 1. Cargar lista de clientes
async function cargarClientes() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/clientes');
        const clientes = await respuesta.json();
        listaClientesCache = clientes;

        if (!tablaClientes) return;
        tablaClientes.innerHTML = '';

        const user = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
        const rol = (localStorage.getItem('userRole') || user.rol || '').toLowerCase();
        const esAdmin = (rol === 'administrador' || rol === 'admin');

        clientes.forEach((cli, index) => {
            const fila = document.createElement('tr');
            const foto = cli.imagen || 'img/undraw_profile_2.svg';

            let botonesHtml = `
                <button class="btn btn-warning btn-sm mr-1 shadow-sm" onclick="abrirModalEditar(${cli.id_cliente})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            `;

            // SOLO los Administradores pueden ver y usar el botón de Eliminar
            if (esAdmin) {
                botonesHtml += `
                    <button class="btn btn-danger btn-sm shadow-sm btn-eliminar-cliente" onclick="eliminarCliente(${cli.id_cliente})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
            }

            fila.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <img src="${foto}" width="40" height="40" class="rounded-circle img-thumbnail" style="object-fit: cover;" onerror="this.src='img/undraw_profile_2.svg'">
                </td>
                <td><strong>${cli.nombre}</strong></td>
                <td>${cli.apellido || ''}</td>
                <td><small class="text-muted">${cli.email || 'N/A'}</small></td>
                <td><small>${cli.celular || 'N/A'}</small></td>
                <td><small>${cli.direccion || 'N/A'}</small></td>
                <td style="white-space: nowrap;">
                    ${botonesHtml}
                </td>
            `;
            tablaClientes.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
}

// 2. Abrir Modal de Edición
function abrirModalEditar(id) {
    const cliente = listaClientesCache.find(c => c.id_cliente == id);
    if (!cliente) return;

    document.getElementById('edit-cli-id').value = cliente.id_cliente;
    document.getElementById('edit-cli-nombre').value = cliente.nombre;
    document.getElementById('edit-cli-apellido').value = cliente.apellido || '';
    document.getElementById('edit-cli-email').value = cliente.email || '';
    document.getElementById('edit-cli-celular').value = cliente.celular || '';
    document.getElementById('edit-cli-direccion').value = cliente.direccion || '';
    document.getElementById('edit-cli-direccion2').value = cliente.direccion2 || '';
    document.getElementById('edit-cli-descripcion').value = cliente.descripcion || '';

    editImagenSeleccionada = cliente.imagen || 'img/undraw_profile_2.svg';
    document.getElementById('edit-avatar-preview').src = editImagenSeleccionada;
    document.getElementById('edit-avatar-url').value = '';
    document.getElementById('edit-avatar-file').value = '';

    $('#modalEditarCliente').modal('show');
}

// 3. Configurar eventos de imagen en el Modal con compresión
function configurarEventosImagenEdit() {
    const preview = document.getElementById('edit-avatar-preview');
    const inputUrl = document.getElementById('edit-avatar-url');
    const inputFile = document.getElementById('edit-avatar-file');
    const items = document.querySelectorAll('.modal-avatar-item');

    items.forEach(item => {
        item.addEventListener('click', () => {
            editImagenSeleccionada = item.getAttribute('data-src');
            if (preview) preview.src = editImagenSeleccionada;
            if (inputUrl) inputUrl.value = '';
            if (inputFile) inputFile.value = '';
        });
    });

    if (inputUrl) {
        inputUrl.addEventListener('input', () => {
            if (inputUrl.value.trim() !== '') {
                editImagenSeleccionada = inputUrl.value.trim();
                if (preview) preview.src = editImagenSeleccionada;
                if (inputFile) inputFile.value = '';
            }
        });
    }

    if (inputFile) {
        inputFile.addEventListener('change', () => {
            const archivo = inputFile.files[0];
            if (archivo) {
                const lector = new FileReader();
                lector.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxSize = 400;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                            if (width > maxSize) {
                                height = Math.round(height * (maxSize / width));
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width = Math.round(width * (maxSize / height));
                                height = maxSize;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        editImagenSeleccionada = canvas.toDataURL('image/jpeg', 0.8);
                        if (preview) preview.src = editImagenSeleccionada;
                        if (inputUrl) inputUrl.value = '';
                    };
                    img.src = e.target.result;
                };
                lector.readAsDataURL(archivo);
            }
        });
    }
}

// 4. Guardar edición de cliente
const formEditar = document.getElementById('formulario-editar-cliente');
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-cli-id').value;
        const nombre = document.getElementById('edit-cli-nombre').value.trim();
        const apellido = document.getElementById('edit-cli-apellido').value.trim();
        const email = document.getElementById('edit-cli-email').value.trim();
        const celular = document.getElementById('edit-cli-celular').value.trim();
        const direccion = document.getElementById('edit-cli-direccion').value.trim();
        const direccion2 = document.getElementById('edit-cli-direccion2').value.trim();
        const descripcion = document.getElementById('edit-cli-descripcion').value.trim();

        const datosActualizados = {
            nombre,
            apellido,
            email,
            celular,
            direccion,
            direccion2,
            descripcion,
            imagen: editImagenSeleccionada
        };

        try {
            const respuesta = await fetch(`http://localhost:3000/api/clientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosActualizados)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                $('#modalEditarCliente').modal('hide');
                alert(resultado.message || '¡Cliente actualizado exitosamente!');
                cargarClientes();
            } else {
                alert('Error al actualizar: ' + (resultado.message || 'No se pudo actualizar'));
            }
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            alert('Error de conexión al actualizar cliente.');
        }
    });
}

// 5. Eliminar cliente (Solo Administrador)
async function eliminarCliente(id) {
    const user = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
    const rol = (localStorage.getItem('userRole') || user.rol || '').toLowerCase();
    const esAdmin = (rol === 'administrador' || rol === 'admin');

    if (!esAdmin) {
        alert('⚠️ Solo los Administradores tienen permisos para eliminar clientes.');
        return;
    }

    const confirmar = confirm('¿Estás seguro de que deseas eliminar este cliente?');
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`http://localhost:3000/api/clientes/${id}`, {
            method: 'DELETE'
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert(resultado.message || '¡Cliente eliminado con éxito!');
            cargarClientes();
        } else {
            alert('Error al eliminar: ' + (resultado.message || 'No se pudo eliminar'));
        }
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error de conexión con el servidor.');
    }
}
