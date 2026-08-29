 const tablaUsuarios = document.getElementById('tabla-usuarios');
        let listaUsuariosCache = [];
        let editUsrImagenSeleccionada = '';

        document.addEventListener('DOMContentLoaded', () => {
            cargarUsuarios();
            configurarEventosImagenUsuarioEdit();
        });

        // 1. Cargar lista de usuarios
        async function cargarUsuarios() {
            try {
                const respuesta = await fetch('http://localhost:3000/api/usuarios');
                const usuarios = await respuesta.json();
                listaUsuariosCache = usuarios;

                tablaUsuarios.innerHTML = '';

                usuarios.forEach((usr, index) => {
                    const fila = document.createElement('tr');
                    const foto = usr.imagen || 'img/undraw_profile.svg';
                    fila.innerHTML = `
                        <td>${index + 1}</td>
                        <td>
                            <img src="${foto}" width="40" height="40" class="rounded-circle img-thumbnail" style="object-fit: cover;" onerror="this.src='img/undraw_profile.svg'">
                        </td>
                        <td><strong>${usr.usuario}</strong></td>
                        <td><span class="badge badge-primary text-capitalize">${usr.rol}</span></td>
                        <td>
                            <button class="btn btn-warning btn-sm mr-1" onclick="abrirModalEditarUsuario(${usr.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${usr.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tablaUsuarios.appendChild(fila);
                });
            } catch (error) {
                console.error('Error al cargar usuarios:', error);
            }
        }

        // 2. Abrir modal para editar
        function abrirModalEditarUsuario(id) {
            const usuario = listaUsuariosCache.find(u => u.id == id);
            if (!usuario) return;

            document.getElementById('edit-usr-id').value = usuario.id;
            document.getElementById('edit-usr-rol').value = usuario.rol;
            document.getElementById('edit-usr-usuario').value = usuario.usuario;
            document.getElementById('edit-usr-contrasena').value = '';

            editUsrImagenSeleccionada = usuario.imagen || 'img/undraw_profile.svg';
            document.getElementById('edit-usr-preview').src = editUsrImagenSeleccionada;
            document.getElementById('edit-usr-url').value = '';
            document.getElementById('edit-usr-file').value = '';

            $('#modalEditarUsuario').modal('show');
        }

        // 3. Configurar eventos de imagen en modal
        function configurarEventosImagenUsuarioEdit() {
            const preview = document.getElementById('edit-usr-preview');
            const inputUrl = document.getElementById('edit-usr-url');
            const inputFile = document.getElementById('edit-usr-file');
            const items = document.querySelectorAll('.modal-usr-avatar-item');

            items.forEach(item => {
                item.addEventListener('click', () => {
                    editUsrImagenSeleccionada = item.getAttribute('data-src');
                    preview.src = editUsrImagenSeleccionada;
                    inputUrl.value = '';
                    inputFile.value = '';
                });
            });

            inputUrl.addEventListener('input', () => {
                if (inputUrl.value.trim() !== '') {
                    editUsrImagenSeleccionada = inputUrl.value.trim();
                    preview.src = editUsrImagenSeleccionada;
                    inputFile.value = '';
                }
            });

            inputFile.addEventListener('change', () => {
                const archivo = inputFile.files[0];
                if (archivo) {
                    const lector = new FileReader();
                    lector.onload = (e) => {
                        editUsrImagenSeleccionada = e.target.result;
                        preview.src = editUsrImagenSeleccionada;
                        inputUrl.value = '';
                    };
                    lector.readAsDataURL(archivo);
                }
            });
        }

        // 4. Guardar cambios (PUT)
        document.getElementById('formulario-editar-usuario').addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('edit-usr-id').value;
            const rol = document.getElementById('edit-usr-rol').value;
            const usuario = document.getElementById('edit-usr-usuario').value.trim();
            const contrasena = document.getElementById('edit-usr-contrasena').value;

            const datosActualizados = {
                rol: rol,
                usuario: usuario,
                imagen: editUsrImagenSeleccionada
            };

            if (contrasena) {
                datosActualizados.contrasena = contrasena;
            }

            try {
                const respuesta = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosActualizados)
                });

                if (respuesta.ok) {
                    alert('Usuario actualizado con éxito');
                    $('#modalEditarUsuario').modal('hide');
                    cargarUsuarios();
                } else {
                    const error = await respuesta.json();
                    alert('Error al actualizar: ' + (error.message || 'Intente nuevamente'));
                }
            } catch (err) {
                console.error(err);
                alert('Error al conectar con el servidor');
            }
        });

        // 5. Eliminar usuario (DELETE)
        async function eliminarUsuario(id) {
            if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
                try {
                    const respuesta = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
                        method: 'DELETE'
                    });
                    if (respuesta.ok) {
                        alert('Usuario eliminado con éxito');
                        cargarUsuarios();
                    } else {
                        alert('No se pudo eliminar el usuario');
                    }
                } catch (error) {
                    alert('Error al eliminar usuario');
                }
            }
        }