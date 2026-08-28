// Variable global
let listadoPro = document.getElementById("tabla-pro");

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
                "Content-Type": "application/json" // Corregido el orden
            }
        });

        let products = await data.json();
        console.log("Productos:", products);

        // Limpiar la tabla antes de renderizar (evita duplicados si se vuelve a llamar)
        listadoPro.innerHTML = "";

        // Mostrar información al usuario
        products.forEach((pro, i) => {
            let fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${i + 1}</td>
                <td>${pro.nombre}</td>
                <td>${pro.descripcion}</td>
                <td>$${pro.precio}</td>
                <td>${pro.stock}</td>
                <td>
                    <img src="${pro.imagen}" width="60px" class="img-thumbnail" alt="${pro.nombre}">
                </td>
                <td>
                    <button class="btn btn-warning btn-sm">✍️ Edit</button>
                    <button class="btn btn-danger btn-sm">❌ Delete</button>
                </td>
            `; 
            listadoPro.appendChild(fila);
        });

    } catch (error) {
        console.log("Error al obtener productos:", error);
    }
}