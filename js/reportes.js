document.addEventListener('DOMContentLoaded', async () => {
    cargarEstadisticasYGraficas();
});

async function cargarEstadisticasYGraficas() {
    try {
        // Consultar APIs en paralelo
        const [resPedidos, resClientes, resProductos] = await Promise.all([
            fetch('http://localhost:3000/api/pedidos'),
            fetch('http://localhost:3000/api/clientes'),
            fetch('http://localhost:3000/api/productos')
        ]);

        const pedidos = resPedidos.ok ? await resPedidos.json() : [];
        const clientes = resClientes.ok ? await resClientes.json() : [];
        const productos = resProductos.ok ? await resProductos.json() : [];

        // 1. Métricas en Cards
        let totalVentas = 0;
        const pedidosPorEstado = { 'Entregado': 0, 'En Preparación': 0, 'Pendiente': 0, 'Cancelado': 0 };
        const clientesGasto = {};
        const productosVendidos = {};

        pedidos.forEach(p => {
            const estado = p.estado || 'Pendiente';
            pedidosPorEstado[estado] = (pedidosPorEstado[estado] || 0) + 1;
            const total = Number(p.total || 0);

            if (estado !== 'Cancelado') {
                totalVentas += total;
            }

            // Agrupar clientes
            const idCli = p.id_cliente;
            const nomCli = `${p.nombre || ''} ${p.apellido || ''}`.trim() || `Cliente #${idCli}`;
            if (!clientesGasto[idCli]) {
                clientesGasto[idCli] = {
                    nombre: nomCli,
                    email: p.email || 'N/A',
                    celular: p.celular || 'N/A',
                    pedidos: 0,
                    totalGastado: 0
                };
            }
            clientesGasto[idCli].pedidos += 1;
            if (estado !== 'Cancelado') {
                clientesGasto[idCli].totalGastado += total;
            }
        });

        // Consultar productos en pedidos individuales para contar cantidades
        await Promise.all(pedidos.map(async (p) => {
            try {
                const resDet = await fetch(`http://localhost:3000/api/pedidos/${p.id}`);
                if (resDet.ok) {
                    const det = await resDet.json();
                    if (det.detalles && Array.isArray(det.detalles)) {
                        det.detalles.forEach(item => {
                            const nomP = item.producto_nombre || 'Producto';
                            const cant = Number(item.cantidad || 1);
                            productosVendidos[nomP] = (productosVendidos[nomP] || 0) + cant;
                        });
                    }
                }
            } catch (e) {}
        }));

        // Actualizar Cards
        document.getElementById('rep-total-ventas').textContent = `$${totalVentas.toLocaleString('es-CO')}`;
        document.getElementById('rep-total-pedidos').textContent = pedidos.length;
        document.getElementById('rep-total-clientes').textContent = clientes.length;
        document.getElementById('rep-total-productos').textContent = productos.length;

        // 2. Gráfica de Barras 1: Top Productos Vendidos
        const topProductosArr = Object.entries(productosVendidos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7);

        const ctxPro = document.getElementById('graficaProductos').getContext('2d');
        new Chart(ctxPro, {
            type: 'bar',
            data: {
                labels: topProductosArr.map(p => p[0]),
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: topProductosArr.map(p => p[1]),
                    backgroundColor: 'rgba(78, 115, 223, 0.85)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });

        // 3. Gráfica Circular: Estados de Pedidos
        const ctxEst = document.getElementById('graficaEstados').getContext('2d');
        new Chart(ctxEst, {
            type: 'doughnut',
            data: {
                labels: ['Entregado', 'En Preparación', 'Pendiente', 'Cancelado'],
                datasets: [{
                    data: [
                        pedidosPorEstado['Entregado'] || 0,
                        pedidosPorEstado['En Preparación'] || 0,
                        pedidosPorEstado['Pendiente'] || 0,
                        pedidosPorEstado['Cancelado'] || 0
                    ],
                    backgroundColor: ['#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '65%'
            }
        });

        // 4. Gráfica de Barras Horizontal: Top Clientes
        const topClientesArr = Object.values(clientesGasto)
            .sort((a, b) => b.totalGastado - a.totalGastado)
            .slice(0, 6);

        const ctxCli = document.getElementById('graficaClientes').getContext('2d');
        new Chart(ctxCli, {
            type: 'bar',
            data: {
                labels: topClientesArr.map(c => c.nombre),
                datasets: [{
                    label: 'Total Gastado ($ COP)',
                    data: topClientesArr.map(c => c.totalGastado),
                    backgroundColor: 'rgba(28, 200, 138, 0.85)',
                    borderColor: 'rgba(28, 200, 138, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + Number(value).toLocaleString('es-CO');
                            }
                        }
                    }
                }
            }
        });

        // 5. Tabla de Ranking de Clientes
        const tablaRanking = document.getElementById('tabla-ranking-clientes');
        tablaRanking.innerHTML = '';

        const todosClientesVIP = Object.values(clientesGasto)
            .sort((a, b) => b.totalGastado - a.totalGastado);

        if (todosClientesVIP.length === 0) {
            tablaRanking.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No hay compras registradas aún</td></tr>';
            return;
        }

        todosClientesVIP.forEach((cli, idx) => {
            const tr = document.createElement('tr');
            let medalla = `#${idx + 1}`;
            if (idx === 0) medalla = '🥇 1°';
            if (idx === 1) medalla = '🥈 2°';
            if (idx === 2) medalla = '🥉 3°';

            tr.innerHTML = `
                <td class="font-weight-bold">${medalla}</td>
                <td><strong>${cli.nombre}</strong></td>
                <td>${cli.email}</td>
                <td>${cli.celular}</td>
                <td class="text-center font-weight-bold"><span class="badge badge-primary badge-pill">${cli.pedidos}</span></td>
                <td class="text-right font-weight-bold text-success">$${Number(cli.totalGastado).toLocaleString('es-CO')}</td>
            `;
            tablaRanking.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al cargar reportes:', error);
    }
}
