// Estado global del carrito y catálogos
let carrito = [];
let listaProductos = [];
let listaClientes = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    cargarProductos();
    configurarEventos();
});

// 1. Cargar clientes en el select (Si es Cliente, SOLO aparece su propio nombre)
async function cargarClientes() {
    const selectCliente = document.getElementById('id_cliente');
    if (!selectCliente) return;

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
    const rol = (localStorage.getItem('userRole') || usuarioGuardado.rol || '').toLowerCase();
    const esCliente = (rol === 'cliente');

    if (esCliente) {
        // Para clientes, SOLO se agrega a sí mismo en el select
        const idCli = usuarioGuardado.id_cliente || usuarioGuardado.id || 1;
        const nombreCompleto = `${usuarioGuardado.nombre || 'Cliente'} ${usuarioGuardado.apellido || ''}`.trim();
        const emailCli = usuarioGuardado.email || usuarioGuardado.usuario || '';
        
        selectCliente.innerHTML = `<option value="${idCli}" selected>${nombreCompleto} (${emailCli})</option>`;
        selectCliente.disabled = true;

        const aviso = document.getElementById('aviso-cliente-logueado');
        if (aviso) {
            aviso.style.display = 'block';
            aviso.innerHTML = `<i class="fas fa-user-check mr-1"></i> Pedido registrado a tu nombre: <strong>${nombreCompleto}</strong>`;
        }
        return;
    }

    // Para Administradores / Vendedores / Cajeros: Cargar todos los clientes
    try {
        const respuesta = await fetch('http://localhost:3000/api/clientes');
        if (!respuesta.ok) return;

        listaClientes = await respuesta.json();
        selectCliente.innerHTML = '<option value="" disabled selected>-- Seleccionar Cliente --</option>';

        listaClientes.forEach(cli => {
            const opt = document.createElement('option');
            opt.value = cli.id_cliente;
            opt.textContent = `${cli.nombre} ${cli.apellido} (${cli.email})`;
            selectCliente.appendChild(opt);
        });

    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
}

// 2. Cargar productos en el selector rápido
async function cargarProductos() {
    const selectPro = document.getElementById('select-producto-agregar');
    if (!selectPro) return;

    try {
        const respuesta = await fetch('http://localhost:3000/api/productos');
        if (!respuesta.ok) return;

        listaProductos = await respuesta.json();
        selectPro.innerHTML = '<option value="" disabled selected>-- Elige un producto para agregar --</option>';

        listaProductos.forEach(pro => {
            const opt = document.createElement('option');
            opt.value = pro.id;
            const precioFmt = Number(pro.precio).toLocaleString('es-CO');
            opt.textContent = `${pro.nombre} - $${precioFmt} (Stock: ${pro.stock})`;
            if (pro.stock <= 0) {
                opt.textContent += ' [AGOTADO]';
                opt.disabled = true;
            }
            selectPro.appendChild(opt);
        });

    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// 3. Configurar eventos interactivos
function configurarEventos() {
    const btnAgregar = document.getElementById('btn-agregar-carrito');
    const selectPro = document.getElementById('select-producto-agregar');
    const inputCantidad = document.getElementById('cantidad-agregar');
    const selectTipoEntrega = document.getElementById('tipo_entrega');
    const selectDescuento = document.getElementById('select-descuento');
    const inputDescuento = document.getElementById('descuento');
    const inputAumento = document.getElementById('aumento');
    const formPedido = document.getElementById('formulario-pedido');

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
    const rol = (localStorage.getItem('userRole') || usuarioGuardado.rol || '').toLowerCase();
    const esAdmin = (rol === 'administrador' || rol === 'admin');

    // Quitar descuento manual si no es Administrador
    if (selectDescuento && !esAdmin) {
        const optManual = selectDescuento.querySelector('option[value="manual"]');
        if (optManual) optManual.remove();
    }

    // Inicializar costo de aumento bloqueado
    if (inputAumento) {
        inputAumento.readOnly = true;
        inputAumento.value = 5000;
    }

    // Cambia vista previa al elegir producto
    if (selectPro) {
        selectPro.addEventListener('change', () => {
            const idPro = parseInt(selectPro.value);
            const pro = listaProductos.find(p => p.id === idPro);
            const previewImg = document.getElementById('preview-producto-agregar');
            const previewPrecio = document.getElementById('preview-precio-agregar');
            const previewStock = document.getElementById('preview-stock-agregar');

            if (pro) {
                if (previewImg) previewImg.src = pro.imagen || 'https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg';
                if (previewPrecio) previewPrecio.textContent = `$${Number(pro.precio).toLocaleString('es-CO')}`;
                if (previewStock) previewStock.textContent = `Disponible: ${pro.stock} unidades`;
                if (inputCantidad) {
                    inputCantidad.max = pro.stock;
                    inputCantidad.value = 1;
                }
            }
        });
    }

    // Agregar producto al carrito
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            const idPro = parseInt(selectPro.value);
            const cant = parseInt(inputCantidad.value, 10);

            if (!idPro) {
                alert('Por favor selecciona un producto de la lista.');
                return;
            }

            if (isNaN(cant) || cant <= 0) {
                alert('Ingresa una cantidad válida.');
                return;
            }

            const pro = listaProductos.find(p => p.id === idPro);
            if (!pro) return;

            // Verificar si ya existe en el carrito
            const itemExistente = carrito.find(item => item.id_producto === idPro);
            const cantTotal = itemExistente ? itemExistente.cantidad + cant : cant;

            if (cantTotal > pro.stock) {
                alert(`Stock insuficiente. Solo hay ${pro.stock} unidades disponibles de "${pro.nombre}".`);
                return;
            }

            if (itemExistente) {
                itemExistente.cantidad = cantTotal;
            } else {
                carrito.push({
                    id_producto: pro.id,
                    nombre: pro.nombre,
                    precio: parseFloat(pro.precio),
                    stock: pro.stock,
                    imagen: pro.imagen,
                    cantidad: cant
                });
            }

            renderCarrito();
            selectPro.value = '';
            inputCantidad.value = 1;
        });
    }

    // Eventos de Tipo de Entrega (Domicilio vs Local)
    if (selectTipoEntrega) {
        selectTipoEntrega.addEventListener('change', () => {
            const tipo = selectTipoEntrega.value;
            const etiquetaEntrega = document.getElementById('etiqueta-entrega');

            if (tipo === 'local') {
                inputAumento.value = 0;
                inputAumento.readOnly = true;
                if (etiquetaEntrega) etiquetaEntrega.textContent = '🍽️ Consumo en el local ($0)';
            } else if (tipo === 'llevar') {
                inputAumento.value = 0;
                inputAumento.readOnly = true;
                if (etiquetaEntrega) etiquetaEntrega.textContent = '🛍️ Para llevar ($0)';
            } else {
                inputAumento.value = 5000;
                inputAumento.readOnly = true;
                if (etiquetaEntrega) etiquetaEntrega.textContent = '🛵 Domicilio (Fijo $5.000)';
            }
            calcularTotales();
        });
    }

    // Eventos de Descuentos
    if (selectDescuento) {
        selectDescuento.addEventListener('change', () => {
            if (selectDescuento.value === 'manual') {
                if (!esAdmin) {
                    alert("⚠️ Solo los Administradores están autorizados para aplicar descuentos manuales.");
                    selectDescuento.value = 'ninguno';
                    inputDescuento.readOnly = true;
                } else {
                    inputDescuento.readOnly = false;
                    inputDescuento.focus();
                }
            } else {
                inputDescuento.readOnly = true;
            }
            calcularTotales();
        });
    }

    // Recalcular totales en vivo
    if (inputDescuento) inputDescuento.addEventListener('input', calcularTotales);
    if (inputAumento) inputAumento.addEventListener('input', calcularTotales);

    // Enviar pedido
    if (formPedido) {
        formPedido.addEventListener('submit', async (e) => {
            e.preventDefault();
            guardarPedido();
        });
    }
}

// 4. Dibujar la tabla del carrito
function renderCarrito() {
    const tbody = document.querySelector('#tabla-carrito tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (carrito.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    <i class="fas fa-shopping-basket fa-2x mb-2 d-block text-gray-400"></i>
                    No hay productos agregados al pedido todavía.
                </td>
            </tr>
        `;
        calcularTotales();
        return;
    }

    carrito.forEach((item, index) => {
        const tr = document.createElement('tr');
        const subtotal = item.precio * item.cantidad;
        const foto = item.imagen || 'https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg';

        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${foto}" class="rounded mr-2" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.src='https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg'">
                    <strong>${item.nombre}</strong>
                </div>
            </td>
            <td>$${Number(item.precio).toLocaleString('es-CO')}</td>
            <td style="width: 140px;">
                <div class="input-group input-group-sm">
                    <div class="input-group-prepend">
                        <button class="btn btn-outline-secondary" type="button" onclick="cambiarCantidad(${index}, -1)">-</button>
                    </div>
                    <input type="text" class="form-control text-center font-weight-bold" value="${item.cantidad}" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                </div>
            </td>
            <td class="font-weight-bold text-success">$${Number(subtotal).toLocaleString('es-CO')}</td>
            <td class="text-center">
                <button type="button" class="btn btn-danger btn-sm" onclick="quitarDelCarrito(${index})" title="Quitar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    calcularTotales();
}

// 5. Aumentar o disminuir cantidad
window.cambiarCantidad = function(index, delta) {
    const item = carrito[index];
    if (!item) return;

    const nuevaCant = item.cantidad + delta;
    if (nuevaCant <= 0) {
        quitarDelCarrito(index);
        return;
    }

    if (nuevaCant > item.stock) {
        alert(`No puedes agregar más de ${item.stock} unidades de este producto.`);
        return;
    }

    item.cantidad = nuevaCant;
    renderCarrito();
};

// 6. Quitar ítem del carrito
window.quitarDelCarrito = function(index) {
    carrito.splice(index, 1);
    renderCarrito();
};

// 7. Calcular y actualizar resumen financiero habilitando descuentos según características
function calcularTotales() {
    const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const numProductosDistintos = carrito.length;

    const selectDescuento = document.getElementById('select-descuento');
    const inputDescuento = document.getElementById('descuento');
    const inputAumento = document.getElementById('aumento');
    const mensajeDescuento = document.getElementById('mensaje-descuento');
    const badgeDescuento = document.getElementById('porcentaje-descuento-aplicado');

    // Validación y Habilitación Dinámica de Opciones de Descuento
    if (selectDescuento) {
        const opt50k = selectDescuento.querySelector('option[value="promo_50k"]');
        const opt2prod = selectDescuento.querySelector('option[value="promo_2prod"]');
        const opt4uds = selectDescuento.querySelector('option[value="promo_4uds"]');

        // Promo 5%: Requiere subtotal >= 50.000
        if (opt50k) {
            if (subtotal >= 50000) {
                opt50k.disabled = false;
                opt50k.textContent = '🎁 Promo 5% (Disponible: Compras > $50.000)';
            } else {
                opt50k.disabled = true;
                opt50k.textContent = '🔒 Promo 5% (Bloqueado: Mínimo $50.000)';
                if (selectDescuento.value === 'promo_50k') selectDescuento.value = 'ninguno';
            }
        }

        // Promo 7%: Requiere 2 o más productos distintos
        if (opt2prod) {
            if (numProductosDistintos >= 2) {
                opt2prod.disabled = false;
                opt2prod.textContent = '🍔 Promo 7% (Disponible: 2+ productos distintos)';
            } else {
                opt2prod.disabled = true;
                opt2prod.textContent = '🔒 Promo 7% (Bloqueado: Requiere 2+ productos)';
                if (selectDescuento.value === 'promo_2prod') selectDescuento.value = 'ninguno';
            }
        }

        // Promo 10%: Requiere 4 o más unidades en total
        if (opt4uds) {
            if (totalUnidades >= 4) {
                opt4uds.disabled = false;
                opt4uds.textContent = '🔥 Combo Familiar 10% (Disponible: 4+ unidades)';
            } else {
                opt4uds.disabled = true;
                opt4uds.textContent = '🔒 Combo Familiar 10% (Bloqueado: Requiere 4+ unidades)';
                if (selectDescuento.value === 'promo_4uds') selectDescuento.value = 'ninguno';
            }
        }
    }

    let montoDescuento = 0;
    const promoElegida = selectDescuento ? selectDescuento.value : 'ninguno';

    if (promoElegida === 'promo_50k' && subtotal >= 50000) {
        montoDescuento = Math.round(subtotal * 0.05); // 5%
        if (mensajeDescuento) {
            mensajeDescuento.className = 'form-text text-success font-weight-bold';
            mensajeDescuento.textContent = `✅ ¡5% de descuento aplicado! Ahorras $${montoDescuento.toLocaleString('es-CO')}`;
        }
        if (inputDescuento) inputDescuento.value = montoDescuento;

    } else if (promoElegida === 'promo_2prod' && numProductosDistintos >= 2) {
        montoDescuento = Math.round(subtotal * 0.07); // 7%
        if (mensajeDescuento) {
            mensajeDescuento.className = 'form-text text-success font-weight-bold';
            mensajeDescuento.textContent = `✅ ¡7% de descuento por variedad (2+ productos)! Ahorras $${montoDescuento.toLocaleString('es-CO')}`;
        }
        if (inputDescuento) inputDescuento.value = montoDescuento;

    } else if (promoElegida === 'cliente_frecuente') {
        montoDescuento = Math.round(subtotal * 0.06); // 6%
        if (mensajeDescuento) {
            mensajeDescuento.className = 'form-text text-success font-weight-bold';
            mensajeDescuento.textContent = `✅ 6% de descuento Cliente Frecuente aplicado (-$${montoDescuento.toLocaleString('es-CO')})`;
        }
        if (inputDescuento) inputDescuento.value = montoDescuento;

    } else if (promoElegida === 'promo_4uds' && totalUnidades >= 4) {
        montoDescuento = Math.round(subtotal * 0.10); // 10%
        if (mensajeDescuento) {
            mensajeDescuento.className = 'form-text text-success font-weight-bold';
            mensajeDescuento.textContent = `✅ ¡Combo Familiar 10% aplicado! Ahorras $${montoDescuento.toLocaleString('es-CO')}`;
        }
        if (inputDescuento) inputDescuento.value = montoDescuento;

    } else if (promoElegida === 'manual') {
        montoDescuento = parseFloat(inputDescuento.value) || 0;
        if (mensajeDescuento) {
            mensajeDescuento.className = 'form-text text-muted';
            mensajeDescuento.textContent = 'Ingresa el monto de descuento personalizado en pesos ($).';
        }
    } else {
        montoDescuento = 0;
        if (inputDescuento) inputDescuento.value = 0;
        if (mensajeDescuento) {
            mensajeDescuento.className = 'form-text text-muted';
            mensajeDescuento.textContent = 'Selecciona una promoción disponible si cumples las condiciones del pedido.';
        }
    }

    const aumento = parseFloat(inputAumento ? inputAumento.value : 0) || 0;
    const total = Math.max(0, subtotal - montoDescuento + aumento);

    const elSubtotal = document.getElementById('subtotal-pedido');
    const elTotal = document.getElementById('total-pedido');

    if (elSubtotal) elSubtotal.textContent = `$${Number(subtotal).toLocaleString('es-CO')}`;
    if (badgeDescuento) badgeDescuento.textContent = `- $${Number(montoDescuento).toLocaleString('es-CO')}`;
    if (elTotal) elTotal.textContent = `$${Number(total).toLocaleString('es-CO')}`;
}

// 8. Enviar pedido a la API
async function guardarPedido() {
    const selectCliente = document.getElementById('id_cliente');
    const selectMetodo = document.getElementById('metodo_pago');
    const selectTipoEntrega = document.getElementById('tipo_entrega');
    const inputDescuento = document.getElementById('descuento');
    const inputAumento = document.getElementById('aumento');

    const idCliente = selectCliente.value;
    const metodoPago = selectMetodo.value;

    if (!idCliente) {
        alert('Por favor selecciona un cliente para el pedido.');
        selectCliente.focus();
        return;
    }

    if (!metodoPago || metodoPago === 'Seleccionar Método de Pago') {
        alert('Por favor selecciona un método de pago.');
        selectMetodo.focus();
        return;
    }

    if (carrito.length === 0) {
        alert('Debes agregar al menos un producto al pedido.');
        return;
    }

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
    const rol = (localStorage.getItem('userRole') || usuarioGuardado.rol || '').toLowerCase();
    const esAdmin = (rol === 'administrador' || rol === 'admin');

    const selectDescuento = document.getElementById('select-descuento');
    if (selectDescuento && selectDescuento.value === 'manual' && !esAdmin) {
        alert('⚠️ Solo los Administradores están autorizados para aplicar descuentos manuales.');
        return;
    }

    const datosPedido = {
        id_cliente: parseInt(idCliente),
        metodo_pago: metodoPago,
        descuento: parseFloat(inputDescuento.value) || 0,
        aumento: parseFloat(inputAumento.value) || 0,
        estado: 'Pendiente',
        productos: carrito.map(item => ({
            id_producto: item.id_producto,
            precio: item.precio,
            cantidad: item.cantidad
        }))
    };

    try {
        const respuesta = await fetch('http://localhost:3000/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosPedido)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert(`🎉 ¡Pedido #${resultado.id} creado con éxito!`);
            window.location.href = 'listado-pedidos.html';
        } else {
            alert('Error: ' + (resultado.message || 'No se pudo crear el pedido'));
        }
    } catch (error) {
        console.error('Error al enviar pedido:', error);
        alert('Error de conexión al guardar el pedido.');
    }
}
