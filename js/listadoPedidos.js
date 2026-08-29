let pedidosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();
    configurarBuscador();
});

// 1. Cargar pedidos desde la API (Filtrando estrictamente si es Cliente)
async function cargarPedidos() {
    const tabla = document.getElementById('tabla-pedidos');
    if (!tabla) return;

    try {
        const respuesta = await fetch('http://localhost:3000/api/pedidos');
        if (!respuesta.ok) {
            tabla.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error al cargar pedidos</td></tr>';
            return;
        }

        const todosLosPedidos = await respuesta.json();

        // Obtener datos del usuario logueado
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
        const rol = (localStorage.getItem('userRole') || usuarioGuardado.rol || '').toLowerCase();
        const esCliente = (rol === 'cliente');

        const idCliente = usuarioGuardado.id_cliente || usuarioGuardado.id;
        const emailCliente = (usuarioGuardado.email || '').toLowerCase().trim();
        const nombreUsuario = (usuarioGuardado.usuario || usuarioGuardado.nombre || '').toLowerCase().trim();

        if (esCliente) {
            // Filtrar SOLO los pedidos que correspondan a este cliente
            pedidosCache = todosLosPedidos.filter(p => {
                const coincideId = idCliente && (String(p.id_cliente) === String(idCliente));
                const coincideEmail = emailCliente && p.email && (p.email.toLowerCase().trim() === emailCliente);
                const coincideNombre = nombreUsuario && (
                    (p.nombre && p.nombre.toLowerCase().trim() === nombreUsuario) ||
                    (`${p.nombre || ''} ${p.apellido || ''}`.toLowerCase().trim() === nombreUsuario)
                );
                return coincideId || coincideEmail || coincideNombre;
            });
        } else {
            pedidosCache = todosLosPedidos;
        }

        renderPedidos(pedidosCache);

    } catch (error) {
        console.error('Error al conectar con la API:', error);
        tabla.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error de conexión con el servidor</td></tr>';
    }
}

// 2. Renderizar filas de pedidos
function renderPedidos(lista) {
    const tabla = document.getElementById('tabla-pedidos');
    if (!tabla) return;

    tabla.innerHTML = '';

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
    const rol = (localStorage.getItem('userRole') || usuarioGuardado.rol || '').toLowerCase();
    const esCliente = (rol === 'cliente');

    if (lista.length === 0) {
        const mensajeVacio = esCliente 
            ? 'No tienes pedidos registrados todavía. <a href="crear-pedido.html" class="font-weight-bold ml-1">¡Haz tu primer pedido aquí!</a>'
            : 'No hay pedidos registrados en el sistema.';

        tabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-clipboard-check fa-2x mb-2 d-block text-gray-400"></i>
                    ${mensajeVacio}
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach(ped => {
        const tr = document.createElement('tr');
        const totalFmt = Number(ped.total || 0).toLocaleString('es-CO');
        const fechaFmt = ped.fecha ? new Date(ped.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : 'Reciente';
        const estado = ped.estado || 'Pendiente';
        const esCancelado = (estado === 'Cancelado');

        let badgeEstado = 'badge-warning';
        if (estado === 'En Preparación') badgeEstado = 'badge-info';
        if (estado === 'Entregado') badgeEstado = 'badge-success';
        if (estado === 'Cancelado') badgeEstado = 'badge-danger';

        // Acciones: Si es cliente, SOLO botón Detalle. Si es admin/cajero/vendedor, botón Estado.
        let botonesAccion = `
            <button class="btn btn-info btn-sm shadow-sm" onclick="verDetallePedido(${ped.id})" title="Ver Detalle / Factura">
                <i class="fas fa-eye mr-1"></i> Detalle
            </button>
        `;

        if (!esCliente) {
            if (esCancelado) {
                botonesAccion += `
                    <button class="btn btn-secondary btn-sm shadow-sm ml-1" disabled title="Pedido cancelado y bloqueado">
                        <i class="fas fa-lock"></i> Bloqueado
                    </button>
                `;
            } else {
                botonesAccion += `
                    <button class="btn btn-warning btn-sm shadow-sm ml-1" onclick="abrirModalEstado(${ped.id})" title="Cambiar Estado">
                        <i class="fas fa-sync-alt"></i> Estado
                    </button>
                `;
            }
        }

        tr.innerHTML = `
            <td><strong>#${ped.id}</strong></td>
            <td>
                <strong>${ped.nombre || 'Cliente'} ${ped.apellido || ''}</strong>
            </td>
            <td><small class="text-muted">${ped.email || 'N/A'}</small></td>
            <td><small>${fechaFmt}</small></td>
            <td class="font-weight-bold text-success">$${totalFmt}</td>
            <td>
                <span class="badge ${badgeEstado} p-2">${esCancelado ? '🔒 Cancelado' : estado}</span>
            </td>
            <td class="text-center" style="white-space: nowrap;">
                ${botonesAccion}
            </td>
        `;
        tabla.appendChild(tr);
    });
}

// 3. Ver detalle del pedido en modal
window.verDetallePedido = async function(id) {
    try {
        const respuesta = await fetch(`http://localhost:3000/api/pedidos/${id}`);
        if (!respuesta.ok) {
            alert('No se pudo obtener el detalle del pedido.');
            return;
        }

        const ped = await respuesta.json();

        document.getElementById('modal-id-pedido').textContent = `#${ped.id}`;
        document.getElementById('modal-cliente-nombre').textContent = `${ped.nombre} ${ped.apellido || ''}`;
        document.getElementById('modal-cliente-email').textContent = ped.email || 'N/A';
        document.getElementById('modal-cliente-celular').textContent = ped.celular || 'N/A';
        document.getElementById('modal-cliente-direccion').textContent = ped.direccion || 'Entrega en local';
        document.getElementById('modal-metodo-pago').textContent = ped.metodo_pago || 'Efectivo';
        document.getElementById('modal-estado-badge').textContent = ped.estado || 'Pendiente';
        document.getElementById('modal-fecha').textContent = ped.fecha ? new Date(ped.fecha).toLocaleString('es-CO') : '';

        // Detalle de productos
        const tbody = document.getElementById('modal-tabla-productos');
        tbody.innerHTML = '';

        let subtotalProductos = 0;
        if (ped.detalles && ped.detalles.length > 0) {
            ped.detalles.forEach(d => {
                const sub = d.precio * d.cantidad;
                subtotalProductos += sub;
                const foto = d.producto_imagen || 'https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${foto}" class="rounded mr-2" style="width: 35px; height: 35px; object-fit: cover;" onerror="this.src='https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg'">
                            <span>${d.producto_nombre}</span>
                        </div>
                    </td>
                    <td>$${Number(d.precio).toLocaleString('es-CO')}</td>
                    <td class="text-center">${d.cantidad}</td>
                    <td class="font-weight-bold text-right">$${Number(sub).toLocaleString('es-CO')}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        document.getElementById('modal-subtotal').textContent = `$${Number(subtotalProductos).toLocaleString('es-CO')}`;
        document.getElementById('modal-descuento').textContent = `- $${Number(ped.descuento || 0).toLocaleString('es-CO')}`;
        document.getElementById('modal-envio').textContent = `+ $${Number(ped.aumento || 0).toLocaleString('es-CO')}`;
        document.getElementById('modal-total').textContent = `$${Number(ped.total || 0).toLocaleString('es-CO')}`;

        $('#modalDetallePedido').modal('show');

    } catch (error) {
        console.error('Error al ver detalle:', error);
        alert('Error de conexión al obtener detalles.');
    }
};

// 4. Abrir modal para cambiar estado (Solo Empleados / Admin)
window.abrirModalEstado = function(id) {
    const ped = pedidosCache.find(p => p.id === id);
    if (!ped) return;

    if (ped.estado === 'Cancelado') {
        alert('Este pedido está cancelado y no puede ser modificado.');
        return;
    }

    document.getElementById('modal-estado-id-pedido').textContent = `#${ped.id}`;
    document.getElementById('input-cambio-id-pedido').value = ped.id;
    document.getElementById('select-nuevo-estado').value = ped.estado || 'Pendiente';

    $('#modalCambiarEstado').modal('show');
};

// 5. Guardar cambio de estado
window.guardarCambioEstado = async function() {
    const id = document.getElementById('input-cambio-id-pedido').value;
    const nuevoEstado = document.getElementById('select-nuevo-estado').value;

    if (!id || !nuevoEstado) return;

    if (nuevoEstado === 'Cancelado') {
        const conf = confirm('⚠️ ATENCIÓN: Si cancelas este pedido se restaurará el stock de los productos y NO podrá volver a editarse.\n\n¿Deseas continuar?');
        if (!conf) return;
    }

    try {
        const respuesta = await fetch(`http://localhost:3000/api/pedidos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            $('#modalCambiarEstado').modal('hide');
            alert(resultado.message || '¡Estado del pedido actualizado!');
            cargarPedidos();
        } else {
            alert('Error: ' + (resultado.message || 'No se pudo actualizar el estado.'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor.');
    }
};

// 6. Buscador interactivo
function configurarBuscador() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        if (q === '') {
            renderPedidos(pedidosCache);
            return;
        }

        const filtrados = pedidosCache.filter(p => 
            String(p.id).includes(q) ||
            (p.nombre && p.nombre.toLowerCase().includes(q)) ||
            (p.apellido && p.apellido.toLowerCase().includes(q)) ||
            (p.email && p.email.toLowerCase().includes(q)) ||
            (p.metodo_pago && p.metodo_pago.toLowerCase().includes(q)) ||
            (p.estado && p.estado.toLowerCase().includes(q))
        );

        renderPedidos(filtrados);
    });
}

// 7. Abrir Factura formal en nueva pestaña para imprimir
window.abrirFacturaCompleta = function(id) {
    const idPed = id || document.getElementById('modal-id-pedido').textContent.replace('#', '').trim();
    if (idPed) {
        window.open(`factura.html?id=${idPed}`, '_blank');
    }
};
