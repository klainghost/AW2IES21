**IES 21** – Aplicaciones Web 2
Entrega TP2 – Servidor Express y enrutamiento
Entrega TP3 – Front-end con Astro (ver [TP3 – Front-end](#tp3--front-end-astroturismo))
Moya Cristian Gabriel

# API de Excursiones

Servidor en **Express.js** que gestiona **clientes**, **excursiones** y **reservas** de una agencia de turismo. Los datos se guardan en archivos JSON dentro de `data/`.

## Cómo ejecutarlo

1. Instalar las dependencias:
   ```bash
   npm install
   ```
2. Crear el archivo `.env` copiando `.env.example` (trae `PORT=3000`). El `.env` no se sube al repo.
3. Levantar el servidor:
   ```bash
   npm run dev
   ```

El servidor levanta en `http://localhost:3000`.

## Estructura

```
├── data/                      ← datos en JSON
│   ├── clientes.json
│   ├── excursiones.json
│   └── reservas.json
├── routes/                    ← un router por estructura
│   ├── clientes.routes.js     → /clientes
│   ├── excursiones.routes.js  → /excursiones
│   └── reservas.routes.js     → /reservas
├── utils/
│   └── reservas.js            ← cálculo del total y detalle de una reserva
├── index.js                   ← servidor y conexión de los routers
├── .env
└── .gitignore
```

## Relación entre las estructuras

```
clientes (id) ◄──── reservas.id_cliente
excursiones (id) ◄── reservas.excursiones[].id_excursion
```

Una **reserva** pertenece a un **cliente** e incluye una o más **excursiones**.

---

# Rutas

## 👤 Clientes – `/clientes`

| Método | Ruta | Descripción | Body (JSON) |
|---|---|---|---|
| GET | `/clientes/all` | Lista todos los clientes | — |
| GET | `/clientes/byId/:id` | Un cliente por id | — |
| GET | `/clientes/byCiudad/:ciudad` | Clientes de una ciudad (ej: `/clientes/byCiudad/Mendoza`) | — |
| POST | `/clientes` | Crea un cliente | `{ "nombre": "Juan", "apellido": "Pérez", "email": "juan@gmail.com", "telefono": "+54 9 2604 11-2233", "edad": 30, "ciudad": "Malargüe", "fecha_registro": "2026-10-20" }` |
| POST | `/clientes/byEmail` | Busca un cliente por email (dato sensible, va en el body) | `{ "email": "sofia.bernal@gmail.com" }` |
| PUT | `/clientes/telefono/update/:id` | Actualiza el teléfono de un cliente | `{ "telefono": "+54 9 261 000-0000" }` |
| DELETE | `/clientes/delete/:id` | Elimina un cliente **solo si no tiene reservas** | — |

## 🏔️ Excursiones – `/excursiones`

| Método | Ruta | Descripción | Body (JSON) |
|---|---|---|---|
| GET | `/excursiones/all` | Lista todas las excursiones | — |
| GET | `/excursiones/byId/:id` | Una excursión por id | — |
| GET | `/excursiones/disponibles` | Solo las excursiones disponibles | — |
| POST | `/excursiones` | Crea una excursión | `{ "nombre": "Cabalgata", "descripcion": "Paseo a caballo", "duracion_horas": 4, "precio_por_persona": 30000, "incluye_almuerzo": false, "incluye_guia": true, "dificultad": "baja", "imagen": "cabalgata.jpg" }` |
| POST | `/excursiones/byPrecio` | Excursiones en un rango de precio | `{ "min": 20000, "max": 50000 }` |
| PUT | `/excursiones/precio/update/:id` | Actualiza el precio por persona | `{ "precio_por_persona": 55000 }` |
| DELETE | `/excursiones/delete/:id` | Elimina una excursión **solo si no está en ninguna reserva** | — |

## 📅 Reservas – `/reservas`

| Método | Ruta | Descripción | Body (JSON) |
|---|---|---|---|
| GET | `/reservas/all` | Lista todas las reservas | — |
| GET | `/reservas/byId/:id` | Una reserva con detalle (nombres del cliente y de las excursiones) | — |
| GET | `/reservas/byCliente/:id_cliente` | Todas las reservas de un cliente | — |
| POST | `/reservas` | Crea una reserva (el total se calcula automáticamente) | `{ "id_cliente": 2, "fecha_reserva": "2026-10-20", "fecha_excursion": "2026-11-01", "cantidad_personas": 2, "excursiones": [ { "id_excursion": 3, "cantidad_personas": 2 } ] }` |
| POST | `/reservas/byFecha` | Reservas entre dos fechas de excursión | `{ "desde": "2025-09-01", "hasta": "2025-09-30" }` |
| PUT | `/reservas/pagar/:id` | Marca una reserva como pagada | — |
| DELETE | `/reservas/delete/:id` | Elimina una reserva | — |

---

## Integridad de los datos

- **DELETE cliente:** si el cliente tiene reservas, responde `400` y no lo elimina. Primero hay que eliminar sus reservas con `DELETE /reservas/delete/:id`.
- **DELETE excursión:** si alguna reserva la incluye, responde `400` y no la elimina.
- **DELETE reserva:** se puede eliminar siempre, porque ninguna otra estructura depende de ella.
- **POST reserva:** valida que el cliente exista y esté **activo**, y que cada excursión exista y esté **disponible**.
- **POST cliente:** no permite dos clientes con el mismo email.

## Pruebas en Postman

Capturas en la carpeta [`capturas-postman/`](capturas-postman/):

| Prueba | Captura |
|---|---|
| `POST /clientes/byEmail` → 200 | [01-POST-clientes-byEmail.png](capturas-postman/01-POST-clientes-byEmail.png) |
| `GET /clientes/byId/2` → 200 | [02-GET-clientes-byId.png](capturas-postman/02-GET-clientes-byId.png) |
| `POST /reservas/byFecha` → 200 | [03-POST-reservas-byFecha.png](capturas-postman/03-POST-reservas-byFecha.png) |

## Códigos de respuesta

| Código | Cuándo |
|---|---|
| `200` | La operación salió bien |
| `400` | Datos inválidos o la operación rompería la integridad de los datos |
| `404` | No se encontró el registro |
| `500` | Error del servidor (por ejemplo, al escribir el archivo) |

---

# TP3 – Front-end (Astroturismo)

Interfaz hecha con **[Astro](https://astro.build/)** + **Tailwind CSS**, dentro de la carpeta `client/` (**monorepo**: front y back en el mismo repositorio). Tema oscuro con paleta de naturaleza nocturna y diseño *mobile first*.

## Cómo ejecutarlo

Se levantan **dos servidores**, cada uno en su terminal:

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

Para probar, ingresar con el email `sofia.bernal@gmail.com`.

## Vistas

| Ruta | Qué hace |
|---|---|
| `/` | Ingreso con email (`POST /clientes/byEmail`). El cliente se guarda en **sessionStorage** |
| `/excursiones` | Listado de todas las excursiones (`GET /excursiones/all`) y botón para agregarlas al carrito |
| `/filtrar` | Filtra las excursiones por dificultad (`GET /excursiones/byDificultad/:dificultad`) |
| `/carrito` | Carrito guardado en **localStorage**: sumar/restar personas, quitar, vaciar y **comprar** |

Al **comprar** se genera una orden de compra = una **reserva** (`POST /reservas`) con el cliente logueado y las excursiones del carrito. El back valida los datos y calcula el total. Si sale bien, pasa una estrella fugaz y se muestra la confirmación.

## Estructura del front

```
client/
├── public/                     ← logo
└── src/
    ├── layouts/Layout.astro    ← HTML base, fondo estrellado, guardia de sesión
    ├── components/             ← Navbar.astro, EstrellaFugaz.astro
    ├── pages/                  ← index, excursiones, filtrar, carrito
    ├── styles/global.css       ← Tailwind + paleta de colores
    └── scripts/
        ├── api/                ← fetch al back (config, clientes, excursiones, reservas)
        ├── components/         ← card de excursión, lista, aviso
        └── utils/              ← sessionStorage, carrito (localStorage), formato, estrella fugaz
```

## Ruta nueva en el back

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/excursiones/byDificultad/:dificultad` | Excursiones de una dificultad (`baja`, `moderada`, `alta`) |
