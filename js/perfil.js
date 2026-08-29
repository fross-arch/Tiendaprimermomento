 let imagenPerfilSeleccionada = '';
        let currentUser = null;

        document.addEventListener('DOMContentLoaded', () => {
            cargarDatosPerfil();
            configurarEventosAvatar();
        });

        // 1. Cargar datos del usuario actual
        async function cargarDatosPerfil() {
            currentUser = JSON.parse(localStorage.getItem('userLogin'));
            if (!currentUser) {
                window.location.href = 'login.html';
                return;
            }

            const rol = (currentUser.rol || '').toLowerCase();
            const esCliente = (rol === 'cliente');

            imagenPerfilSeleccionada = currentUser.imagen || 'img/undraw_profile.svg';

            // Actualizar Tarjeta Izquierda
            document.getElementById('card-perfil-img').src = imagenPerfilSeleccionada;
            document.getElementById('card-perfil-nombre').textContent = currentUser.usuario || 'Usuario';
            
            const badge = document.getElementById('card-perfil-badge');
            const rolTexto = rol.charAt(0).toUpperCase() + rol.slice(1);
            let badgeClass = 'badge-primary';
            if (rol === 'administrador') badgeClass = 'badge-danger';
            else if (rol === 'vendedor') badgeClass = 'badge-success';
            else if (rol === 'cajero') badgeClass = 'badge-warning';
            else if (rol === 'cliente') badgeClass = 'badge-info';

            badge.innerHTML = '<span class="badge ' + badgeClass + ' px-3 py-2 text-uppercase font-weight-bold">' + rolTexto + '</span>';

            // Formulario
            if (esCliente) {
                document.getElementById('campos-cliente').style.display = 'block';
                document.getElementById('grupo-apellido').style.display = 'block';

                const partesNombre = (currentUser.usuario || '').split(' ');
                document.getElementById('perfil-nombre').value = partesNombre[0] || '';
                document.getElementById('perfil-apellido').value = partesNombre.slice(1).join(' ') || '';
                document.getElementById('perfil-email').value = currentUser.email || '';

                if (currentUser.id) {
                    try {
                        const res = await fetch('http://localhost:3000/api/clientes/' + currentUser.id);
                        if (res.ok) {
                            const clienteDB = await res.json();
                            document.getElementById('perfil-nombre').value = clienteDB.nombre || '';
                            document.getElementById('perfil-apellido').value = clienteDB.apellido || '';
                            document.getElementById('perfil-email').value = clienteDB.email || '';
                            document.getElementById('perfil-celular').value = clienteDB.celular || '';
                            document.getElementById('perfil-direccion').value = clienteDB.direccion || '';
                            if (clienteDB.imagen) {
                                imagenPerfilSeleccionada = clienteDB.imagen;
                                document.getElementById('card-perfil-img').src = imagenPerfilSeleccionada;
                            }
                            document.getElementById('card-perfil-email').textContent = clienteDB.email || '';
                        }
                    } catch (err) {
                        console.error('Error al obtener cliente DB:', err);
                    }
                }
            } else {
                document.getElementById('campos-cliente').style.display = 'none';
                document.getElementById('grupo-apellido').style.display = 'none';
                document.getElementById('perfil-nombre').value = currentUser.usuario || '';
            }
        }

        // Función para optimizar y comprimir imagen subida (reduce fotos de 5MB a ~30KB)
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
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    callback(dataUrl);
                };
                img.onerror = () => {
                    callback(e.target.result);
                };
                img.src = e.target.result;
            };
            lector.readAsDataURL(archivo);
        }

        // 2. Selección de foto de perfil
        function configurarEventosAvatar() {
            const previewCard = document.getElementById('card-perfil-img');
            const inputUrl = document.getElementById('perfil-url');
            const inputFile = document.getElementById('perfil-file');

            document.querySelectorAll('.perfil-avatar-item').forEach(item => {
                item.addEventListener('click', () => {
                    imagenPerfilSeleccionada = item.getAttribute('data-src');
                    previewCard.src = imagenPerfilSeleccionada;
                    inputUrl.value = '';
                    inputFile.value = '';
                });
            });

            inputUrl.addEventListener('input', () => {
                if (inputUrl.value.trim() !== '') {
                    imagenPerfilSeleccionada = inputUrl.value.trim();
                    previewCard.src = imagenPerfilSeleccionada;
                    inputFile.value = '';
                }
            });

            inputFile.addEventListener('change', () => {
                const archivo = inputFile.files[0];
                if (archivo) {
                    procesarArchivoImagen(archivo, (dataUrl) => {
                        imagenPerfilSeleccionada = dataUrl;
                        previewCard.src = imagenPerfilSeleccionada;
                        inputUrl.value = '';
                    });
                }
            });
        }

        // 3. Guardar cambios en el perfil
        document.getElementById('formulario-perfil').addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = document.getElementById('perfil-password').value;
            const repeatPassword = document.getElementById('perfil-repeat-password').value;

            if (password && password !== repeatPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }

            const rol = (currentUser.rol || '').toLowerCase();
            const esCliente = (rol === 'cliente');
            const idTarget = currentUser.id_cliente || currentUser.id;

            try {
                if (esCliente) {
                    const nombre = document.getElementById('perfil-nombre').value.trim();
                    const apellido = document.getElementById('perfil-apellido').value.trim();
                    const email = document.getElementById('perfil-email').value.trim();
                    const celular = document.getElementById('perfil-celular').value.trim();
                    const direccion = document.getElementById('perfil-direccion').value.trim();

                    const datosActualizar = {
                        nombre,
                        apellido,
                        email,
                        celular,
                        direccion,
                        direccion2: '',
                        descripcion: '',
                        imagen: imagenPerfilSeleccionada
                    };

                    if (password) {
                        datosActualizar.contrasena = password;
                    }

                    const res = await fetch('http://localhost:3000/api/clientes/' + idTarget, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datosActualizar)
                    });

                    if (res.ok) {
                        currentUser.usuario = (nombre + ' ' + apellido).trim();
                        currentUser.nombre = nombre;
                        currentUser.apellido = apellido;
                        currentUser.email = email;
                        currentUser.celular = celular;
                        currentUser.direccion = direccion;
                        currentUser.imagen = imagenPerfilSeleccionada;
                        localStorage.setItem('userLogin', JSON.stringify(currentUser));
                        localStorage.setItem('usuario', JSON.stringify(currentUser));

                        alert('¡Perfil de cliente actualizado con éxito!');
                        window.location.reload();
                    } else {
                        const err = await res.json();
                        alert('Error: ' + (err.message || 'No se pudo actualizar el perfil'));
                    }
                } else {
                    const nuevoUsuario = document.getElementById('perfil-nombre').value.trim();
                    const datosActualizar = {
                        rol: currentUser.rol,
                        usuario: nuevoUsuario,
                        imagen: imagenPerfilSeleccionada
                    };

                    if (password) {
                        datosActualizar.contrasena = password;
                    }

                    const res = await fetch('http://localhost:3000/api/usuarios/' + idTarget, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datosActualizar)
                    });

                    if (res.ok) {
                        currentUser.usuario = nuevoUsuario;
                        currentUser.nombre = nuevoUsuario;
                        currentUser.imagen = imagenPerfilSeleccionada;
                        localStorage.setItem('userLogin', JSON.stringify(currentUser));
                        localStorage.setItem('usuario', JSON.stringify(currentUser));

                        alert('¡Perfil actualizado con éxito!');
                        window.location.reload();
                    } else {
                        const err = await res.json();
                        alert('Error: ' + (err.message || 'No se pudo actualizar el perfil'));
                    }
                }
            } catch (error) {
                console.error('Error al actualizar perfil:', error);
                alert('Error al conectar con el servidor backend');
            }
        });