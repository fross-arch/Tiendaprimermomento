// Variables globales
let listadoPro = document.getElementById("tabla-pro");
let tabsCategoria = document.getElementById("categoria-tabs");
let inputBusqueda = document.getElementById("searchInput");

let todosLosProductos = [];
let categoriaActiva = "Todas";

document.addEventListener("DOMContentLoaded", () => {
    // Si viene parámetro de búsqueda en URL ?buscar=...
    const params = new URLSearchParams(window.location.search);
    const busquedaInicial = params.get('buscar') || '';
    if (inputBusqueda && busquedaInicial) {
        inputBusqueda.value = busquedaInicial;
    }

    getProducts();
});

async function getProducts() {
    try {
        let url = "http://localhost:3000/api/productos";
        let respuesta = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!respuesta.ok) {
            console.error("Error al obtener productos");
            return;
        }

        todosLosProductos = await respuesta.json();
        aplicarFiltros();

    } catch (error) {
        console.error("Error al conectar con la API:", error);
    }
}

// Dibuja la tabla a partir de una lista de productos
function renderProductos(lista) {
    if (!listadoPro) return;
    listadoPro.innerHTML = "";

    // Obtener rol del usuario
    const user = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
    const rol = (localStorage.getItem('userRole') || user.rol || '').toLowerCase();
    const esAdmin = (rol === 'administrador' || rol === 'admin');
    const esCliente = (rol === 'cliente');

    if (lista.length === 0) {
        listadoPro.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle fa-2x mb-2 d-block text-gray-400"></i>
                    No se encontraron productos registrados o que coincidan con el filtro.
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach((pro, i) => {
        let fila = document.createElement("tr");
        const precioFormateado = Number(pro.precio).toLocaleString('es-CO');
        const foto = pro.imagen || 'https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg';
        const categoria = pro.categoria || 'Comidas';
        
        let badgeClass = 'badge-primary';
        if (categoria === 'Bebidas') badgeClass = 'badge-info';
        if (categoria === 'Postres') badgeClass = 'badge-warning';

        const stock = parseInt(pro.stock || 0, 10);
        const hayStock = stock > 0;

        // Acciones según rol:
        // - Cliente: Botón "Pedir" si hay stock, o "Sin Stock" si está agotado
        // - Admin: "Editar" y "Eliminar"
        // - Vendedor / Cajero: Solo "Editar"
        let accionesHtml = '';
        if (esCliente) {
            if (hayStock) {
                accionesHtml = `
                    <a href="crear-pedido.html" class="btn btn-sm btn-success shadow-sm font-weight-bold">
                        <i class="fas fa-cart-plus mr-1"></i> Pedir
                    </a>
                `;
            } else {
                accionesHtml = `
                    <span class="badge badge-secondary p-2 shadow-sm font-weight-bold">
                        <i class="fas fa-ban mr-1"></i> Sin Stock
                    </span>
                `;
            }
        } else if (esAdmin) {
            accionesHtml = `
                <button class="btn-editar mr-1 shadow-sm" data-id="${pro.id}" title="Editar Producto">✍️ Editar</button>
                <button class="btn-eliminar shadow-sm" data-id="${pro.id}" title="Eliminar Producto">❌ Eliminar</button>
            `;
        } else {
            accionesHtml = `
                <button class="btn-editar shadow-sm" data-id="${pro.id}" title="Editar Producto">✍️ Editar</button>
            `;
        }

        let badgeStock = '';
        if (stock <= 0) {
            badgeStock = '<span class="badge badge-danger p-2 font-weight-bold">Agotado (0 un.)</span>';
        } else if (stock <= 5) {
            badgeStock = `<span class="badge badge-warning p-2 font-weight-bold">${stock} un. (Bajo)</span>`;
        } else {
            badgeStock = `<span class="badge badge-success p-2 font-weight-bold">${stock} un.</span>`;
        }

        fila.innerHTML = `
            <td>${i + 1}</td>
            <td>
                <img src="${foto}" class="img-thumbnail img-miniatura-pro" alt="${pro.nombre}" onerror="this.src='https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg'">
            </td>
            <td><strong>${pro.nombre}</strong></td>
            <td><span class="badge ${badgeClass} text-capitalize">${categoria}</span></td>
            <td><small class="text-muted">${pro.descripcion || 'Sin descripción'}</small></td>
            <td class="font-weight-bold text-success">${precioFormateado}</td>
            <td>${badgeStock}</td>
            <td class="text-center" style="white-space: nowrap;">
                ${accionesHtml}
            </td>
        `;
        listadoPro.appendChild(fila);
    });
}

// Aplica simultáneamente el filtro de categoría y el de texto
function aplicarFiltros() {
    let filtrados = todosLosProductos;

    // 1. Filtro por categoría
    if (categoriaActiva !== "Todas") {
        filtrados = filtrados.filter(pro => (pro.categoria || 'Comidas') === categoriaActiva);
    }

    // 2. Filtro por texto
    const texto = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : '';
    if (texto !== '') {
        filtrados = filtrados.filter(pro => 
            pro.nombre.toLowerCase().includes(texto) || 
            (pro.descripcion && pro.descripcion.toLowerCase().includes(texto))
        );
    }

    renderProductos(filtrados);
}

// Clic en las pestañas de categoría
if (tabsCategoria) {
    tabsCategoria.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = e.target.closest(".nav-link");
        if (!tab) return;

        tabsCategoria.querySelectorAll(".nav-link").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        categoriaActiva = tab.getAttribute("data-categoria");
        aplicarFiltros();
    });
}

// Búsqueda en tiempo real
if (inputBusqueda) {
    inputBusqueda.addEventListener("input", () => {
        aplicarFiltros();
    });
}

// Delegación de eventos para Editar y Eliminar
if (listadoPro) {
    listadoPro.addEventListener("click", async (e) => {
        const btnEliminar = e.target.closest(".btn-eliminar");
        const btnEditar = e.target.closest(".btn-editar");

        // ELIMINAR
        if (btnEliminar) {
            const user = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('userLogin') || '{}');
            const rol = (localStorage.getItem('userRole') || user.rol || '').toLowerCase();
            const esAdmin = (rol === 'administrador' || rol === 'admin');

            if (!esAdmin) {
                alert('⚠️ Solo los Administradores tienen permisos para eliminar productos.');
                return;
            }
            const id = btnEliminar.getAttribute("data-id");
            const confirmar = confirm("¿Estás seguro de que deseas eliminar este producto?");
            if (!confirmar) return;

            try {
                let respuesta = await fetch(`http://localhost:3000/api/productos/${id}`, {
                    method: "DELETE"
                });

                if (respuesta.ok) {
                    alert("¡Producto eliminado con éxito!");
                    getProducts();
                } else {
                    const res = await respuesta.json();
                    alert("Error al eliminar: " + (res.message || "No se pudo completar la acción"));
                }
            } catch (error) {
                alert("Error de conexión con el servidor");
                console.error(error);
            }
        }

        // EDITAR (Redirige con id)
        if (btnEditar) {
            const id = btnEditar.getAttribute("data-id");
            window.location.href = `crear-pro.html?id=${id}`;
        }
    });
}
