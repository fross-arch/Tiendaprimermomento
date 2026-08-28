// Variable global
let listadoPro = document.getElementById("tabla-pro");
let tabsCategoria = document.getElementById("categoria-tabs");

// Guardamos todos los productos aquí para poder filtrarlos sin volver a pedirlos al servidor
let todosLosProductos = [];
let categoriaActiva = "Todas";

document.addEventListener("DOMContentLoaded", () => {
    getProducts();
});

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
        console.log("Productos:", todosLosProductos);

        renderProductos(todosLosProductos);

    } catch (error) {
        console.log("Error al obtener productos:", error);
    }
}

// Dibuja la tabla a partir de una lista de productos ya filtrada (o completa)
function renderProductos(lista) {
    listadoPro.innerHTML = "";

    lista.forEach((pro, i) => {
        let fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${i + 1}</td>
            <td>${pro.nombre}</td>
            <td>${pro.categoria || ""}</td>
            <td>${pro.descripcion}</td>
            <td>$${pro.precio}</td>
            <td>${pro.stock}</td>
            <td>
                <img src="${pro.imagen}" class="img-thumbnail img-miniatura-pro" alt="${pro.nombre}">
            </td>
            <td>
                <button class="btn btn-warning btn-sm btn-editar" data-id="${pro.id}">✍️ Edit</button>
                <button class="btn btn-danger btn-sm btn-eliminar" data-id="${pro.id}">❌ Delete</button>
            </td>
        `;
        listadoPro.appendChild(fila);
    });
}

// Filtra por categoría y vuelve a dibujar la tabla
function filtrarPorCategoria(categoria) {
    categoriaActiva = categoria;

    if (categoria === "Todas") {
        renderProductos(todosLosProductos);
    } else {
        const filtrados = todosLosProductos.filter(pro => pro.categoria === categoria);
        renderProductos(filtrados);
    }
}

// Clic en las pestañas de categoría
tabsCategoria.addEventListener("click", (e) => {
    e.preventDefault();
    if (!e.target.classList.contains("nav-link")) return;

    // Quitamos "active" de todas las pestañas y se lo ponemos solo a la clickeada
    tabsCategoria.querySelectorAll(".nav-link").forEach(tab => tab.classList.remove("active"));
    e.target.classList.add("active");

    const categoria = e.target.getAttribute("data-categoria");
    filtrarPorCategoria(categoria);
});

// Delegación de eventos: escucha clics en TODA la tabla,
// y verifica si el clic fue en un botón editar o eliminar
listadoPro.addEventListener("click", async (e) => {

    // ELIMINAR
    if (e.target.classList.contains("btn-eliminar")) {
        const id = e.target.getAttribute("data-id");
        const confirmar = confirm("¿Seguro que quieres eliminar este producto?");
        if (!confirmar) return;

        try {
            let respuesta = await fetch(`http://localhost:3000/api/productos/${id}`, {
                method: "DELETE"
            });

            if (!respuesta.ok) {
                alert("Error al eliminar el producto");
                return;
            }

            alert("Producto eliminado con éxito");
            getProducts(); // recarga la tabla completa (respeta el filtro activo al recargar solo si quieres, ver nota abajo)
        } catch (error) {
            alert("Error de conexión con el servidor");
            console.error(error);
        }
    }

    // EDITAR
    if (e.target.classList.contains("btn-editar")) {
        const id = e.target.getAttribute("data-id");
        window.location.href = `crear-pro.html?id=${id}`;
    }
});
// Referencia al buscador de productos
let inputBusqueda = document.getElementById("searchInput");

// Filtra por texto Y respeta la categoría activa al mismo tiempo
inputBusqueda.addEventListener("input", () => {
    const texto = inputBusqueda.value.toLowerCase().trim();

    // Partimos de los productos según la categoría activa
    let base = categoriaActiva === "Todas"
        ? todosLosProductos
        : todosLosProductos.filter(pro => pro.categoria === categoriaActiva);

    // Sobre esa base, filtramos por texto en el nombre
    const filtrados = base.filter(pro => pro.nombre.toLowerCase().includes(texto));

    renderProductos(filtrados);
});