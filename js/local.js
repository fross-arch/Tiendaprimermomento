// local.js - Manejo de sesión y permisos por rol (Anti-parpadeo instantáneo)

// 1. Inyección INMEDIATA de estilos antes de que la página se pinte (Elimina parpadeos al refrescar)
(function aplicarEstilosAnticipados() {
    const userStr = localStorage.getItem('userLogin') || localStorage.getItem('usuario');
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const rol = (user.rol || localStorage.getItem('userRole') || '').toLowerCase();
        
        let css = '#imagenPerfil { opacity: 0; transition: opacity 0.15s ease; } ';

        if (rol !== 'administrador') {
            css += '#nav-usuarios, #collapseUsuarios, #card-usuarios, a[data-target="#collapseUsuarios"], a[href="listado-usuarios.html"], a[href="crear-usuario.html"] { display: none !important; } ';
            css += 'li:has(#collapseUsuarios), li:has(a[data-target="#collapseUsuarios"]), li:has(a[href="reportes.html"]) { display: none !important; } ';
        }

        if (rol === 'vendedor' || rol === 'cajero' || rol === 'cliente') {
            css += 'a[href="crear-pro.html"], #link-crear-sidebar { display: none !important; } ';
        }

        if (rol === 'cajero' || rol === 'cliente') {
            css += 'a[href="crear-cliente.html"] { display: none !important; } ';
        }

        if (rol === 'cliente') {
            css += '#nav-clientes, #collapseClientes, #card-clientes, a[data-target="#collapseClientes"], a[href="listado-clientes.html"], a[href="crear-cliente.html"], a[href="reportes.html"] { display: none !important; } ';
            css += 'li:has(#collapseClientes), li:has(a[data-target="#collapseClientes"]), li:has(a[href="reportes.html"]) { display: none !important; } ';
            css += '.btn-editar, .btn-eliminar { display: none !important; } ';
        }

        const style = document.createElement('style');
        style.id = 'estilos-permisos-rol';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    } catch (e) {
        console.error("Error al pre-cargar estilos:", e);
    }
})();

// 2. Al terminar de estructurar el DOM
document.addEventListener('DOMContentLoaded', () => {
    verificarSesionYPermisos();
    configurarLogout();
    configurarBusquedaProductos();
});

function verificarSesionYPermisos() {
    const userStr = localStorage.getItem('userLogin') || localStorage.getItem('usuario');
    
    // Si no ha iniciado sesión, redirigir al login
    if (!userStr) {
        const paginaActual = window.location.pathname.split('/').pop().toLowerCase();
        if (paginaActual !== 'login.html' && paginaActual !== 'register.html') {
            window.location.href = "login.html";
        }
        return;
    }

    const user = JSON.parse(userStr);
    const rol = (user.rol || localStorage.getItem('userRole') || '').toLowerCase();

    // Sincronizar localStorage
    localStorage.setItem('userLogin', JSON.stringify(user));
    localStorage.setItem('usuario', JSON.stringify(user));
    localStorage.setItem('userRole', rol);

    // Pintar nombre de usuario y rol juntos
    const nombreUsuario = document.querySelector('#nombreusuario');
    if (nombreUsuario) {
        const rolTexto = user.rol ? (user.rol.charAt(0).toUpperCase() + user.rol.slice(1)) : "Usuario";
        const nombreTexto = user.usuario || user.nombre || "Usuario";
        
        let badgeClass = 'badge-primary';
        if (rol === 'administrador') badgeClass = 'badge-danger';
        else if (rol === 'vendedor') badgeClass = 'badge-success';
        else if (rol === 'cajero') badgeClass = 'badge-warning';
        else if (rol === 'cliente') badgeClass = 'badge-info';

        nombreUsuario.innerHTML = `${nombreTexto} <span class="badge ${badgeClass} ml-1" style="font-size: 0.75rem; text-transform: capitalize; font-weight: 600;">${rolTexto}</span>`;
    }

    // Pintar foto de perfil sin mostrar la imagen por defecto previa
    const imgPerfil = document.querySelector('#imagenPerfil') || document.querySelector('.img-profile');
    if (imgPerfil) {
        const fotoFinal = user.imagen || 'img/undraw_profile.svg';
        imgPerfil.src = fotoFinal;
        imgPerfil.style.opacity = '1';
        imgPerfil.onerror = () => {
            imgPerfil.src = 'img/undraw_profile.svg';
            imgPerfil.style.opacity = '1';
        };
    }

    // Control de acceso por página (Guardia de rutas)
    const paginaActual = window.location.pathname.split('/').pop().toLowerCase();

    const paginasRestringidas = {
        'vendedor': [
            'crear-usuario.html',
            'listado-usuarios.html',
            'crear-pro.html'
        ],
        'cajero': [
            'crear-usuario.html',
            'listado-usuarios.html',
            'crear-pro.html',
            'crear-cliente.html'
        ],
        'cliente': [
            'crear-usuario.html',
            'listado-usuarios.html',
            'crear-pro.html',
            'crear-cliente.html',
            'listado-clientes.html',
            'reportes.html'
        ]
    };

    if (paginasRestringidas[rol] && paginasRestringidas[rol].includes(paginaActual)) {
        alert(`Acceso denegado: Tu rol de "${user.rol}" no tiene permisos para acceder a esta página.`);
        window.location.href = "index.html";
        return;
    }

    // Reforzar ocultamiento por JavaScript
    aplicarPermisosVisuales(rol);
}

function aplicarPermisosVisuales(rol) {
    if (rol !== 'administrador') {
        const menuUsuarios = document.querySelector('#collapseUsuarios')?.closest('.nav-item') || document.querySelector('a[href="listado-usuarios.html"]')?.closest('.nav-item');
        if (menuUsuarios) menuUsuarios.style.display = 'none';

        const cardUsuarios = document.getElementById('card-usuarios') || document.querySelector('a[href="listado-usuarios.html"]')?.closest('.col-xl-3, .col-md-6');
        if (cardUsuarios) cardUsuarios.style.display = 'none';
    }

    if (rol === 'vendedor' || rol === 'cajero' || rol === 'cliente') {
        const linkCrearPro = document.querySelector('a[href="crear-pro.html"]');
        if (linkCrearPro) linkCrearPro.style.display = 'none';
    }

    if (rol === 'cajero' || rol === 'cliente') {
        const linkCrearCli = document.querySelector('a[href="crear-cliente.html"]');
        if (linkCrearCli) linkCrearCli.style.display = 'none';
    }

    if (rol === 'cliente') {
        const linkReportes = document.querySelector('a[href="reportes.html"]')?.closest('.nav-item');
        if (linkReportes) linkReportes.style.display = 'none';

        const menuClientes = document.querySelector('#collapseClientes')?.closest('.nav-item') || document.querySelector('a[href="listado-clientes.html"]')?.closest('.nav-item');
        if (menuClientes) menuClientes.style.display = 'none';

        const cardClientes = document.getElementById('card-clientes') || document.querySelector('a[href="listado-clientes.html"]')?.closest('.col-xl-3, .col-md-6');
        if (cardClientes) cardClientes.style.display = 'none';
    }
}

// Configurar botón de Cerrar Sesión
function configurarLogout() {
    const botonesLogout = document.querySelectorAll('#logoutButton, a[href="login.html"], a[href="../login.html"]');
    botonesLogout.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.getAttribute('data-toggle') !== 'modal') {
                localStorage.removeItem('userLogin');
                localStorage.removeItem('usuario');
                localStorage.removeItem('userRole');
                window.location.href = "login.html";
            }
        });
    });
}

// Configurar Búsqueda de Productos en Tiempo Real (Universal)
function configurarBusquedaProductos() {
    const searchForms = document.querySelectorAll('.navbar-search');
    if (!searchForms || searchForms.length === 0) return;

    let timeoutBusqueda = null;
    let listaProductosCache = null;

    async function obtenerProductos() {
        if (!listaProductosCache) {
            try {
                const res = await fetch('http://localhost:3000/api/productos');
                if (res.ok) {
                    listaProductosCache = await res.json();
                }
            } catch (e) {
                console.error("Error al obtener productos:", e);
            }
        }
        return listaProductosCache || [];
    }

    searchForms.forEach(form => {
        const input = form.querySelector('input[type="text"], input[type="search"]');
        const boton = form.querySelector('button');
        if (!input) return;

        let contenedorResultados = form.querySelector('.resultados-busqueda-flotante');
        if (!contenedorResultados) {
            contenedorResultados = document.createElement('div');
            contenedorResultados.className = 'resultados-busqueda-flotante shadow bg-white rounded border position-absolute w-100';
            contenedorResultados.style.cssText = 'top: 100%; left: 0; z-index: 1050; max-height: 380px; overflow-y: auto; display: none; margin-top: 5px;';
            form.style.position = 'relative';
            form.appendChild(contenedorResultados);
        }

        async function buscarEnVivo() {
            const query = input.value.trim().toLowerCase();
            if (query.length === 0) {
                contenedorResultados.style.display = 'none';
                contenedorResultados.innerHTML = '';
                return;
            }

            const productos = await obtenerProductos();
            const coincidencias = productos.filter(p => 
                (p.nombre && p.nombre.toLowerCase().includes(query)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(query)) ||
                (p.categoria && p.categoria.toLowerCase().includes(query))
            );

            if (coincidencias.length === 0) {
                contenedorResultados.innerHTML = `
                    <div class="p-3 text-center text-muted small">
                        <i class="fas fa-search mb-1 d-block text-gray-400"></i>
                        No se encontraron productos para "<strong>${input.value}</strong>"
                    </div>
                `;
                contenedorResultados.style.display = 'block';
                return;
            }

            let html = '<div class="list-group list-group-flush">';
            coincidencias.forEach(p => {
                const foto = p.imagen || 'https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg';
                const precioFmt = Number(p.precio).toLocaleString('es-CO');
                const cat = p.categoria || 'Comidas';

                html += `
                    <a href="listado-pro.html?buscar=${encodeURIComponent(p.nombre)}" class="list-group-item list-group-item-action p-2 d-flex align-items-center">
                        <img src="${foto}" class="rounded mr-2" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.src='https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg'">
                        <div class="flex-grow-1" style="line-height: 1.2;">
                            <div class="font-weight-bold text-primary small">${p.nombre}</div>
                            <small class="text-muted">${cat} • <strong class="text-success">$${precioFmt}</strong></small>
                        </div>
                        <span class="badge badge-light border text-muted">Stock: ${p.stock}</span>
                    </a>
                `;
            });
            html += '</div>';

            contenedorResultados.innerHTML = html;
            contenedorResultados.style.display = 'block';
        }

        input.addEventListener('input', () => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(buscarEnVivo, 200);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length > 0) {
                buscarEnVivo();
            }
        });

        document.addEventListener('click', (e) => {
            if (!form.contains(e.target)) {
                contenedorResultados.style.display = 'none';
            }
        });

        if (boton) {
            boton.addEventListener('click', (e) => {
                e.preventDefault();
                const q = input.value.trim();
                if (q.length > 0) {
                    window.location.href = `listado-pro.html?buscar=${encodeURIComponent(q)}`;
                }
            });
        }
    });
}
