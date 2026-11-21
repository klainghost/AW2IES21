**IES 21** – Aplicaciones Web 2
Entrega TP4 – Autenticación (JWT + Bcrypt) y migración a MongoDB
Moya Cristian Gabriel

# Astroturismo – API de Excursiones + Front

## Links
- **Repositorio:** https://github.com/klainghost/AW2IES21/tree/TP4
- **Video explicativo:**  https://youtu.be/NAkYEk3v-KE
- **Deploy:**el proyecto se ejecuta en local

---

## 1. Descripción general
Aplicación web para una agencia de astroturismo de Malargüe. El cliente se registra, inicia sesión con email y contraseña, ve y filtra excursiones, las suma a un carrito y confirma la compra, que genera una **reserva**.

En esta entrega:
- los datos pasaron de archivos JSON a **MongoDB** (con Mongoose);
- las contraseñas se guardan **hasheadas con Bcrypt**;
- el login devuelve un **JWT**, y la compra y el resto de las acciones sensibles solo se pueden hacer con un token válido.

## 2. Arquitectura
Monorepo: API **Express** en la raíz y front **Astro** en `client/`.

```
├── db/
│   ├── connection.js        ← conexión a MongoDB (cacheada)
│   ├── schemas/             ← cliente, excursion, reserva (Schema + Model)
│   ├── actions/             ← todas las queries de Mongoose
│   └── seed.js              ← carga inicial desde data/*.json
├── routes/                  ← endpoints HTTP (route → action)
├── utils/
│   ├── middleware.js        ← middleware auth (verifica el JWT)
│   └── reservas.js          ← cálculo del total de una reserva
├── data/                    ← JSON originales (solo los usa el seed)
├── postman/                 ← colección de pruebas
├── index.js                 ← servidor Express
└── client/                  ← front Astro + Tailwind
```

**Flujo de un pedido:** `route` → `action` → respuesta.
- La **route** solo maneja HTTP: lee el request, valida los datos (por ejemplo, que el id tenga formato de ObjectId), llama a una action y responde con el código que corresponde.
- La **action** es la única que habla con Mongo. Se conecta, hace la query y devuelve un objeto plano. Si algo falla, relanza el error para que la ruta responda 400 o 500. Si solo lo logueara, la ruta respondería 200 vacío.
- Las rutas protegidas pasan antes por el middleware `auth`.

**Conexión cacheada:** `connectToDatabase()` guarda la conexión la primera vez y después la reutiliza. Cada action la llama, pero no se abre una conexión nueva por request. Usa `bufferCommands: false`: si Mongo no está disponible, la query falla enseguida en lugar de quedar esperando.

## 3. Modelo de datos (MongoDB)
Base `astroturismo`, con tres colecciones:

| Colección | Campos | Relaciones |
|---|---|---|
| `clientes` | nombre, apellido, email (`unique`, en minúsculas), password (hash, `select: false`), telefono, edad, ciudad, activo, fecha_registro, createdAt, updatedAt | — |
| `excursiones` | nombre, descripcion, duracion_horas, precio_por_persona (`min: 0`), incluye_almuerzo, incluye_guia, dificultad (`enum: baja / moderada / alta`), disponible, imagen | — |
| `reservas` | cliente, excursiones `[{ excursion, cantidad_personas }]`, fecha_reserva, fecha_excursion, cantidad_personas, pagado, total, createdAt, updatedAt | `cliente` → clientes · `excursiones[].excursion` → excursiones |

- **Referencias en lugar de datos embebidos.** Una reserva guarda solo el `ObjectId` del cliente y de cada excursión. Así, si cambia el nombre de una excursión, no hay que actualizar copias en cada reserva.
- **`populate`** reemplaza esos `ObjectId` por los documentos a los que apuntan, igual que un JOIN en SQL. Con eso, `GET /reservas/byId/:id` devuelve el nombre del cliente y el de cada excursión sin cruzar los datos a mano.
- **IDs:** Mongo genera un `_id` (ObjectId). Los schemas exponen también `id` (virtual, con `toJSON: { virtuals: true }`), que es el campo que ya usaba el front.
- **Integridad:** Mongo no impide borrar un documento referenciado, así que el control se hace en la API. No se puede borrar un cliente que tenga reservas ni una excursión que figure en alguna reserva (responde 400).

**Seed:** `npm run seed` vacía las tres colecciones y las carga desde `data/*.json`. Los JSON usaban ids numéricos. El seed traduce cada id viejo al `ObjectId` nuevo con un `Map` y así arma las referencias de las reservas. Si una reserva apunta a algo que no existe, se corta en lugar de guardar una referencia rota. A cada cliente le asigna la contraseña de prueba `astro1234`, hasheada con bcrypt.

## 4. Autenticación

### Bcrypt: contraseñas
- Nunca se guarda la contraseña: se guarda su **hash**, que es una huella que no se puede revertir.
- Bcrypt le agrega una **sal** aleatoria a cada hash. Por eso, en Compass, la misma contraseña `astro1234` aparece con un hash distinto en cada cliente.
- Para el login no se "desencripta" nada: se hashea lo que escribió el usuario con la misma sal y se compara con el guardado (`bcrypt.compare`).
- Se usan 10 rondas (2^10 iteraciones). Más rondas hacen el hash más lento de calcular, y por lo tanto más difícil de romper por fuerza bruta.
- **El hash nunca sale de la API**, por dos vías:
  - El campo tiene `select: false`, así que ninguna query lo trae, salvo la del login, que lo pide con `.select('+password')`.
  - El `toJSON` del schema lo borra al serializar. Esto cubre el documento que devuelve `create()`.

### JWT: sesión sin estado
- Un JWT tiene tres partes: `header.payload.firma`.
- El payload **se puede leer**: cualquiera puede verlo, por ejemplo en jwt.io. Lo que no se puede es **modificarlo** sin que la firma deje de coincidir. Por eso el payload lleva solo `{ id, email, nombre }`, nunca la contraseña.
- Se firma con `JWT_SECRET`, que está en el `.env` y no en el código. Vence en 24 h (`JWT_EXPIRES_IN`).
- El servidor no guarda sesiones. En cada request verifica la firma y el vencimiento del token.

**Flujo:**
1. **Registro** (`POST /clientes`): se valida que la contraseña tenga al menos 8 caracteres, se hashea y se guarda el cliente. Un email repetido da 400.
2. **Login** (`POST /clientes/login`):
   - busca el cliente por email (404 si no existe);
   - compara la contraseña con bcrypt (401 si no coincide);
   - si el cliente está inactivo, responde 403;
   - si todo está bien, firma el token y responde `{ token, cliente }`.
3. **Rutas protegidas:** el cliente manda el header `Authorization: Bearer <token>`. El middleware `auth` verifica el token con `jwt.verify`:
   - si es válido, deja `{ id, email, nombre }` en `req.user` y sigue;
   - si falta, está adulterado o venció, responde **401**.
4. **Comprar** (`POST /reservas`): el cliente de la reserva sale de `req.user.id`, **no del body**. Aunque alguien mande otro `id_cliente`, la reserva queda a nombre del dueño del token.

**401 o 403:** **401** significa que la API no sabe quién sos (no hay token o el token no es válido). **403** significa que sabe quién sos, pero no tenés permiso. Por ejemplo, pedir las reservas de otro cliente o pagar una reserva ajena da 403.

### Rutas protegidas
| Ruta | Regla |
|---|---|
| Todas las de `/reservas` | token obligatorio |
| `GET /reservas/byId/:id`, `/byCliente/:id_cliente`, `PUT /reservas/pagar/:id`, `DELETE /reservas/delete/:id` | además, la reserva tiene que ser tuya (si no, 403) |
| `GET /clientes/all`, `/byId/:id`, `/byCiudad/:ciudad`, `POST /clientes/byEmail` | token obligatorio (exponen emails y teléfonos) |
| `PUT /clientes/telefono/update/:id`, `DELETE /clientes/delete/:id` | token + solo sobre tu propio cliente (si no, 403) |
| `POST /excursiones`, `PUT /excursiones/precio/update/:id`, `DELETE /excursiones/delete/:id` | token obligatorio |
| GET de excursiones, `POST /excursiones/byPrecio`, `POST /clientes`, `POST /clientes/login` | públicas |

## 5. Endpoints
🔒 = requiere `Authorization: Bearer <token>`. En las rutas con `:id`, si el id no tiene formato de ObjectId, la respuesta es 400.

### Clientes – `/clientes`
| Método | Ruta | Descripción | Body | |
|---|---|---|---|---|
| POST | `/clientes` | Registro (la contraseña se guarda hasheada) | `{ "nombre", "apellido", "email", "password", "telefono", "edad", "ciudad" }` | |
| POST | `/clientes/login` | Login → `{ token, cliente }` | `{ "email", "password" }` | |
| GET | `/clientes/all` | Todos los clientes | — | 🔒 |
| GET | `/clientes/byId/:id` | Un cliente | — | 🔒 |
| GET | `/clientes/byCiudad/:ciudad` | Clientes de una ciudad | — | 🔒 |
| POST | `/clientes/byEmail` | Busca un cliente por email | `{ "email" }` | 🔒 |
| PUT | `/clientes/telefono/update/:id` | Actualiza tu teléfono | `{ "telefono" }` | 🔒 propio |
| DELETE | `/clientes/delete/:id` | Elimina tu cliente si no tiene reservas | — | 🔒 propio |

### Excursiones – `/excursiones`
| Método | Ruta | Descripción | Body | |
|---|---|---|---|---|
| GET | `/excursiones/all` | Todas | — | |
| GET | `/excursiones/byId/:id` | Una excursión | — | |
| GET | `/excursiones/disponibles` | Solo las disponibles | — | |
| GET | `/excursiones/byDificultad/:dificultad` | Por dificultad (`baja`, `moderada`, `alta`) | — | |
| POST | `/excursiones/byPrecio` | Rango de precio | `{ "min", "max" }` | |
| POST | `/excursiones` | Crea una excursión | `{ "nombre", "descripcion", "duracion_horas", "precio_por_persona", "incluye_almuerzo", "incluye_guia", "dificultad", "imagen" }` | 🔒 |
| PUT | `/excursiones/precio/update/:id` | Actualiza el precio | `{ "precio_por_persona" }` | 🔒 |
| DELETE | `/excursiones/delete/:id` | Elimina si no está en ninguna reserva | — | 🔒 |

### Reservas – `/reservas` (todas 🔒)
| Método | Ruta | Descripción | Body |
|---|---|---|---|
| POST | `/reservas` | **Comprar**: crea la reserva del usuario logueado y la devuelve populada | `{ "fecha_excursion": "AAAA-MM-DD", "excursiones": [{ "excursion": "<id>", "cantidad_personas": 2 }] }` |
| GET | `/reservas/all` | Todas las reservas (populadas) | — |
| GET | `/reservas/byId/:id` | Una reserva propia (populada) | — |
| GET | `/reservas/byCliente/:id_cliente` | Tus reservas | — |
| POST | `/reservas/byFecha` | Reservas entre dos fechas de excursión | `{ "desde", "hasta" }` |
| PUT | `/reservas/pagar/:id` | Marca como pagada una reserva propia | — |
| DELETE | `/reservas/delete/:id` | Elimina una reserva propia | — |

**El back calcula al crear una reserva:**
- el cliente, que sale del token;
- el `total`, con los precios de la base, así que no se confía en el front;
- la `fecha_reserva`;
- `pagado: false`;
- la `cantidad_personas` del grupo, que es la excursión con más personas.

**Validaciones de la reserva:**
- el cliente existe y está activo;
- cada excursión existe y está disponible (se valida en una sola query, con `$in`);
- la fecha de la excursión es futura.

### Códigos de respuesta
| Código | Cuándo |
|---|---|
| 200 | Operación correcta |
| 400 | Datos inválidos (id con formato incorrecto, validación del schema, fecha pasada, email repetido) o la operación rompería la integridad de los datos |
| 401 | Falta el token, está adulterado o venció; contraseña incorrecta en el login |
| 403 | Token válido, pero sin permiso sobre ese recurso; cliente inactivo en el login |
| 404 | No se encontró el registro |
| 500 | Error del servidor (por ejemplo, Mongo no disponible) |

## 6. Tecnologías y dependencias

**Back-end** (`package.json`)
| Paquete | Versión | Uso |
|---|---|---|
| express | 5.3.0 | Servidor y ruteo |
| mongoose | 9.12.3 | ODM para MongoDB: schemas, validaciones, queries, populate |
| bcrypt | 6.0.0 | Hash de contraseñas |
| jsonwebtoken | 9.0.3 | Firma y verificación de tokens JWT |
| dotenv | 18.0.8 | Variables de entorno desde `.env` |
| cors | 2.8.6 | Permite que el front (puerto 4321) consuma la API (puerto 3000) |

**Front-end** (`client/package.json`)
| Paquete | Versión | Uso |
|---|---|---|
| astro | 7.4.1 | Framework del front |
| tailwindcss | 4.3.3 | Estilos |
| @tailwindcss/vite | 4.3.3 | Integración de Tailwind con Astro |

**Herramientas:** Node.js 24, MongoDB Community Server, MongoDB Compass, Postman, VS Code, Git y GitHub.

**Variables de entorno** (`.env`, no se sube al repo; plantilla en `.env.example`)
| Variable | Ejemplo |
|---|---|
| `PORT` | `3000` |
| `MONGODB_URI` | `mongodb://localhost:27017` |
| `MONGODB_DB` | `astroturismo` |
| `JWT_SECRET` | string largo y aleatorio |
| `JWT_EXPIRES_IN` | `24h` |

## 7. Mejoras implementadas
**Base de datos**
- Migración de JSON a **MongoDB**, con un script de **seed** que traduce los ids numéricos a `ObjectId` y arma las referencias.
- Arquitectura en capas **route → action → schema**. Las actions relanzan el error para que la ruta responda el código correcto.
- Reservas con **referencias + `populate`**. Se eliminó el código que cruzaba los JSON a mano.
- **Validaciones en los schemas:** campos obligatorios, `enum` de dificultad, mínimos (precio, cantidad de personas) y email único en minúsculas. También se validan al actualizar (`runValidators`).
- **Validación de ObjectId** antes de buscar, que responde 400 en lugar de un error de Mongo.
- **Integridad:** no se borran clientes ni excursiones que tengan reservas.

**Autenticación**
- **Bcrypt**: ninguna respuesta devuelve el `password` (`select: false` + `toJSON`).
- **JWT** en el header `Authorization`, verificado por un middleware de Express. Hay mensajes distintos para token faltante, adulterado o vencido.
- **Permisos por dueño (403):** solo podés ver, pagar o borrar tus reservas y modificar tu propio cliente.
- El cliente de la reserva y el total se calculan en el servidor, a partir del token y de los precios de la base.

**Front**
- Login con email y contraseña. Token en sessionStorage, enviado como `Bearer` en cada request.
- **Cierre de sesión automático ante un 401**, por ejemplo si el token venció.
- Ids como string (ObjectId) y limpieza automática del carrito viejo con ids numéricos.
- La confirmación de compra usa la reserva populada (nombre del cliente y de las excursiones).

**Pruebas**
- Colección de Postman con 46 requests, tests de código de respuesta y token e ids guardados automáticamente en variables.

## 8. Cómo ejecutarlo
Requisitos: Node.js y MongoDB corriendo en `mongodb://localhost:27017`.

```bash
# Back-end (desde la raíz)
cp .env.example .env        # completar JWT_SECRET
npm install
npm run seed                # carga clientes, excursiones y reservas en Mongo
npm run dev                 # http://localhost:3000

# Front-end (otra terminal)
cd client
npm install
npm run dev                 # http://localhost:4321
```
Usuario de prueba: `sofia.bernal@gmail.com` / `astro1234`. Todos los clientes del seed tienen la contraseña `astro1234`.

## 9. Pruebas
**Colección de Postman:** `postman/TP4-Astroturismo.postman_collection.json`. Se importa en Postman y se corre en orden; el login de la carpeta 1 guarda el token. Tiene cuatro carpetas:
1. **Auth:** login 200 / 401 / 404 / 403, registro, email repetido y contraseña corta.
2. **Excursiones – CRUD:** incluye create sin token (401) y delete bloqueado por integridad (400).
3. **Clientes – CRUD:** incluye GET sin token (401), update de otro cliente (403) y delete con reservas (400).
4. **Reservas – CRUD:** comprar sin token, con token adulterado y con token válido, leer la reserva populada, ver reservas de otro cliente (403), pagar y borrar.

**Capturas** en `capturas-postman/`:
| Prueba | Captura |
|---|---|
| Login correcto → 200 con token | TODO |
| Login con contraseña incorrecta → 401 | TODO |
| Comprar sin token → 401 | TODO |
| Comprar con token → 200 (reserva populada) | TODO |
| `GET /reservas/byId/:id` populada | TODO |
| Delete bloqueado por integridad → 400 | TODO |
| Compass con las 3 colecciones | TODO |

## 10. Reflexión
- **Dificultades:** TODO
- **Aprendizajes:** TODO
- **Lo que más disfruté:** TODO
- **Qué mejoraría:** roles (administrador para gestionar excursiones), refresh token, deploy (MongoDB Atlas + hosting del back y del front) y tests automáticos.
