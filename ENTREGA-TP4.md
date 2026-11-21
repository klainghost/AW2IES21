**IES 21** – Aplicaciones Web 2
Entrega TP4 – Autenticación (JWT + Bcrypt) y migración a MongoDB
Moya Cristian Gabriel

# Astroturismo – API de Excursiones + Front

## Links
- **Repositorio:** https://github.com/klainghost/AW2IES21/tree/TP4
- **Video explicativo:** TODO
- **Deploy (opcional):** TODO / no aplica

---

## 1. Descripción general
Aplicación web para una agencia de astroturismo de Malargüe. El cliente se registra, inicia sesión, ve y filtra excursiones, las suma a un carrito y confirma la compra, que genera una **reserva**.
En esta entrega los datos pasaron de archivos JSON a **MongoDB**, las contraseñas se guardan **hasheadas con Bcrypt** y la compra (y las acciones sensibles) se verifican con un **JWT**.

## 2. Arquitectura
Monorepo: API **Express** en la raíz y front **Astro** en `client/`.

```
├── db/
│   ├── connection.js        ← conexión cacheada a MongoDB
│   ├── schemas/             ← cliente, excursion, reserva
│   ├── actions/             ← queries con Mongoose (una por operación)
│   └── seed.js              ← carga inicial desde data/*.json
├── routes/                  ← endpoints HTTP (route → action)
├── utils/
│   ├── middleware.js        ← verificación del JWT
│   └── reservas.js          ← cálculo del total
├── postman/                 ← colección de pruebas
└── client/                  ← front Astro + Tailwind
```

Flujo de un pedido: **route** (recibe y valida el request) → **action** (se conecta y consulta Mongo) → respuesta. Las rutas protegidas pasan antes por el middleware `auth`.

## 3. Modelo de datos (MongoDB)
TODO: completar con los schemas finales.

| Colección | Campos principales | Relaciones |
|---|---|---|
| clientes | nombre, apellido, email (único), password (hash), telefono, edad, ciudad, activo | — |
| excursiones | nombre, descripcion, duracion_horas, precio_por_persona, dificultad, disponible, imagen | — |
| reservas | fecha_reserva, fecha_excursion, cantidad_personas, pagado, total | `cliente` → clientes · `excursiones[].excursion` → excursiones |

Las referencias se resuelven con `populate` (equivalente al JOIN de SQL).

## 4. Autenticación
- **Registro** (`POST /clientes`): la contraseña se hashea con `bcrypt` antes de guardarse.
- **Login** (`POST /clientes/login`): `bcrypt.compareSync` contra el hash; si coincide se firma un JWT (`{ id, email, nombre }`, vence en 24 h).
- **Rutas protegidas:** el front manda `Authorization: Bearer <token>`; el middleware lo verifica y deja los datos del usuario en `req.user`. El cliente de una reserva se toma del token, no del body.

| Método | Ruta | Protegida |
|---|---|---|
| POST | `/reservas` (comprar) | ✅ |
| GET | `/reservas/byCliente/:id` | ✅ (solo las propias) |
| PUT | `/reservas/pagar/:id` | ✅ |
| TODO | completar | |

## 5. Endpoints
TODO: tabla final de rutas (método, ruta, descripción, body, protegida).

## 6. Tecnologías y dependencias
TODO: verificar versiones en `package.json`.

| Paquete | Versión | Uso |
|---|---|---|
| express | | Servidor y ruteo |
| mongoose | | ODM para MongoDB (schemas, queries, populate) |
| bcrypt | | Hash de contraseñas |
| jsonwebtoken | | Firma y verificación de tokens |
| dotenv | | Variables de entorno |
| cors | | Permitir el front en otro puerto |
| astro | | Front-end |
| tailwindcss | | Estilos |

Herramientas: MongoDB Community Server, MongoDB Compass, Postman, VS Code, Claude Code.

## 7. Mejoras implementadas
TODO: ajustar a lo que efectivamente quedó.
- Migración de JSON a MongoDB con script de **seed** (`npm run seed`).
- Arquitectura en capas **route → action → schema**.
- Reservas con **populate** (ya no se cruzan los datos a mano).
- Contraseñas con **Bcrypt**; ninguna respuesta devuelve el `password`.
- **JWT** en el header `Authorization` mediante un middleware de Express.
- El `id` del cliente de la reserva sale del token (no se puede reservar a nombre de otro).
- Validación de ObjectId y de integridad (no se borra una excursión o un cliente con reservas).
- Front: login con contraseña, token en sessionStorage y cierre de sesión automático ante un 401.
- Colección de Postman con variables y token automático.

## 8. Cómo ejecutarlo
```bash
# 1) MongoDB corriendo en mongodb://localhost:27017
# 2) Back-end
cp .env.example .env        # completar JWT_SECRET
npm install
npm run seed
npm run dev                 # http://localhost:3000
# 3) Front-end
cd client && npm install && npm run dev   # http://localhost:4321
```
Usuario de prueba: `sofia.bernal@gmail.com` / `astro1234`

## 9. Pruebas
Capturas en `capturas-postman/` y colección en `postman/`.
TODO: tabla de pruebas con captura.

## 10. Reflexión (opcional)
- **Dificultades:** TODO
- **Aprendizajes:** TODO
- **Lo que más disfruté:** TODO
- **Qué mejoraría:** roles (admin), refresh token, deploy, tests automáticos.
