  let imagenSeleccionada = 'img/undraw_profile.svg';

        // Selección de avatar
        document.querySelectorAll('.reg-avatar').forEach(img => {
            img.addEventListener('click', () => {
                imagenSeleccionada = img.getAttribute('data-src');
                document.getElementById('reg-preview').src = imagenSeleccionada;
            });
        });

        // Enviar formulario de registro
        document.getElementById('form-registro-cliente').addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('reg-nombre').value.trim();
            const apellido = document.getElementById('reg-apellido').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const celular = document.getElementById('reg-celular').value.trim();
            const direccion = document.getElementById('reg-direccion').value.trim();
            const password = document.getElementById('reg-password').value;
            const repeatPassword = document.getElementById('reg-repeat-password').value;

            if (password !== repeatPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }

            const nuevoCliente = {
                nombre,
                apellido,
                email,
                contrasena: password,
                celular,
                direccion,
                direccion2: '',
                descripcion: 'Cliente registrado desde la web',
                imagen: imagenSeleccionada
            };

            try {
                const res = await fetch('http://localhost:3000/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoCliente)
                });

                const data = await res.json();

                if (res.ok) {
                    alert('¡Registro exitoso! Iniciando sesión...');
                    // Iniciar sesión automáticamente
                    const loginRes = await fetch('http://localhost:3000/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ usuario: email, contrasena: password })
                    });
                    if (loginRes.ok) {
                        const userRegistered = await loginRes.json();
                        localStorage.setItem('userLogin', JSON.stringify(userRegistered));
                        window.location.href = 'index.html';
                    } else {
                        window.location.href = 'login.html';
                    }
                } else {
                    alert('Error: ' + (data.message || 'No se pudo completar el registro'));
                }
            } catch (error) {
                console.error('Error al registrar cliente:', error);
                alert('Error al conectar con el servidor backend');
            }
        });