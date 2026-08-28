//variable locales

let nombreUsuario = document.querySelector('#nombreusuario');
let btnLogout  = document.querySelector('#logoutButton');

document.addEventListener('DOMContentLoaded', () => {
    getuser();
});

let getuser = () => {
    let user = JSON.parse(localStorage.getItem('userLogin'));

    if (user) {
        // Pintar el rol/nombre
        let nombreUsuario = document.querySelector('#nombreusuario');
        if (nombreUsuario) nombreUsuario.textContent = user.rol;

        // Pintar la imagen del usuario
        let imgPerfil = document.querySelector('#imagenPerfil');
        if (imgPerfil && user.imagen) {
            imgPerfil.src = user.imagen;
        }
    } else {
        window.location.href = "login.html";
    }
};

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('userLogin');
    window.location.href = "../login.html";
} );

