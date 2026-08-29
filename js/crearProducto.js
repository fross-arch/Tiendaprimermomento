// Lista de productos con su imagen, categoría y precio sugerido
        const imagenes = [
            { name: "Hamburguesa", categoria: "Comidas", precio: 30000, url: "https://th.bing.com/th/id/R.c691ed37c9ce3040c3ebd2892e88870c?rik=QUBcFflN%2b9oqPQ&pid=ImgRaw&r=0" },
            { name: "Picada", categoria: "Comidas", precio: 65000, url: "https://cdn.colombia.com/gastronomia/2016/06/21/picada-colombiana-2990.jpg" },
            { name: "Pasta", categoria: "Comidas", precio: 25000, url: "https://cdn.shopify.com/s/files/1/2538/5286/products/Spaghetti-with-Meat-Sauce-Recipe-1-1200_787x787.jpg?v=1588772697" },
            { name: "Perro", categoria: "Comidas", precio: 22000, url: "https://th.bing.com/th/id/OIP.2QjcuwsTimAImo8WSQdTdAHaFp?rs=1&pid=ImgDetMain" },
            { name: "Salchipapa", categoria: "Comidas", precio: 20000, url: "https://1.bp.blogspot.com/-6lKIIVq3CXw/WK8raCAD-gI/AAAAAAABMnI/5VoCplTPogASfSZS5XzIFZizMBZ8yO8bQCLcB/s1600/salchipapa%2Bcolombiana.png" },
            { name: "Chuzo", categoria: "Comidas", precio: 22000, url: "https://th.bing.com/th/id/R.c0d3de5bd13edcc5323d074e4ba8f864?rik=lFbTsZF0ESAN5w&pid=ImgRaw&r=0" },
            { name: "Pizza", categoria: "Comidas", precio: 45000, url: "https://www.ocu.org/-/media/ocu/images/home/alimentacion/alimentos/pizzas_selector_1600x900.jpg?rev=6a81e278-07fc-4e95-9ba1-361063f35adf&hash=B8B1264AB6FC3F4B1AE140EB390208CD" },
            { name: "Pollo", categoria: "Comidas", precio: 35000, url: "https://th.bing.com/th/id/OIP.IAza-1yPPvzA55qlI0VqvQHaF7?w=744&h=595&rs=1&pid=ImgDetMain" },
            { name: "Tacos", categoria: "Comidas", precio: 26000, url: "https://th.bing.com/th/id/R.d50b293e5d2de51d349691db78f71f8c?rik=FfttXcgxjuqR%2fQ&pid=ImgRaw&r=0" },
            { name: "Burrito", categoria: "Comidas", precio: 25000, url: "https://th.bing.com/th/id/R.1a7d6f0af7be590eb4e27d96ce3530e5?rik=eiCcb%2f%2b9TYNzXQ&pid=ImgRaw&r=0" }
        ];

        // Referencias a los elementos del formulario
        const selectImagen = document.querySelector('#productos-select');
        const contenedorOtro = document.querySelector('#contenedor-otro-producto');
        const inputOtroNombre = document.querySelector('#nombre-otro-producto');
        const selectCategoria = document.querySelector('#categoria-select');
        const imagenMostrada = document.querySelector('#imagen-pro');
        const precioInput = document.querySelector("#precio-pro");
        const stockInput = document.querySelector('#stock-pro');
        const descripcionInput = document.querySelector('#descripcion-pro');
        const btnCrear = document.querySelector('#btn-crear-producto');
        const tituloForm = document.querySelector('#titulo-form');

        const inputArchivo = document.querySelector('#imagen-file');
        const inputUrl = document.querySelector('#imagen-url');
        const btnCargarUrl = document.querySelector('#btn-cargar-url');

        // Control al cambiar selección de la lista
        selectImagen.addEventListener('change', () => {
            const valor = selectImagen.value;
            if (valor === "Otro") {
                contenedorOtro.style.display = "block";
                inputOtroNombre.focus();
            } else {
                contenedorOtro.style.display = "none";
                inputOtroNombre.value = "";
                const item = imagenes.find(img => img.name.toLowerCase() === valor.toLowerCase().trim());
                if (item) {
                    imagenMostrada.src = item.url;
                    precioInput.value = item.precio;
                    selectCategoria.value = item.categoria;
                }
            }
        });

        // Función para optimizar y procesar imagen subida
        function procesarArchivoImagen(archivo, callback) {
            if (!archivo) return;
            const lector = new FileReader();
            lector.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxSize = 500;
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
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    callback(dataUrl);
                };
                img.onerror = () => {
                    callback(e.target.result);
                };
                img.src = e.target.result;
            };
            lector.readAsDataURL(archivo);
        }

        // Opción 1: Archivo desde PC
        inputArchivo.addEventListener('change', () => {
            const archivo = inputArchivo.files[0];
            if (!archivo) return;

            procesarArchivoImagen(archivo, (dataUrl) => {
                imagenMostrada.src = dataUrl;
                inputUrl.value = "";
            });
        });

        // Opción 2: Pegar URL
        btnCargarUrl.addEventListener('click', () => {
            const url = inputUrl.value.trim();
            if (!url) {
                alert("Por favor pega una URL válida de imagen.");
                return;
            }
            imagenMostrada.src = url;
            inputArchivo.value = "";
        });

        // Detectar si estamos en modo edición (?id=...)
        const params = new URLSearchParams(window.location.search);
        const idEditar = params.get('id');

        document.addEventListener('DOMContentLoaded', async () => {
            if (idEditar) {
                btnCrear.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Actualizar Producto';
                tituloForm.innerHTML = '<i class="fas fa-edit text-warning mr-2"></i>Editar Producto';

                try {
                    let respuesta = await fetch(`http://localhost:3000/api/productos/${idEditar}`);
                    if (!respuesta.ok) {
                        alert("No se pudo cargar el producto para editar");
                        return;
                    }
                    let producto = await respuesta.json();
                    if (Array.isArray(producto)) producto = producto[0];

                    // Verificar si el nombre está en la lista de opciones predefinidas
                    const nombrePro = producto.nombre || "";
                    const itemExistente = imagenes.find(img => img.name.toLowerCase() === nombrePro.toLowerCase().trim());

                    if (itemExistente) {
                        selectImagen.value = itemExistente.name;
                        contenedorOtro.style.display = "none";
                        inputOtroNombre.value = "";
                    } else {
                        selectImagen.value = "Otro";
                        contenedorOtro.style.display = "block";
                        inputOtroNombre.value = nombrePro;
                    }

                    selectCategoria.value = producto.categoria || "Comidas";
                    precioInput.value = producto.precio || "";
                    stockInput.value = producto.stock || 0;
                    descripcionInput.value = producto.descripcion || "";
                    if (producto.imagen) {
                        imagenMostrada.src = producto.imagen;
                    }

                } catch (error) {
                    alert("Error de conexión al cargar datos del producto");
                    console.error(error);
                }
            }
        });

        // Botón Guardar / Actualizar
        btnCrear.addEventListener('click', async () => {
            let nombre = "";
            if (selectImagen.value === "Otro") {
                nombre = inputOtroNombre.value.trim();
                if (!nombre) {
                    alert("Por favor escribe el nombre del nuevo producto.");
                    inputOtroNombre.focus();
                    return;
                }
            } else {
                nombre = selectImagen.value;
                if (!nombre) {
                    alert("Por favor selecciona un producto o elige 'Otro'.");
                    selectImagen.focus();
                    return;
                }
            }

            const categoria = selectCategoria.value;
            const precio = parseFloat(precioInput.value);
            const stock = parseInt(stockInput.value, 10);
            const descripcion = descripcionInput.value.trim();
            const imagen = imagenMostrada.src;

            if (!categoria) {
                alert("Por favor selecciona una categoría.");
                selectCategoria.focus();
                return;
            }

            if (isNaN(precio) || precio < 0) {
                alert("Por favor ingresa un precio válido.");
                precioInput.focus();
                return;
            }

            if (isNaN(stock) || stock < 0) {
                alert("Por favor ingresa una cantidad de stock válida.");
                stockInput.focus();
                return;
            }

            const datosProducto = {
                nombre: nombre,
                categoria: categoria,
                descripcion: descripcion,
                precio: precio,
                stock: stock,
                imagen: imagen
            };

            try {
                let url = "http://localhost:3000/api/productos";
                let metodo = "POST";

                if (idEditar) {
                    url = `http://localhost:3000/api/productos/${idEditar}`;
                    metodo = "PUT";
                }

                let respuesta = await fetch(url, {
                    method: metodo,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datosProducto)
                });

                const resultado = await respuesta.json();

                if (!respuesta.ok) {
                    alert("Error: " + (resultado.message || "No se pudo procesar la solicitud"));
                    return;
                }

                alert(idEditar ? "¡Producto actualizado con éxito!" : "¡Producto creado con éxito!");
                window.location.href = "listado-pro.html";

            } catch (error) {
                alert("Error al conectar con el servidor.");
                console.error(error);
            }
        });