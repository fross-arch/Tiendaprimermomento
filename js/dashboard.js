document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [resPro, resPed] = await Promise.all([
            fetch('http://localhost:3000/api/productos'),
            fetch('http://localhost:3000/api/pedidos')
        ]);

        const productos = resPro.ok ? await resPro.json() : [];
        const pedidos = resPed.ok ? await resPed.json() : [];

        // Obtener usuario logueado y rol
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
        const rol = (localStorage.getItem('userRole') || usuarioGuardado.rol || '').toLowerCase();
        const esCliente = (rol === 'cliente');

        const idCliente = usuarioGuardado.id_cliente || usuarioGuardado.id;
        const emailCliente = (usuarioGuardado.email || '').toLowerCase().trim();
        const nombreUsuario = (usuarioGuardado.usuario || usuarioGuardado.nombre || '').toLowerCase().trim();

        // 1. Llenar tabla de últimos productos
        const tbodyPro = document.getElementById('tabla-ultimos-productos');
        if (tbodyPro) {
            tbodyPro.innerHTML = '';
            productos.slice(0, 5).forEach(p => {
                const tr = document.createElement('tr');
                const foto = p.imagen || 'https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg';
                tr.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${foto}" class="rounded mr-2" style="width: 32px; height: 32px; object-fit: cover;" onerror="this.src='https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg'">
                            <strong>${p.nombre}</strong>
                        </div>
                    </td>
                    <td class="font-weight-bold text-success">$$${Number(p.precio).toLocaleString('es-CO')}</td>
                `;
                tbodyPro.appendChild(tr);
            });
        }

        // 2. Filtrar pedidos si es cliente
        let pedidosFiltrados = pedidos;
        if (esCliente) {
            pedidosFiltrados = pedidos.filter(p => {
                const coincideId = idCliente && (String(p.id_cliente) === String(idCliente));
                const coincideEmail = emailCliente && p.email && (p.email.toLowerCase().trim() === emailCliente);
                const coincideNombre = nombreUsuario && (
                    (p.nombre && p.nombre.toLowerCase().trim() === nombreUsuario) ||
                    (`${p.nombre || ''} ${p.apellido || ''}`.toLowerCase().trim() === nombreUsuario)
                );
                return coincideId || coincideEmail || coincideNombre;
            });

            // Ajustar encabezado de la tarjeta para clientes
            const encabezadoPed = document.querySelector('#tabla-ultimos-pedidos')?.closest('.card')?.querySelector('.card-header h6');
            if (encabezadoPed) {
                encabezadoPed.innerHTML = '<i class="fas fa-shopping-bag mr-1"></i> Mis Últimos Pedidos';
            }
        }

        // 3. Llenar tabla de últimos pedidos
        const tbodyPed = document.getElementById('tabla-ultimos-pedidos');
        if (tbodyPed) {
            tbodyPed.innerHTML = '';

            if (pedidosFiltrados.length === 0) {
                tbodyPed.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center text-muted py-3">
                            <i class="fas fa-box-open fa-2x mb-2 d-block text-gray-300"></i>
                            ${esCliente ? 'No has realizado pedidos aún. <br><a href="crear-pedido.html" class="btn btn-sm btn-primary mt-2 font-weight-bold">¡Haz tu primer pedido!</a>' : 'No hay pedidos recientes.'}
                        </td>
                    </tr>
                `;
                return;
            }

            pedidosFiltrados.slice(0, 5).forEach(ped => {
                const tr = document.createElement('tr');
                const estado = ped.estado || 'Pendiente';
                let badge = 'badge-warning';
                if (estado === 'Entregado') badge = 'badge-success';
                if (estado === 'Cancelado') badge = 'badge-danger';
                if (estado === 'En Preparación') badge = 'badge-info';

                tr.innerHTML = `
                    <td><strong>#${ped.id}</strong></td>
                    <td>${ped.nombre || 'Cliente'} ${ped.apellido || ''}</td>
                    <td><span class="badge ${badge} p-1">${estado}</span></td>
                `;
                tbodyPed.appendChild(tr);
            });
        }

    } catch (err) {
        console.error('Error al cargar dashboard:', err);
    }
});