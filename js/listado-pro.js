// Variable global
let listadoPro = document.getElementById("tabla-pro");
let todosLosProductos = [];

// Agregar evento para detectar cuando se recargue la página
document.addEventListener("DOMContentLoaded", () => {
    getProducts();
});

// Función para obtener los datos de la API
async function getProducts() {
    try {
        let url = "http://localhost:3000/api/productos";
        let data = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        todosLosProductos = await data.json();
        renderizarTablaProductos(todosLosProductos);

        // Si la URL trae un parámetro de búsqueda, aplicarlo de inmediato
        const urlParams = new URLSearchParams(window.location.search);
        const termino = urlParams.get('buscar');
        if (termino) {
            const inputs = document.querySelectorAll('.navbar-search input[type="text"]');
            inputs.forEach(inp => inp.value = termino);
            window.filtrarTablaProductosEnVivo(termino);
        }
        console.log("Error al obtener productos:", error);
    }
}

// Renderizar tabla de productos
function renderizarTablaProductos(productos) {
    if (!listadoPro) return;
    listadoPro.innerHTML = "";

    if (productos.length === 0) {
        listadoPro.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No se encontraron productos</td></tr>`;
        return;
    }

    productos.forEach((pro, i) => {
        let fila = document.createElement("tr");
        const precioFormatted = Number(pro.precio || 0).toLocaleString('es-CO');
        fila.innerHTML = `
            <td>${i + 1}</td>
            <td><strong>${pro.nombre}</strong></td>
            <td>${pro.descripcion || '-'}</td>
            <td class="text-success font-weight-bold">$${precioFormatted}</td>
            <td><span class="badge badge-info">${pro.stock}</span></td>
            <td>
                <img src="${pro.imagen || 'img/undraw_profile.svg'}" width="50px" height="50px" class="img-thumbnail rounded" style="object-fit: cover;" alt="${pro.nombre}">
            </td>
            <td>
                <button class="btn btn-warning btn-sm mr-1" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        `; 
        listadoPro.appendChild(fila);
    });
}

// Filtro en vivo invocado desde la barra de búsqueda superior
window.filtrarTablaProductosEnVivo = (query) => {
    if (!todosLosProductos || todosLosProductos.length === 0) return;
    const q = query.trim().toLowerCase();
    const filtrados = todosLosProductos.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(q)) || 
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
    renderizarTablaProductos(filtrados);
};