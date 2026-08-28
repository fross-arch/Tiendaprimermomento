// local.js - Manejo de sesión y permisos por rol (Anti-parpadeo instantáneo)

// 1. Inyección INMEDIATA de estilos antes de que la página se pinte (Elimina parpadeos al refrescar)
(function aplicarEstilosAnticipados() {
    const userStr = localStorage.getItem('userLogin');
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const rol = (user.rol || '').toLowerCase();
        
        let css = '#imagenPerfil { opacity: 0; transition: opacity 0.15s ease; } ';

        if (rol !== 'administrador') {
            css += '#nav-usuarios, #collapseUsuarios, #card-usuarios, a[data-target="#collapseUsuarios"] { display: none !important; } ';
            css += 'li:has(#collapseUsuarios), li:has(a[data-target="#collapseUsuarios"]) { display: none !important; } ';
        }

        if (rol === 'vendedor' || rol === 'cajero' || rol === 'cliente') {
            css += 'a[href="crear-pro.html"] { display: none !important; } ';
        }

        if (rol === 'cajero' || rol === 'cliente') {
            css += 'a[href="crear-cliente.html"] { display: none !important; } ';
        }

        if (rol === 'cliente') {
            css += '#nav-clientes, #collapseClientes, #card-clientes, a[data-target="#collapseClientes"] { display: none !important; } ';
            css += 'li:has(#collapseClientes), li:has(a[data-target="#collapseClientes"]) { display: none !important; } ';
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
    const user = JSON.parse(localStorage.getItem('userLogin'));

    // Si no ha iniciado sesión, redirigir al login
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const rol = (user.rol || '').toLowerCase();

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
            'listado-clientes.html'
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
        const menuUsuarios = document.querySelector('#collapseUsuarios')?.closest('.nav-item');
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
        const menuClientes = document.querySelector('#collapseClientes')?.closest('.nav-item');
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
        form.style.position = 'relative';
        const input = form.querySelector('input[type="text"]');
        if (!input) return;

        input.placeholder = "Buscar productos...";
        input.setAttribute('autocomplete', 'off');

        // Crear contenedor de resultados si no existe
        let dropdown = form.querySelector('.search-results-box');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-results-box dropdown-menu shadow-lg p-0';
            dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; width: 100%; min-width: 320px; max-height: 380px; overflow-y: auto; display: none; z-index: 1050; margin-top: 5px;';
            form.appendChild(dropdown);
        }

        async function buscar(texto) {
            const query = texto.trim().toLowerCase();
            if (query.length === 0) {
                dropdown.style.display = 'none';
                if (typeof window.filtrarTablaProductosEnVivo === 'function') {
                    window.filtrarTablaProductosEnVivo('');
                }
                return;
            }

            const productos = await obtenerProductos();
            const filtrados = productos.filter(p => 
                (p.nombre && p.nombre.toLowerCase().includes(query)) || 
                (p.descripcion && p.descripcion.toLowerCase().includes(query))
            );

            // Si estamos en listado-pro.html, filtrar también la tabla en vivo
            if (typeof window.filtrarTablaProductosEnVivo === 'function') {
                window.filtrarTablaProductosEnVivo(query);
            }

            dropdown.innerHTML = '';

            if (filtrados.length === 0) {
                dropdown.innerHTML = `
                    <div class="p-3 text-center text-muted small">
                        <i class="fas fa-search-minus mr-1"></i> No se encontraron productos para "<strong>${texto}</strong>"
                    </div>
                `;
                dropdown.style.display = 'block';
                return;
            }

            const header = document.createElement('div');
            header.className = 'dropdown-header bg-light py-2 text-primary font-weight-bold';
            header.innerHTML = `<i class="fas fa-boxes mr-1"></i> ${filtrados.length} Producto(s) encontrado(s):`;
            dropdown.appendChild(header);

            filtrados.forEach(prod => {
                const item = document.createElement('a');
                item.className = 'dropdown-item d-flex align-items-center py-2 border-bottom';
                item.href = 'listado-pro.html?buscar=' + encodeURIComponent(prod.nombre);
                item.style.whiteSpace = 'normal';

                const foto = prod.imagen || 'img/undraw_profile.svg';
                const precioFormatted = Number(prod.precio || 0).toLocaleString('es-CO');

                item.innerHTML = `
                    <img src="${foto}" width="42" height="42" class="rounded mr-2 shadow-sm" style="object-fit: cover;" onerror="this.src='img/undraw_profile.svg'">
                    <div class="flex-grow-1">
                        <div class="font-weight-bold text-gray-800">${prod.nombre}</div>
                        <div class="small text-success font-weight-bold">$${precioFormatted} <span class="badge badge-light border text-muted ml-1">Stock: ${prod.stock}</span></div>
                    </div>
                    <i class="fas fa-arrow-right text-gray-400 small ml-2"></i>
                `;
                dropdown.appendChild(item);
            });

            dropdown.style.display = 'block';
        }

        input.addEventListener('input', (e) => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                buscar(e.target.value);
            }, 100);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length > 0) {
                buscar(input.value);
            }
        });

        // Al enviar el formulario con enter o botón
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = input.value.trim();
            if (val.length > 0) {
                window.location.href = 'listado-pro.html?buscar=' + encodeURIComponent(val);
            }
        });

        const btnSearch = form.querySelector('button');
        if (btnSearch) {
            btnSearch.addEventListener('click', (e) => {
                e.preventDefault();
                const val = input.value.trim();
                if (val.length > 0) {
                    window.location.href = 'listado-pro.html?buscar=' + encodeURIComponent(val);
                }
            });
        }
    });

    // Cerrar los dropdowns al hacer clic afuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar-search')) {
            document.querySelectorAll('.search-results-box').forEach(box => {
                box.style.display = 'none';
            });
        }
    });
}


