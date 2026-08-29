document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idPedido = params.get('id');

    if (!idPedido) {
        alert('Número de pedido no especificado');
        window.location.href = 'listado-pedidos.html';
        return;
    }

    try {
        const respuesta = await fetch(`http://localhost:3000/api/pedidos/${idPedido}`);
        if (!respuesta.ok) {
            alert('No se pudo encontrar el pedido en el sistema');
            return;
        }

        const ped = await respuesta.json();

        // 1. Llenar Encabezado
        document.getElementById('factura-id').textContent = `#${ped.id}`;
        document.getElementById('factura-fecha').textContent = ped.fecha ? new Date(ped.fecha).toLocaleString('es-CO') : '';

        // 2. Datos del Cliente
        document.getElementById('factura-cliente-nombre').textContent = `${ped.nombre || 'Cliente'} ${ped.apellido || ''}`;
        document.getElementById('factura-cliente-email').textContent = ped.email || 'No especificado';
        document.getElementById('factura-cliente-tel').textContent = ped.celular || 'No especificado';
        document.getElementById('factura-cliente-dir').textContent = ped.direccion || 'Entrega en local';

        // 3. Datos de la Orden
        document.getElementById('factura-metodo-pago').textContent = ped.metodo_pago || 'Efectivo';
        const estadoBadge = document.getElementById('factura-estado');
        estadoBadge.textContent = ped.estado || 'Pendiente';
        if (ped.estado === 'Entregado') estadoBadge.className = 'badge badge-success p-1';
        else if (ped.estado === 'Cancelado') estadoBadge.className = 'badge badge-danger p-1';
        else if (ped.estado === 'En Preparación') estadoBadge.className = 'badge badge-info p-1';
        else estadoBadge.className = 'badge badge-warning p-1';

        // 4. Ítems del Pedido
        const tbody = document.getElementById('factura-items');
        tbody.innerHTML = '';

        let subtotalCalculado = 0;
        if (ped.detalles && ped.detalles.length > 0) {
            ped.detalles.forEach(item => {
                const sub = Number(item.precio) * Number(item.cantidad);
                subtotalCalculado += sub;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <strong>${item.producto_nombre || 'Producto'}</strong>
                    </td>
                    <td class="text-right">$${Number(item.precio).toLocaleString('es-CO')}</td>
                    <td class="text-center">${item.cantidad}</td>
                    <td class="text-right font-weight-bold">$${Number(sub).toLocaleString('es-CO')}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin productos registrados</td></tr>';
        }

        // 5. Totales y Modalidad
        const desc = Number(ped.descuento || 0);
        const envio = Number(ped.aumento || 0);
        const total = Number(ped.total || (subtotalCalculado - desc + envio));

        const modalidadSpan = document.getElementById('factura-modalidad-entrega');
        if (modalidadSpan) {
            if (envio > 0) {
                modalidadSpan.innerHTML = `<span class="text-info font-weight-bold">🛵 Servicio a Domicilio (+$${Number(envio).toLocaleString('es-CO')})</span>`;
            } else {
                modalidadSpan.innerHTML = '<span class="text-success font-weight-bold">🍽️ Consumo en Local / Para Llevar ($0)</span>';
            }
        }

        document.getElementById('factura-subtotal').textContent = `$${Number(subtotalCalculado).toLocaleString('es-CO')}`;
        document.getElementById('factura-descuento').textContent = `- $${Number(desc).toLocaleString('es-CO')}`;
        document.getElementById('factura-envio').textContent = envio > 0 ? `+ $${Number(envio).toLocaleString('es-CO')}` : '$0 (Consumo en Local)';
        document.getElementById('factura-total').textContent = `$${Number(total).toLocaleString('es-CO')}`;

    } catch (error) {
        console.error('Error al cargar factura:', error);
        alert('Error de conexión con el servidor al cargar la factura.');
    }
});
