// Variables de entorno: tiene que ser el PRIMER import. En ES Modules los
// imports se ejecutan antes que el resto del código, así que un dotenv.config()
// más abajo llegaría tarde para los módulos que leen process.env al cargarse
import 'dotenv/config'

import express from 'express'
import cors from 'cors'

import { connectToDatabase } from './db/connection.js'
import clientesRouter from './routes/clientes.routes.js'
import excursionesRouter from './routes/excursiones.routes.js'
import reservasRouter from './routes/reservas.routes.js'

// Se conecta al arrancar para ver enseguida si Mongo está disponible.
// La conexión queda cacheada y la reusan todas las actions
connectToDatabase()
    .then(() => console.log('Conectado a MongoDB'))
    .catch(error => console.log('No se pudo conectar a MongoDB:', error.message))

// instancia de app
const app = express()

// Configuración del puerto
const port = process.env.PORT

// El front (Astro) corre en otro puerto → hay que habilitar CORS
app.use(cors())
app.use(express.json())

app.listen(port, () => {
    console.log(`Servidor levantado en puerto ${port}`)
})

/* RUTAS */
app.get('/', (req, res) => {
    res.send('API de Excursiones - ver README.md para las rutas')
})

app.use('/clientes', clientesRouter)
app.use('/excursiones', excursionesRouter)
app.use('/reservas', reservasRouter)
