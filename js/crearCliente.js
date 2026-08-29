  // Guardar la imagen elegida
        let imagenSeleccionada = 'img/undraw_profile_2.svg';

        const avatarPreview = document.getElementById('avatar-preview');
        const inputUrl = document.getElementById('avatar-url');
        const inputFile = document.getElementById('avatar-file');
        const itemsGaleria = document.querySelectorAll('.avatar-item');

        // 1. Clic en avatar de la galería
        itemsGaleria.forEach(item => {
            item.addEventListener('click', () => {
                imagenSeleccionada = item.getAttribute('data-src');
                avatarPreview.src = imagenSeleccionada;
                inputUrl.value = '';
                inputFile.value = '';

                // Resaltar seleccionado
                itemsGaleria.forEach(i => i.style.border = '1px solid #dee2e6');
                item.style.border = '3px solid #4e73df';
            });
        });

        // 2. Si escribe o pega un link URL
        inputUrl.addEventListener('input', () => {
            if (inputUrl.value.trim() !== '') {
                imagenSeleccionada = inputUrl.value.trim();
                avatarPreview.src = imagenSeleccionada;
                inputFile.value = '';
                itemsGaleria.forEach(i => i.style.border = '1px solid #dee2e6');
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
                    const maxSize = 400;
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

        // 3. Si examina y sube un archivo desde el computador / navegador
        inputFile.addEventListener('change', () => {
            const archivo = inputFile.files[0];
            if (archivo) {
                procesarArchivoImagen(archivo, (dataUrl) => {
                    imagenSeleccionada = dataUrl;
                    avatarPreview.src = imagenSeleccionada;
                    inputUrl.value = '';
                    itemsGaleria.forEach(i => i.style.border = '1px solid #dee2e6');
                });
            }
        });

        // 4. Enviar formulario a la API
        const formularioCliente = document.getElementById('formulario-cliente');
        formularioCliente.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre-cli').value.trim();
            const apellido = document.getElementById('apellido-cli').value.trim();
            const email = document.getElementById('email-cli').value.trim();
            const celular = document.getElementById('celular-cli').value.trim();
            const direccion = document.getElementById('direccion-cli').value.trim();
            const direccion2 = document.getElementById('direccion2-cli').value.trim();
            const descripcion = document.getElementById('descripcion-cli').value.trim();

            const datosCliente = {
                nombre: nombre,
                apellido: apellido,
                email: email,
                celular: celular,
                direccion: direccion,
                direccion2: direccion2,
                descripcion: descripcion,
                imagen: imagenSeleccionada
            };

            try {
                const respuesta = await fetch('http://localhost:3000/api/clientes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datosCliente)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    alert('¡Cliente registrado con éxito!');
                    window.location.href = 'listado-clientes.html';
                } else {
                    alert('Error: ' + (resultado.message || 'No se pudo crear el cliente'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al conectar con el servidor backend.');
            }
        });