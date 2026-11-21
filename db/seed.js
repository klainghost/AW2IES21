// Carga los datos de data/*.json en MongoDB.
// Uso: npm run seed   (borra las 3 colecciones y las vuelve a llenar)
import 'dotenv/config'
import { readFile } from 'fs/promises'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

import { connectToDatabase } from './connection.js'
import Cliente from './schemas/cliente.schema.js'
import Excursion from './schemas/excursion.schema.js'
import Reserva from './schemas/reserva.schema.js'

// Contraseña de prueba para todos los clientes del seed
const PASSWORD_PRUEBA = 'astro1234'
// Rondas de bcrypt (2^10 iteraciones): más rondas = más lento de romper por fuerza bruta
const SALT_ROUNDS = 10

const leerJSON = async (archivo) => JSON.parse(await readFile(new URL(`../data/${archivo}`, import.meta.url), 'utf-8'))

const seed = async () => {
    await connectToDatabase()
    console.log(`Conectado a MongoDB (base: ${mongoose.connection.name})`)

    const clientesData = await leerJSON('clientes.json')
    const excursionesData = await leerJSON('excursiones.json')
    const reservasData = await leerJSON('reservas.json')

    // 1. Vaciar las colecciones (las reservas primero, porque apuntan a las otras dos)
    await Reserva.deleteMany({})
    await Cliente.deleteMany({})
    await Excursion.deleteMany({})
    // Asegura que exista el índice unique del email antes de insertar
    await Cliente.init()

    // 2. Clientes: se saca el id numérico (Mongo genera _id) y se hashea la contraseña.
    // Cada hash lleva su propia sal: en Compass, la misma contraseña se ve distinta en cada cliente
    const clientesNuevos = await Promise.all(clientesData.map(async ({ id, ...cliente }) => ({
        ...cliente,
        password: await bcrypt.hash(PASSWORD_PRUEBA, SALT_ROUNDS)
    })))
    const clientes = await Cliente.insertMany(clientesNuevos)

    // insertMany devuelve los documentos en el mismo orden que el array:
    // con eso se arma el Map  id viejo (número) → _id nuevo (ObjectId)
    const idsClientes = new Map(clientesData.map((c, i) => [c.id, clientes[i]._id]))

    // 3. Excursiones: mismo procedimiento
    const excursiones = await Excursion.insertMany(excursionesData.map(({ id, ...excursion }) => excursion))
    const idsExcursiones = new Map(excursionesData.map((e, i) => [e.id, excursiones[i]._id]))

    // 4. Reservas: los id_cliente / id_excursion numéricos se traducen a ObjectId.
    // Si un JSON apunta a algo que no existe, se corta acá (no se guardan referencias rotas)
    const reservasNuevas = reservasData.map(r => {
        const cliente = idsClientes.get(r.id_cliente)
        if (!cliente) throw new Error(`Reserva ${r.id}: el cliente ${r.id_cliente} no existe en clientes.json`)

        return {
            cliente,
            excursiones: r.excursiones.map(item => {
                const excursion = idsExcursiones.get(item.id_excursion)
                if (!excursion) throw new Error(`Reserva ${r.id}: la excursión ${item.id_excursion} no existe en excursiones.json`)
                return { excursion, cantidad_personas: item.cantidad_personas }
            }),
            fecha_reserva: r.fecha_reserva,
            fecha_excursion: r.fecha_excursion,
            cantidad_personas: r.cantidad_personas,
            pagado: r.pagado,
            total: r.total
        }
    })
    const reservas = await Reserva.insertMany(reservasNuevas)

    // 5. Resumen para chequear contra Compass
    console.log(`\n${clientes.length} clientes, ${excursiones.length} excursiones, ${reservas.length} reservas cargadas`)

    console.log(`\nClientes (contraseña de todos: ${PASSWORD_PRUEBA})`)
    console.table(clientes.map(c => ({ _id: c._id.toString(), email: c.email, activo: c.activo })))

    console.log('Excursiones')
    console.table(excursiones.map(e => ({ _id: e._id.toString(), nombre: e.nombre, disponible: e.disponible })))

    // Para cada reserva: a qué cliente y excursiones apunta (con el nombre al lado del ObjectId)
    const nombreCliente = new Map(clientes.map(c => [c._id.toString(), `${c.nombre} ${c.apellido}`]))
    const nombreExcursion = new Map(excursiones.map(e => [e._id.toString(), e.nombre]))
    console.log('Reservas → referencias')
    reservas.forEach(r => {
        console.log(`  ${r._id}  cliente: ${r.cliente} (${nombreCliente.get(r.cliente.toString())})`)
        r.excursiones.forEach(item => {
            console.log(`      excursion: ${item.excursion} (${nombreExcursion.get(item.excursion.toString())}) x${item.cantidad_personas}`)
        })
    })
}

seed()
    .catch(error => {
        console.log('Error en el seed:', error.message)
        process.exitCode = 1
    })
    // Se cierra la conexión para que el proceso termine
    .finally(() => mongoose.disconnect())
