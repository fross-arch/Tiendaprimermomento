# SETUP.md — API de Tienda / Inventario

> Guía de instalación, configuración, ejecución y diagnóstico generada a partir de la estructura y el código incluido en el archivo `Primer momento.rar`.
>
> **Criterio:** este documento describe lo que realmente está declarado/implementado en el proyecto, sin asumir frameworks, servicios o herramientas que no aparecen en los archivos analizados. También se señalan inconsistencias encontradas que pueden impedir que determinadas funciones funcionen correctamente.

---

## 1. Descripción General del Proyecto

### 1.1 Propósito

El repositorio contiene un sistema de tienda/inventario compuesto por:

- Un **backend REST** desarrollado con Node.js y Express.
- Una **base de datos MySQL**.
- Un **frontend estático HTML/CSS/JavaScript** basado visualmente en SB Admin 2/Bootstrap.
- Operaciones CRUD para:
  - Productos.
  - Clientes.
  - Pedidos.
  - Detalles de pedidos.
  - Usuarios/roles.
- Un endpoint de autenticación mediante usuario y contraseña.
- Inicialización automática de tablas y datos de ejemplo mediante código Node.js.
- Un archivo `peticiones.http` con ejemplos de consumo de la API.

La aplicación está orientada a un escenario académico de sistema de inventario/tienda y el backend identifica el proyecto como `inventario-api-mysql`, con autoría indicada en algunos archivos como `Sistema de Inventario - CESDE`.

### 1.2 Stack tecnológico identificado

| Capa | Tecnología | Evidencia en el proyecto |
|---|---|---|
| Backend | Node.js | `package.json`, `server.js` |
| Framework HTTP | Express `4.x` | Dependencia `express` |
| CORS | `cors` `2.x` | `server.js` |
| Body parsing | `body-parser` `1.x` | `server.js` |
| Base de datos | MySQL | `mysql2`, SQL de inicialización |
| Driver BD | `mysql2/promise` | `src/database/connection.js`, `scripts/init-db.js` |
| Variables de entorno | `dotenv` | `.env`, `server.js`, conexión BD |
| Desarrollo | Nodemon | `npm run dev` |
| Frontend | HTML5 + CSS + JavaScript | `frontend-apicrud/` |
| UI | Bootstrap 4.6.2 vía CDN | HTML del frontend |
| Plantilla visual | SB Admin 2 | `css/sb-admin-2*.css`, `js/sb-admin-2*.js` |
| Iconos | Font Awesome 6.4.0 vía CDN | HTML |
| Gráficas | Chart.js 3.9.1 vía CDN | `index.html`, páginas de productos |
| Fuente | Google Fonts / Nunito | HTML |
| Persistencia de sesión frontend | `localStorage` | `js/login.js`, `js/local.js` |

### 1.3 Arquitectura general

```text
┌──────────────────────────────┐
│       Frontend estático      │
│  frontend-apicrud/*.html    │
│  CSS + JavaScript            │
└──────────────┬───────────────┘
               │ HTTP / JSON
               │ http://localhost:3000/api
               ▼
┌──────────────────────────────┐
│       Node.js + Express      │
│          server.js           │
├──────────────────────────────┤
│ Routes                       │
│ Controllers                  │
│ Error handler                │
│ Connection pool              │
└──────────────┬───────────────┘
               │ mysql2/promise
               ▼
┌──────────────────────────────┐
│            MySQL             │
│        inventario_db         │
├──────────────────────────────┤
│ productos                    │
│ clientes                     │
│ roles                        │
│ pedido                       │
│ detalle_pedido               │
└──────────────────────────────┘
```

---

## 2. Requisitos Previos y Entorno

### 2.1 Node.js

El `package.json` declara explícitamente:

```text
Node.js >= 14.0.0
```

Por compatibilidad con las versiones actualmente resueltas en `package-lock.json`, se recomienda utilizar una versión LTS moderna de Node.js compatible con CommonJS y Node 14+.

**Requisito mínimo declarado por el proyecto:** `14.0.0`.

### 2.2 Gestor de paquetes

El proyecto utiliza `npm`, porque contiene:

- `package.json`.
- `package-lock.json`.
- Scripts `npm run dev`, `npm start` y `npm run init-db`.

No hay configuración declarada para `pnpm` ni `yarn`.

### 2.3 MySQL

Se requiere un servidor **MySQL** accesible con las credenciales definidas en `.env`.

El código utiliza por defecto:

```text
Host: localhost
Puerto: 3306
Usuario: root
Contraseña: vacía
Base de datos: inventario_db
```

El proyecto no declara una versión exacta de MySQL. Por tanto, **no debe inventarse una versión específica como requisito del repositorio**.

### 2.4 Herramientas adicionales

No se encontraron declaraciones de:

- Docker / Docker Compose.
- Java / JDK.
- Python.
- Maven / Gradle.
- PostgreSQL.
- Redis.
- MongoDB.
- ORM como Sequelize, Prisma o TypeORM.
- Herramientas de migración como Flyway o Liquibase.

El desarrollo del backend se basa directamente en SQL mediante `mysql2`.

### 2.5 Editor / cliente HTTP recomendado

El repositorio incluye `peticiones.http`, por lo que puede utilizarse un editor compatible con archivos `.http` para probar los endpoints. El código no declara una herramienta concreta como requisito obligatorio.

---

## 3. Variables de Entorno y Configuración

La configuración se encuentra en:

```text
BACKEND_TIENDA_NODE_MYSQL/.env
```

Contenido declarado actualmente:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=inventario_db
PORT=3000
NODE_ENV=development
```

### 3.1 Tabla de variables

| Variable | Valor actual/default | Uso |
|---|---|---|
| `DB_HOST` | `localhost` | Host del servidor MySQL |
| `DB_PORT` | `3306` | Puerto MySQL |
| `DB_USER` | `root` | Usuario MySQL |
| `DB_PASSWORD` | vacío | Contraseña MySQL |
| `DB_NAME` | `inventario_db` | Nombre de la base de datos |
| `PORT` | `3000` | Puerto HTTP de Express |
| `NODE_ENV` | `development` | Entorno declarado; no se utiliza para cambiar lógica en `server.js` |

El código también incorpora estos valores como fallback mediante `process.env.X || valor`.

### 3.2 Seguridad del `.env`

El `.gitignore` contiene:

```text
.env
.env.local
```

Por tanto, las credenciales de entorno están contempladas como archivos locales y no deberían versionarse.

**Importante:** el proyecto incluido contiene contraseñas de usuarios de ejemplo dentro del código de inicialización. Esas credenciales son de demostración y no deben reutilizarse como credenciales reales de producción.

### 3.3 `.env.example`

No se encontró un `.env.example` en el ZIP. Para crear uno manualmente a partir de la configuración declarada:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=inventario_db
PORT=3000
NODE_ENV=development
```

---

## 4. Base de Datos y Servicios Externos

### 4.1 Motor de base de datos

**MySQL**.

El driver utilizado es:

```javascript
require("mysql2/promise")
```

La aplicación crea un pool de conexiones con:

```text
connectionLimit = 10
waitForConnections = true
queueLimit = 0
```

### 4.2 Creación de la base de datos

El script:

```text
BACKEND_TIENDA_NODE_MYSQL/scripts/init-db.js
```

crea la base de datos con:

```sql
CREATE DATABASE IF NOT EXISTS inventario_db
```

usando el valor configurado en `DB_NAME`.

Después selecciona la base y crea las tablas.

### 4.3 Tablas declaradas

#### `productos`

```text
id              INT PK AUTO_INCREMENT
nombre          VARCHAR(100) NOT NULL
descripcion     VARCHAR(255)
precio          DECIMAL(10,2) NOT NULL
stock           INT NOT NULL DEFAULT 0
imagen          VARCHAR(255)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

Índice:

```text
idx_nombre(nombre)
```

#### `clientes`

```text
id_cliente      INT PK AUTO_INCREMENT
nombre          VARCHAR(100) NOT NULL
apellido        VARCHAR(100) NOT NULL
email           VARCHAR(100) NOT NULL UNIQUE
celular         VARCHAR(20) NOT NULL
direccion       VARCHAR(150) NOT NULL
direccion2      VARCHAR(150)
descripcion     VARCHAR(255)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

Índice:

```text
idx_email(email)
```

#### `roles`

```text
id              INT PK AUTO_INCREMENT
rol             VARCHAR(50) NOT NULL
usuario         VARCHAR(50) NOT NULL UNIQUE
contrasena      VARCHAR(100) NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### `pedido`

```text
id              INT PK AUTO_INCREMENT
id_cliente      INT NOT NULL
descuento       DECIMAL(10,2) DEFAULT 0
metodo_pago     VARCHAR(50) NOT NULL
aumento         DECIMAL(10,2) DEFAULT 0
fecha           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

Relación:

```text
pedido.id_cliente -> clientes.id_cliente
ON DELETE CASCADE
```

Índice:

```text
idx_cliente(id_cliente)
```

#### `detalle_pedido`

```text
id              INT PK AUTO_INCREMENT
id_pedido       INT NOT NULL
id_producto     INT NOT NULL
precio          DECIMAL(10,2) NOT NULL
cantidad        INT NOT NULL
```

Relaciones:

```text
detalle_pedido.id_pedido   -> pedido.id
ON DELETE CASCADE

detalle_pedido.id_producto -> productos.id
ON DELETE CASCADE
```

Índices:

```text
idx_pedido(id_pedido)
idx_producto(id_producto)
```

### 4.4 Datos de ejemplo

`npm run init-db` intenta insertar:

#### Usuarios

| Rol | Usuario | Contraseña |
|---|---|---|
| administrador | `admin` | `admin12345` |
| vendedor | `vendedor` | `vendedor123` |

#### Clientes

- Alan Brito — `alambre@gmail.com`
- Zoyla Vaca — `vacalola@gmail.com`

#### Productos

- Perro — `$22000` — stock `20`.
- Hamburguesa — `$30000` — stock `5`.
- Pizza — `$45000` — stock `5`.

### 4.5 Inicialización automática al arrancar el servidor

`server.js` ejecuta, en este orden:

```javascript
await initializePool()
await initializeDatabase()
app.listen(PORT, ...)
```

Sin embargo, existe una diferencia importante entre los dos mecanismos de inicialización:

- `scripts/init-db.js` **sí crea la base de datos** antes de crear tablas.
- `src/database/init.js` crea tablas, pero asume que la base de datos indicada por `DB_NAME` ya existe.

Por ello, en una instalación desde cero la ruta más segura y explícita es ejecutar primero:

```bash
npm run init-db
```

y posteriormente:

```bash
npm start
```

### 4.6 Servicios externos

No se encontraron servicios externos obligatorios de backend como:

- Firebase.
- Auth0.
- AWS.
- Stripe.
- Cloudinary.
- SendGrid.
- MongoDB Atlas.

El frontend sí consume recursos externos mediante CDN y utiliza algunas URLs externas para imágenes de productos/perfil. Esas URLs no forman parte de la infraestructura backend.

---

## 5. Guía de Instalación y Ejecución Paso a Paso

### 5.1 Estructura después de extraer el ZIP

El archivo contiene dos componentes principales:

```text
Primer momento/
├── BACKEND_TIENDA_NODE_MYSQL/
└── frontend-apicrud/
```

### 5.2 Preparar MySQL

1. Instalar y arrancar MySQL.
2. Verificar que MySQL escuche en el puerto configurado, por defecto `3306`.
3. Verificar que el usuario configurado tenga permisos para crear la base de datos `inventario_db`.

Con la configuración actual, el proyecto espera:

```text
localhost:3306
usuario: root
contraseña: vacía
```

Si las credenciales reales son diferentes, modificar `.env`.

### 5.3 Instalar dependencias del backend

Entrar en:

```bash
cd BACKEND_TIENDA_NODE_MYSQL
```

Instalar:

```bash
npm install
```

El repositorio ya contiene `node_modules`, pero **no se recomienda depender de la carpeta incluida en el ZIP**. `npm install` debe utilizar `package.json` y `package-lock.json` para reconstruir las dependencias.

### 5.4 Inicializar MySQL

Ejecutar:

```bash
npm run init-db
```

Este comando:

1. Se conecta a MySQL sin seleccionar una base.
2. Crea `DB_NAME` si no existe.
3. Selecciona esa base.
4. Crea las cinco tablas.
5. Inserta los usuarios, clientes y productos de ejemplo.

### 5.5 Ejecutar backend en desarrollo

```bash
npm run dev
```

Esto ejecuta:

```text
nodemon server.js
```

### 5.6 Ejecutar backend normalmente

```bash
npm start
```

Esto ejecuta:

```text
node server.js
```

### 5.7 URL del backend

Con la configuración actual:

```text
http://localhost:3000
```

Base API:

```text
http://localhost:3000/api
```

Ruta raíz de comprobación:

```text
GET http://localhost:3000/
```

Debería devolver un JSON de bienvenida con la información de la API.

### 5.8 Frontend

`frontend-apicrud` no contiene un `package.json`, servidor web propio ni framework de build.

Por lo tanto, es un **frontend estático**.

Puede servirse mediante cualquier servidor HTTP estático. El repositorio no declara cuál debe utilizarse, por lo que no se debe considerar `live-server`, `http-server`, Vite, Apache, Nginx, etc. como dependencias oficiales del proyecto.

Una vez servido el directorio `frontend-apicrud`, la página de inicio del frontend es:

```text
index.html
```

Y el login:

```text
login.html
```

El JavaScript de login está programado para llamar directamente a:

```text
http://localhost:3000/api/login
```

### 5.9 Flujo de ejecución completo recomendado

```text
1. Arrancar MySQL
        ↓
2. Configurar BACKEND_TIENDA_NODE_MYSQL/.env
        ↓
3. cd BACKEND_TIENDA_NODE_MYSQL
        ↓
4. npm install
        ↓
5. npm run init-db
        ↓
6. npm run dev
        ↓
7. Servir frontend-apicrud mediante un servidor HTTP estático
        ↓
8. Abrir login.html desde ese servidor
        ↓
9. Iniciar sesión con un usuario de ejemplo
```

---

## 6. Estructura del Proyecto

### 6.1 Árbol relevante

```text
Primer momento/
│
├── BACKEND_TIENDA_NODE_MYSQL/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── peticiones.http
│   ├── README.md
│   │
│   ├── docs/
│   │   ├── ESTRUCTURA.md
│   │   ├── QUICK-START.md
│   │   └── REFACTORING.md
│   │
│   ├── scripts/
│   │   └── init-db.js
│   │
│   └── src/
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── clientesController.js
│       │   ├── detallePedidoController.js
│       │   ├── pedidosController.js
│       │   ├── productosController.js
│       │   └── usuariosController.js
│       │
│       ├── database/
│       │   ├── connection.js
│       │   └── init.js
│       │
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── clientesRoutes.js
│       │   ├── detallePedidoRoutes.js
│       │   ├── pedidosRoutes.js
│       │   ├── productosRoutes.js
│       │   └── usuariosRoutes.js
│       │
│       └── utils/
│           └── errorHandler.js
│
└── frontend-apicrud/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── crear-cliente.html
    ├── crear-pedido.html
    ├── crear-pro.html
    ├── crear-usuario.html
    ├── listado-clientes.html
    ├── listado-pedidos.html
    ├── listado-pro.html
    ├── listado-usuarios.html
    │
    ├── css/
    │   ├── CDN_OPTIMIZATION.md
    │   ├── login.css
    │   ├── panel.css
    │   ├── sb-admin-2.css
    │   └── sb-admin-2.min.css
    │
    ├── img/
    │   ├── imgzeus.png
    │   └── archivos SVG de la plantilla
    │
    └── js/
        ├── local.js
        ├── login.js
        ├── listado-pro.js
        ├── sb-admin-2.js
        ├── sb-admin-2.min.js
        └── demo/
            ├── chart-area-demo.js
            ├── chart-bar-demo.js
            ├── chart-pie-demo.js
            └── datatables-demo.js
```

### 6.2 Backend por capas

#### `server.js`

Punto de entrada de la API.

Responsabilidades:

- Cargar Express.
- Configurar CORS.
- Configurar `body-parser`.
- Cargar variables `.env`.
- Inicializar pool MySQL.
- Inicializar tablas.
- Registrar rutas.
- Servir `/` como endpoint informativo.
- Gestionar 404.
- Escuchar en `PORT`.
- Cerrar el pool ante `SIGINT`.
- Manejar `unhandledRejection` y `uncaughtException`.

#### `src/routes/`

Define el mapeo HTTP → controller.

#### `src/controllers/`

Contiene las operaciones de acceso a datos y lógica de cada recurso.

#### `src/database/connection.js`

Centraliza la configuración y ciclo de vida del pool MySQL.

#### `src/database/init.js`

Crea tablas al iniciar el servidor y, cuando `roles` está vacío, inserta datos de ejemplo.

#### `src/utils/errorHandler.js`

Centraliza la respuesta HTTP `500` para los errores capturados por los controllers.

---

## 7. Scripts Disponibles y Comandos Útiles

Los scripts definidos literalmente en `package.json` son:

| Comando | Acción |
|---|---|
| `npm run dev` | Ejecuta `nodemon server.js` |
| `npm start` | Ejecuta `node server.js` |
| `npm run init-db` | Ejecuta `node scripts/init-db.js` |
| `npm test` | Falla intencionalmente porque no hay tests configurados |

### 7.1 Dependencias declaradas

Versiones declaradas mediante rangos en `package.json`:

```text
express      ^4.18.2
cors         ^2.8.5
body-parser  ^1.20.2
mysql2       ^3.6.5
dotenv       ^16.3.1
nodemon      ^3.0.2   (devDependency)
```

Las versiones concretas resueltas en el `package-lock.json` incluido son:

```text
express      4.22.1
cors         2.8.6
body-parser  1.20.4
mysql2       3.18.0
dotenv       16.6.1
nodemon      3.1.14
```

### 7.2 Pruebas de API

El archivo:

```text
BACKEND_TIENDA_NODE_MYSQL/peticiones.http
```

incluye ejemplos para:

- Login de administrador.
- Login de vendedor.
- GET/POST/PUT/DELETE de productos.
- GET/POST/PUT/DELETE de clientes.
- GET/POST/PUT/DELETE de pedidos.
- GET/POST/PUT/DELETE de usuarios.
- GET/POST/PUT/DELETE de detalles de pedido.

### 7.3 Testing automatizado

No hay framework de pruebas configurado.

`npm test` está definido como:

```bash
echo "Error: no test specified" && exit 1
```

Por tanto, **no existe actualmente una suite automatizada de tests** declarada por el proyecto.

### 7.4 Linting y formateo

No se encontraron scripts o dependencias de:

- ESLint.
- Prettier.
- Stylelint.
- Husky.
- lint-staged.

---

## 8. API REST Disponible

Base URL:

```text
http://localhost:3000/api
```

### 8.1 Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/login` | Valida usuario y contraseña |

Body:

```json
{
  "usuario": "admin",
  "contrasena": "admin12345"
}
```

Respuesta exitosa: devuelve `id`, `rol` y `usuario` del registro autenticado.

**No se implementa JWT, sesión de servidor ni middleware de autorización.** El login es una consulta directa contra la tabla `roles`.

### 8.2 Productos

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/productos` | Lista productos |
| GET | `/api/productos/:id` | Obtiene producto por ID |
| POST | `/api/productos` | Crea producto |
| PUT | `/api/productos/:id` | Actualiza producto |
| DELETE | `/api/productos/:id` | Elimina producto |

### 8.3 Clientes

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/clientes` | Lista clientes |
| GET | `/api/clientes/:id` | Obtiene cliente |
| POST | `/api/clientes` | Crea cliente |
| PUT | `/api/clientes/:id` | Actualiza cliente |
| DELETE | `/api/clientes/:id` | Elimina cliente |

### 8.4 Pedidos

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/pedidos` | Lista pedidos con datos del cliente |
| GET | `/api/pedidos/:id` | Obtiene pedido y sus detalles |
| POST | `/api/pedidos` | Crea pedido y detalles dentro de una transacción |
| PUT | `/api/pedidos/:id` | Actualiza datos principales del pedido |
| DELETE | `/api/pedidos/:id` | Elimina pedido |

El POST de pedidos espera una estructura similar a:

```json
{
  "id_cliente": 1,
  "descuento": 5000,
  "metodo_pago": "PSE",
  "aumento": 0,
  "productos": [
    {
      "id_producto": 2,
      "precio": 30000,
      "cantidad": 2
    }
  ]
}
```

Durante la creación se insertan los detalles y se descuenta el stock con:

```sql
UPDATE productos SET stock = stock - ? WHERE id = ?
```

### 8.5 Usuarios

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/usuarios` | Lista usuarios |
| GET | `/api/usuarios/:id` | Obtiene usuario |
| POST | `/api/usuarios` | Crea usuario |
| PUT | `/api/usuarios/:id` | Actualiza usuario |
| DELETE | `/api/usuarios/:id` | Elimina usuario |

### 8.6 Detalles de pedido

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/detalle-pedido?id_pedido=1` | Lista detalles del pedido |
| POST | `/api/detalle-pedido` | Agrega detalle |
| PUT | `/api/detalle-pedido/:id` | Actualiza detalle |
| DELETE | `/api/detalle-pedido/:id` | Elimina detalle |

---

## 9. Frontend: Funcionamiento Real Detectado

El frontend contiene las vistas visuales para:

- Dashboard.
- Login.
- Registro.
- Productos.
- Clientes.
- Pedidos.
- Usuarios.

Sin embargo, **no todas las pantallas tienen integración con la API implementada**.

### 9.1 Login

`frontend-apicrud/js/login.js` sí implementa integración real con:

```text
POST http://localhost:3000/api/login
```

Al autenticarse:

1. Recibe el JSON del backend.
2. Lo guarda en `localStorage` bajo `userLogin`.
3. Muestra un mensaje de bienvenida.
4. Intenta redirigir a `../index.html`.

### 9.2 Persistencia de usuario

`frontend-apicrud/js/local.js` busca:

```javascript
localStorage.getItem('userLogin')
```

Si existe:

- Muestra `user.rol` en `#nombreusuario`.
- Intenta mostrar `user.imagen` en `#imagenPerfil`.

Si no existe, redirige a:

```text
login.html
```

El botón de logout elimina `userLogin` del `localStorage`.

### 9.3 Productos

`frontend-apicrud/js/listado-pro.js` sí implementa:

```text
GET http://localhost:3000/api/productos
```

Renderiza nombre, descripción, precio, stock e imagen.

Los botones visuales de **Edit** y **Delete** están presentes en la tabla, pero este archivo no implementa handlers para ejecutar las operaciones PUT/DELETE.

### 9.4 Crear cliente

`crear-cliente.html` contiene el formulario, pero su script inline solamente tiene un TODO:

```text
Implementar POST a /api/clientes
```

No hay código de envío real en el archivo incluido.

### 9.5 Crear pedido

`crear-pedido.html` contiene un formulario y un TODO que describe las tareas pendientes:

- GET clientes.
- GET productos.
- Carrito dinámico.
- Cálculo del total.
- POST `/api/pedidos`.

No están implementadas esas operaciones en el script inline incluido.

### 9.6 Crear usuario

`crear-usuario.html` contiene un TODO para:

- Validar confirmación de contraseña.
- POST `/api/usuarios`.

No hay implementación real del POST en el archivo analizado.

### 9.7 Listados de clientes, pedidos y usuarios

Sus scripts inline contienen TODOs para cargar datos y gestionar acciones, pero no implementan las llamadas a API correspondientes.

### 9.8 Crear producto

`crear-pro.html` contiene lógica JavaScript para seleccionar un producto de una lista local y actualizar:

- Imagen.
- Precio.

La lista `imagenes` contiene productos y URLs externas. No se encontró en esa página un POST implementado hacia `/api/productos`.

---

## 10. Solución de Problemas Frecuentes (Troubleshooting)

### Problema 1 — `ECONNREFUSED` o no conecta con MySQL

**Síntoma:** el backend no puede iniciar o aparece un error relacionado con la conexión a MySQL.

**Revisar:**

1. MySQL está iniciado.
2. `DB_HOST` es correcto.
3. `DB_PORT` es correcto.
4. `DB_USER` y `DB_PASSWORD` son correctos.
5. El usuario tiene permisos para crear/usar `DB_NAME`.

Configuración por defecto:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=inventario_db
```

### Problema 2 — La base `inventario_db` no existe

Ejecutar desde `BACKEND_TIENDA_NODE_MYSQL`:

```bash
npm run init-db
```

Este es el script que contiene explícitamente `CREATE DATABASE IF NOT EXISTS`.

### Problema 3 — El servidor falla al arrancar porque no existe la base

Aunque `server.js` ejecuta `initializeDatabase()`, ese módulo crea tablas dentro de una base ya seleccionada por el pool. No crea explícitamente la base de datos.

Solución desde cero:

```bash
npm run init-db
npm start
```

### Problema 4 — `/api/usuarios` devuelve error de columna `imagen`

Existe una inconsistencia concreta en el código.

La tabla `roles` creada por `src/database/init.js` y `scripts/init-db.js` contiene:

```text
id, rol, usuario, contrasena, created_at, updated_at
```

pero `usuariosController.js` intenta consultar:

```sql
SELECT id, rol, usuario, imagen FROM roles
```

y crear usuarios mediante:

```sql
INSERT INTO roles (rol, usuario, contrasena, imagen) ...
```

La columna `imagen` **no se crea en `roles`** en los scripts de inicialización incluidos.

Esto puede provocar errores como:

```text
Unknown column 'imagen' in 'field list'
```

**No se recomienda ocultar este error:** es una discrepancia real entre esquema y controller que debe corregirse en el código si se desea utilizar el módulo de usuarios.

### Problema 5 — La imagen del usuario no aparece después del login

Hay dos razones observables en el código:

1. `authController.js` devuelve solamente:
   - `id`
   - `rol`
   - `usuario`
2. `local.js` intenta leer `user.imagen`.

Por tanto, aunque existiera una columna `imagen`, el login actual no la selecciona.

### Problema 6 — El frontend redirige a una página inexistente

`login.js` utiliza:

```javascript
window.location.href = "../index.html"
```

y `local.js` usa:

```javascript
window.location.href = "../login.html"
```

Si el frontend se sirve directamente desde `frontend-apicrud/`, esas rutas `../` apuntan al directorio padre y pueden no encontrar los HTML esperados.

Esto debe verificarse según la forma exacta en que se sirva el frontend. Si el servidor tiene `frontend-apicrud` como raíz web, las rutas relativas esperables serían normalmente `index.html` y `login.html`.

### Problema 7 — El login funciona pero las páginas CRUD no cargan datos

No todas las vistas frontend implementan llamadas `fetch`.

Actualmente sí se detectó integración API en:

```text
js/login.js
js/listado-pro.js
```

Mientras que varias otras páginas contienen únicamente TODOs de integración.

Por ello, que el backend funcione correctamente **no implica que todas las pantallas HTML tengan CRUD funcional**.

### Problema 8 — `npm test` falla

Es esperado con el estado actual del repositorio.

El script está definido como:

```bash
npm test
```

pero su implementación termina deliberadamente con código `1` porque no existe una suite de pruebas configurada.

### Problema 9 — El stock puede quedar negativo

El controller de pedidos ejecuta:

```sql
UPDATE productos SET stock = stock - ? WHERE id = ?
```

No existe en el código analizado una validación previa que compruebe que `stock >= cantidad`.

Por tanto, una cantidad superior al stock disponible puede generar valores negativos si MySQL acepta la operación.

Esto es una consideración importante si se quiere utilizar el sistema en un entorno real.

### Problema 10 — Eliminar un producto puede eliminar detalles asociados

La relación:

```text
detalle_pedido.id_producto -> productos.id
ON DELETE CASCADE
```

hace que eliminar un producto pueda provocar la eliminación en cascada de sus registros de detalle de pedido.

Esto está definido explícitamente en el esquema y debe tenerse en cuenta antes de borrar productos históricos.

### Problema 11 — Eliminar un cliente puede eliminar sus pedidos

La relación:

```text
pedido.id_cliente -> clientes.id_cliente
ON DELETE CASCADE
```

implica que eliminar un cliente puede eliminar sus pedidos asociados y, por la relación de `detalle_pedido`, también sus detalles.

### Problema 12 — Las contraseñas están almacenadas en texto plano

El login ejecuta una comparación directa:

```sql
WHERE usuario = ? AND contrasena = ?
```

No se encontró `bcrypt`, `argon2`, hashing ni otro mecanismo de protección de contraseñas.

Esto es funcional para el ejemplo académico, pero **no debe considerarse una implementación segura para producción**.

### Problema 13 — CORS

El backend ejecuta:

```javascript
app.use(cors())
```

por lo que actualmente acepta solicitudes CORS sin una restricción de origen explícita.

Esto facilita el desarrollo local, pero no representa una política de seguridad de producción.

### Problema 14 — Error 404 de API

Las rutas que no existen reciben:

```json
{
  "error": "Ruta no encontrada",
  "message": "...",
  "suggestion": "Consulta GET / para ver los endpoints disponibles",
  "status": 404
}
```

Comprobar primero:

```text
GET http://localhost:3000/
```

### Problema 15 — `Unknown database`

Si se ejecuta directamente:

```bash
npm start
```

en una instalación completamente nueva, el pool intenta conectarse a `DB_NAME` antes de que `src/database/init.js` pueda crear tablas.

Ejecutar primero:

```bash
npm run init-db
```

---

## 11. Consideraciones Técnicas Detectadas en la Auditoría

Esta sección distingue entre **lo que funciona según el código** y **lo que requiere corrección si se busca un despliegue completo**.

### 11.1 Backend modular

La documentación incluida en `docs/REFACTORING.md` indica que el backend fue refactorizado desde un `server.js` grande hacia una estructura modular con controllers, routes, database y utils.

La estructura actual efectivamente refleja esa separación.

### 11.2 No hay middleware de autenticación para los CRUD

Aunque existe `/api/login`, las rutas de productos, clientes, pedidos, usuarios y detalles de pedido no utilizan un middleware que compruebe una sesión, JWT o rol.

Por lo tanto, técnicamente el login no protege los endpoints REST.

### 11.3 No hay sistema de estados de pedidos implementado

`listado-pedidos.html` contiene un comentario TODO que menciona:

```text
PATCH /api/pedidos/:id/estado
```

pero `pedidosRoutes.js` no declara esa ruta y `pedidosController.js` tampoco implementa una operación para cambiar estado.

Por ello, **no debe documentarse `PATCH /api/pedidos/:id/estado` como endpoint disponible**.

### 11.4 No hay sistema de subida de imágenes implementado

`usuariosController.js` referencia `req.file`, pero no se encontró configuración de `multer` ni middleware de subida de archivos en las dependencias o rutas.

Por tanto, la funcionalidad de archivo de imagen de usuario está incompleta/inconsistente.

### 11.5 Transacciones

La creación de pedidos sí utiliza transacción:

```text
BEGIN
  INSERT pedido
  INSERT detalle_pedido
  UPDATE stock
COMMIT
```

Si ocurre un error, ejecuta `ROLLBACK`.

Esto es diferente de los CRUD simples, que ejecutan operaciones individuales sin transacción explícita.

---

## 12. Checklist de Puesta en Marcha

### Backend

- [ ] MySQL está instalado y ejecutándose.
- [ ] `.env` está configurado.
- [ ] Node.js `>= 14.0.0` está disponible.
- [ ] Ejecutar `npm install`.
- [ ] Ejecutar `npm run init-db`.
- [ ] Ejecutar `npm run dev` o `npm start`.
- [ ] Verificar `http://localhost:3000/`.

### Base de datos

- [ ] Existe `inventario_db`.
- [ ] Existen `productos`.
- [ ] Existen `clientes`.
- [ ] Existen `roles`.
- [ ] Existe `pedido`.
- [ ] Existe `detalle_pedido`.
- [ ] Existen datos de ejemplo si se ejecutó `npm run init-db`.

### Frontend

- [ ] Servir `frontend-apicrud` mediante HTTP.
- [ ] Abrir `login.html` desde el servidor estático.
- [ ] Comprobar que el navegador pueda llamar a `http://localhost:3000/api/login`.
- [ ] Verificar las rutas relativas de redirección `../index.html` / `../login.html` según la raíz elegida para servir el frontend.
- [ ] Tener presente que varias pantallas CRUD todavía contienen TODOs y no realizan llamadas API.

---

## 13. Resumen Ejecutivo

Para levantar el proyecto desde cero con el código exactamente entregado:

```bash
cd BACKEND_TIENDA_NODE_MYSQL
npm install
npm run init-db
npm run dev
```

Backend:

```text
http://localhost:3000
```

API:

```text
http://localhost:3000/api
```

Usuarios de prueba declarados:

```text
admin / admin12345
vendedor / vendedor123
```

El backend es una API REST Node.js + Express + MySQL con arquitectura modular por rutas/controllers. El frontend es estático y consume directamente el backend desde JavaScript.

**Advertencias principales del estado actual:** el esquema `roles` no contiene la columna `imagen` que espera `usuariosController.js`; el login no devuelve `imagen`; varias pantallas frontend contienen TODOs en lugar de integración real; no hay tests automatizados; no existe autenticación/autorización para proteger los CRUD; las contraseñas se almacenan en texto plano; y la creación de pedidos no valida que el stock sea suficiente antes de descontarlo.

Estas observaciones se incluyen porque afectan directamente a la posibilidad de desplegar y utilizar correctamente el proyecto tal como está entregado.
