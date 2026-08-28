
const d= document;
userInput = d.querySelector('#usuarioForm');
passwordInput = d.querySelector('#contraForm');
loginButton = d.querySelector('#btnLogin');

//evento al boton del formulario
loginButton.addEventListener('click',  (e) => {
    e.preventDefault();
    //alert("escribio : "+ userInput.value + " y su contraseña es : " + passwordInput.value);
let dataform=getData();
if (dataform) {
        sendData(dataform);
    }
});

//funcion para validar el formulario y obtener los datos del usuario
let getData=() => {
    let user;
if(userInput.value && passwordInput.value){
    user={
        usuario: userInput.value,
        contrasena: passwordInput.value
    }
    userInput.value = "" ;
    passwordInput.value = "" ;
    
    //alert("Te faltan datos por llenar");
 }else{
    alert("El usuario y la contraseña son obligatorios");
 
}
console.log(user);
 return user;


};

//funcion para recibir los datos y validar los datos
let sendData = async (data) => {
let url = "http://localhost:3000/api/login";
try {
    let respuesta = await fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
});
// 1. Verificamos si el servidor respondió con error (HTTP 400, 401, 500, etc.)
        if (!respuesta.ok) {
            alert("Usuario o contraseña incorrectos");
            return; // Corta la ejecución aquí para NO redirigir
        }

        const userRegistered = await respuesta.json();
        localStorage.setItem('userLogin', JSON.stringify(userRegistered));
        
        const rolTexto = userRegistered.rol ? (userRegistered.rol.charAt(0).toUpperCase() + userRegistered.rol.slice(1)) : 'Usuario';
        alert(`¡Bienvenido ${rolTexto}: ${userRegistered.usuario}!`);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error en login:", error);
        alert("Error de conexión con el servidor");
    }
};
