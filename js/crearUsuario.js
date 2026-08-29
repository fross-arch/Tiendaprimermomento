// Guardar la imagen elegida (por defecto el avatar azul)
        let imagenSeleccionada = 'img/undraw_profile.svg';

        const avatarPreview = document.getElementById('avatar-preview');
        const inputUrl = document.getElementById('avatar-url');
        const inputFile = document.getElementById('avatar-file');
        const itemsGaleria = document.querySelectorAll('.avatar-item');

        // 1. Clic en cualquier avatar de la galería visual
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
        const formularioUsuario = document.getElementById('formulario-usuario');
        formularioUsuario.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rol = document.getElementById('rol').value;
            const usuario = document.getElementById('usuario').value.trim();
            const contrasena = document.getElementById('contrasena').value;
            const confirmar_contrasena = document.getElementById('confirmar_contrasena').value;

            // Validar contraseñas
            if (contrasena !== confirmar_contrasena) {
                alert('Las contraseñas no coinciden. Por favor verifica.');
                return;
            }

            const datosUsuario = {
                rol: rol,
                usuario: usuario,
                contrasena: contrasena,
                imagen: imagenSeleccionada
            };

            try {
                const respuesta = await fetch('http://localhost:3000/api/usuarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datosUsuario)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    alert('¡Usuario creado con éxito!');
                    window.location.href = 'listado-usuarios.html';
                } else {
                    alert('Error: ' + (resultado.message || 'No se pudo crear el usuario'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al conectar con el servidor.');
            }
        });