import express from 'express'
import dotenv from 'dotenv'

import clientesRouter from './routes/clientes.routes.js'
import excursionesRouter from './routes/excursiones.routes.js'
import reservasRouter from './routes/reservas.routes.js'

/// traer nuestras variables de entorno
dotenv.config()

// instancia de app
const app = express()

// Configuración del puerto
const port = process.env.PORT

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
