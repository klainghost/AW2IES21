**IES 21** – Aplicaciones Web 2
Entrega TP2 – Servidor Express y enrutamiento
Entrega TP3 – Front-end con Astro (ver [Front-end](#front-end-astroturismo))
Entrega TP4 – MongoDB + autenticación con Bcrypt y JWT (ver [TP4](#tp4--mongodb-y-autenticación) y [ENTREGA-TP4.md](ENTREGA-TP4.md))
Moya Cristian Gabriel

# API de Excursiones

Servidor en **Express.js** que gestiona **clientes**, **excursiones** y **reservas** de una agencia de turismo.
Desde el TP4, los datos se guardan en **MongoDB** (con Mongoose). Las contraseñas se guardan hasheadas con **Bcrypt**, y la compra y las demás acciones sensibles requieren un **JWT**.

## Cómo ejecutarlo

Requisitos: **Node.js** y **MongoDB** corriendo en `mongodb://localhost:27017` (se puede ver con MongoDB Compass).

1. Instalar las dependencias:
   ```bash
   npm install
   ```
2. Crear el archivo `.env` copiando `.env.example` y completar `JWT_SECRET` con un string largo y aleatorio. El `.env` no se sube al repo. Para generar uno:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
3. Cargar los datos iniciales en Mongo (borra y vuelve a cargar las 3 colecciones desde `data/*.json`):
   ```bash
   npm run seed
   ```
4. Levantar el servidor:
   ```bash
   npm run dev
   ```

El servidor levanta en `http://localhost:3000` y muestra `Conectado a MongoDB` en la consola.

**Usuario de prueba:** `sofia.bernal@gmail.com` / `astro1234`. Todos los clientes del seed tienen la contraseña `astro1234`.

### Variables de entorno (`.env`)

| Variable | Ejemplo | Para qué |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `MONGODB_URI` | `mongodb://localhost:27017` | Servidor de MongoDB |
| `MONGODB_DB` | `astroturismo` | Nombre de la base |
| `JWT_SECRET` | (aleatorio) | Clave con la que se firman los tokens |
| `JWT_EXPIRES_IN` | `24h` | Duración del token |

## Estructura

```
├── db/
│   ├── connection.js            ← conexión a MongoDB (cacheada)
│   ├── schemas/                 ← un Schema/Model por colección
│   │   ├── cliente.schema.js
│   │   ├── excursion.schema.js
│   │   └── reserva.schema.js
│   ├── actions/                 ← todas las queries a Mongo
│   │   ├── cliente.actions.js
│   │   ├── excursion.actions.js
│   │   └── reserva.actions.js
│   └── seed.js                  ← npm run seed: carga data/*.json en Mongo
├── routes/                      ← un router por colección (solo HTTP)
│   ├── clientes.routes.js       → /clientes
│   ├── excursiones.routes.js    → /excursiones
│   └── reservas.routes.js       → /reservas
├── utils/
│   ├── middleware.js            ← auth: verifica el JWT
│   └── reservas.js              ← cálculo del total de una reserva
├── data/                        ← JSON originales (fuente del seed)
├── postman/                     ← colección de Postman
├── index.js                     ← servidor y conexión de los routers
├── .env.example
└── .gitignore
```

**Cómo se reparte el trabajo:**
- La **route** recibe el request, valida los datos, llama a una **action** y responde.
- La **action** es la única que habla con Mongo: se conecta, hace la query y devuelve el resultado.
- Las rutas protegidas pasan antes por el middleware `auth`.

## Relación entre las colecciones

```
clientes (_id) ◄──── reservas.cliente
excursiones (_id) ◄── reservas.excursiones[].excursion
```

- Una **reserva** pertenece a un **cliente** e incluye una o más **excursiones**.
- La reserva guarda solo el `ObjectId` de cada uno (es una **referencia**). Al leerla, `populate` reemplaza esos ids por los datos del cliente y de las excursiones, como un JOIN en SQL.
- Los ids son `ObjectId` de Mongo, por ejemplo `6b00fc30923a47d93076cb07`. Las respuestas traen `_id` y también `id`.

---

# Rutas

🔒 = requiere el header `Authorization: Bearer <token>` (el token lo devuelve `POST /clientes/login`).

## 👤 Clientes – `/clientes`

| Método | Ruta | Descripción | Body (JSON) | |
|---|---|---|---|---|
| POST | `/clientes` | Registro de un cliente (la contraseña se guarda hasheada) | `{ "nombre": "Juan", "apellido": "Pérez", "email": "juan@gmail.com", "password": "estrellas2026", "telefono": "+54 9 2604 11-2233", "edad": 30, "ciudad": "Malargüe" }` | |
| POST | `/clientes/login` | Login: devuelve `{ token, cliente }` | `{ "email": "sofia.bernal@gmail.com", "password": "astro1234" }` | |
| GET | `/clientes/all` | Lista todos los clientes | — | 🔒 |
| GET | `/clientes/byId/:id` | Un cliente por id | — | 🔒 |
| GET | `/clientes/byCiudad/:ciudad` | Clientes de una ciudad (ej: `/clientes/byCiudad/Mendoza`) | — | 🔒 |
| POST | `/clientes/byEmail` | Busca un cliente por email (dato sensible, va en el body) | `{ "email": "sofia.bernal@gmail.com" }` | 🔒 |
| PUT | `/clientes/telefono/update/:id` | Actualiza el teléfono (solo el propio) | `{ "telefono": "+54 9 261 000-0000" }` | 🔒 |
| DELETE | `/clientes/delete/:id` | Elimina el propio cliente **solo si no tiene reservas** | — | 🔒 |

Ninguna respuesta devuelve el `password`.

## 🏔️ Excursiones – `/excursiones`

| Método | Ruta | Descripción | Body (JSON) | |
|---|---|---|---|---|
| GET | `/excursiones/all` | Lista todas las excursiones | — | |
| GET | `/excursiones/byId/:id` | Una excursión por id | — | |
| GET | `/excursiones/disponibles` | Solo las excursiones disponibles | — | |
| GET | `/excursiones/byDificultad/:dificultad` | Excursiones de una dificultad (`baja`, `moderada`, `alta`) | — | |
| POST | `/excursiones/byPrecio` | Excursiones en un rango de precio | `{ "min": 20000, "max": 50000 }` | |
| POST | `/excursiones` | Crea una excursión | `{ "nombre": "Cabalgata", "descripcion": "Paseo a caballo", "duracion_horas": 4, "precio_por_persona": 30000, "incluye_almuerzo": false, "incluye_guia": true, "dificultad": "baja", "imagen": "cabalgata.jpg" }` | 🔒 |
| PUT | `/excursiones/precio/update/:id` | Actualiza el precio por persona | `{ "precio_por_persona": 55000 }` | 🔒 |
| DELETE | `/excursiones/delete/:id` | Elimina una excursión **solo si no está en ninguna reserva** | — | 🔒 |

## 📅 Reservas – `/reservas` (todas 🔒)

| Método | Ruta | Descripción | Body (JSON) |
|---|---|---|---|
| POST | `/reservas` | **Comprar**: crea una reserva a nombre del usuario logueado y la devuelve con el detalle | `{ "fecha_excursion": "2026-12-20", "excursiones": [ { "excursion": "<id de la excursión>", "cantidad_personas": 2 } ] }` |
| GET | `/reservas/all` | Lista todas las reservas con el detalle | — |
| GET | `/reservas/byId/:id` | Una reserva propia con el detalle (nombres del cliente y de las excursiones) | — |
| GET | `/reservas/byCliente/:id_cliente` | Las reservas del usuario logueado | — |
| POST | `/reservas/byFecha` | Reservas entre dos fechas de excursión | `{ "desde": "2025-09-01", "hasta": "2025-09-30" }` |
| PUT | `/reservas/pagar/:id` | Marca como pagada una reserva propia | — |
| DELETE | `/reservas/delete/:id` | Elimina una reserva propia | — |

**Al crear una reserva, el servidor calcula:**
- el **cliente**, que sale del token (no del body);
- el **total**, con los precios guardados en la base;
- la fecha de reserva;
- `pagado: false`;
- la cantidad de personas del grupo, que es la excursión con más personas.

---

## Autenticación (TP4)

**Bcrypt.** La contraseña nunca se guarda tal cual: se guarda su *hash*, que es una huella que no se puede revertir.
- Cada hash lleva una *sal* aleatoria. Por eso, en Compass, la misma contraseña aparece distinta en cada cliente.
- En el login se hashea lo que escribió el usuario y se compara con el hash guardado.

**JWT.** Si el login es correcto, la API devuelve un token firmado con `JWT_SECRET` que vence en 24 h.
- El token tiene tres partes: `header.payload.firma`.
- El payload (`{ id, email, nombre }`) se puede leer, por ejemplo en jwt.io. No se puede modificar sin que la firma deje de coincidir. Por eso nunca lleva la contraseña.

**Rutas protegidas.** Se manda el token en el header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
El middleware `auth` (`utils/middleware.js`) verifica el token:
- si es válido, deja los datos del usuario en `req.user`;
- si falta, está adulterado o venció, responde `401`.

Si el token es válido pero el recurso es de otro cliente, la respuesta es `403`. Por ejemplo: ver las reservas de otro, pagar una reserva ajena o cambiar el teléfono de otro cliente.

## Integridad de los datos

- **DELETE cliente:** si el cliente tiene reservas, responde `400` y no lo elimina. Primero hay que eliminar sus reservas con `DELETE /reservas/delete/:id`.
- **DELETE excursión:** si alguna reserva la incluye, responde `400` y no la elimina.
- **DELETE reserva:** se puede eliminar siempre, porque ninguna otra colección depende de ella.
- **POST reserva:** valida que el cliente exista y esté **activo**, que cada excursión exista y esté **disponible**, y que la fecha de la excursión sea futura.
- **POST cliente:** no permite dos clientes con el mismo email (además, el email tiene índice `unique` en Mongo).
- **Ids:** si un id no tiene formato de ObjectId, responde `400`.

## Códigos de respuesta

| Código | Cuándo |
|---|---|
| `200` | La operación salió bien |
| `400` | Datos inválidos o la operación rompería la integridad de los datos |
| `401` | Falta el token, está adulterado o venció (o contraseña incorrecta en el login) |
| `403` | El token es válido, pero no tenés permiso sobre ese recurso (o la cuenta está inactiva, en el login) |
| `404` | No se encontró el registro |
| `500` | Error del servidor (por ejemplo, MongoDB no disponible) |

## Pruebas en Postman

**Colección TP4:** importar `postman/TP4-Astroturismo.postman_collection.json` en Postman.
- Antes de correrla, hacer `npm run seed` y levantar la API.
- Las carpetas se corren en orden (Auth → Excursiones → Clientes → Reservas). El login de la primera guarda el token y los ids en las variables de la colección, así que no hay que copiarlos a mano.
- Cada request tiene un test con el código de respuesta esperado.

Capturas del TP2 en la carpeta [`capturas-postman/`](capturas-postman/). En ese momento los ids todavía eran numéricos y `byEmail` era pública.

| Prueba | Captura |
|---|---|
| `POST /clientes/byEmail` → 200 | [01-POST-clientes-byEmail.png](capturas-postman/01-POST-clientes-byEmail.png) |
| `GET /clientes/byId/2` → 200 | [02-GET-clientes-byId.png](capturas-postman/02-GET-clientes-byId.png) |
| `POST /reservas/byFecha` → 200 | [03-POST-reservas-byFecha.png](capturas-postman/03-POST-reservas-byFecha.png) |

---

# TP4 – MongoDB y autenticación

Resumen de los cambios de esta entrega. La documentación técnica completa está en [ENTREGA-TP4.md](ENTREGA-TP4.md).

- **De JSON a MongoDB:** los datos viven en la base `astroturismo` (colecciones `clientes`, `excursiones`, `reservas`). Los archivos de `data/` quedan solo como fuente del `npm run seed`.
- **Seed:** traduce los ids numéricos viejos a `ObjectId` y arma las referencias de las reservas. A cada cliente le asigna la contraseña `astro1234`, hasheada con bcrypt.
- **Reservas con `populate`:** el detalle de una reserva (nombre del cliente y de las excursiones) lo arma Mongoose. Ya no se cruzan los JSON a mano.
- **Registro y login** con bcrypt y JWT (ruta nueva: `POST /clientes/login`).
- **Rutas protegidas** con el middleware `auth`. Las reservas solo las ve, paga o borra su dueño.
- **Las URLs no cambiaron.** Lo que cambió:
  - los ids son `ObjectId`;
  - `POST /clientes` pide `password`;
  - `POST /reservas` ya no recibe `id_cliente` y usa `excursiones: [{ excursion, cantidad_personas }]`.

---

# Front-end (Astroturismo)

Interfaz hecha con **[Astro](https://astro.build/)** + **Tailwind CSS**, dentro de la carpeta `client/`. Es un **monorepo**: front y back en el mismo repositorio. Tema oscuro con paleta de naturaleza nocturna y diseño *mobile first*.

## Cómo ejecutarlo

Se levantan **dos servidores**, cada uno en su terminal (con MongoDB corriendo y el seed cargado):

```bash
# 1) Back-end (desde la raíz) → http://localhost:3000
npm install
npm run dev

# 2) Front-end (desde client/) → http://localhost:4321
cd client
npm install
npm run dev
```

Como el front corre en otro puerto, el back usa `cors()`.

Para probar, ingresar con `sofia.bernal@gmail.com` / `astro1234`.

## Vistas

| Ruta | Qué hace |
|---|---|
| `/` | Ingreso con email y contraseña (`POST /clientes/login`). El token y los datos del cliente se guardan en **sessionStorage** |
| `/excursiones` | Listado de todas las excursiones (`GET /excursiones/all`) y botón para agregarlas al carrito |
| `/filtrar` | Filtra las excursiones por dificultad (`GET /excursiones/byDificultad/:dificultad`) |
| `/carrito` | Carrito guardado en **localStorage**: sumar/restar personas, quitar, vaciar y **comprar** |

Al **comprar** se genera una orden de compra, que es una **reserva** (`POST /reservas`) con las excursiones del carrito. El back toma el cliente del token, valida los datos y calcula el total. Si sale bien, pasa una estrella fugaz y se muestra la confirmación con el nombre del cliente y de las excursiones.

**Sesión con JWT:**
- Todas las llamadas al back pasan por `request()` (`scripts/api/config.js`), que agrega `Authorization: Bearer <token>` si hay sesión.
- Si el back responde `401` (token vencido o inválido), se cierra la sesión y se vuelve al login con el aviso "Tu sesión venció".
- Al abrir el carrito se descartan los ítems viejos con ids numéricos, de antes de la migración a MongoDB.

## Estructura del front

```
client/
├── public/                     ← logo
└── src/
    ├── layouts/Layout.astro    ← HTML base, fondo estrellado, guardia de sesión
    ├── components/             ← Navbar.astro, EstrellaFugaz.astro
    ├── pages/                  ← index (login), excursiones, filtrar, carrito
    ├── styles/global.css       ← Tailwind + paleta de colores
    └── scripts/
        ├── api/                ← fetch al back (config con el token, clientes, excursiones, reservas)
        ├── components/         ← card de excursión, lista, aviso
        └── utils/              ← sesión (sessionStorage), carrito (localStorage), formato, estrella fugaz
```
