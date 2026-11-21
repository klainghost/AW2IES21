import { connectToDatabase } from '../connection.js'
import Reserva from '../schemas/reserva.schema.js'

// populate reemplaza el ObjectId guardado por el documento al que apunta
// (como un JOIN). select elige qué campos traer de cada uno
const conDetalle = (query) => query
    .populate({ path: 'cliente', select: 'nombre apellido email' })
    .populate({ path: 'excursiones.excursion', select: 'nombre precio_por_persona' })

export const findAll = async () => {
    try {
        await connectToDatabase()
        const res = await conDetalle(Reserva.find().sort({ fecha_excursion: 1 }))
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Devuelve null si no existe
export const findById = async (id) => {
    try {
        await connectToDatabase()
        const res = await conDetalle(Reserva.findById(id))
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

export const findByCliente = async (id_cliente) => {
    try {
        await connectToDatabase()
        const res = await conDetalle(Reserva.find({ cliente: id_cliente }).sort({ fecha_excursion: 1 }))
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Reservas cuya fecha de excursión cae entre desde y hasta (inclusive)
export const findByFecha = async (desde, hasta) => {
    try {
        await connectToDatabase()
        const res = await conDetalle(
            Reserva.find({ fecha_excursion: { $gte: desde, $lte: hasta } }).sort({ fecha_excursion: 1 })
        )
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Crea la reserva y la devuelve ya populada (con nombres en vez de solo ids)
export const create = async (datos) => {
    try {
        await connectToDatabase()
        const nueva = await Reserva.create(datos)
        const res = await conDetalle(Reserva.findById(nueva._id))
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

export const pagar = async (id) => {
    try {
        await connectToDatabase()
        const res = await Reserva.findByIdAndUpdate(id, { pagado: true }, { returnDocument: 'after' })
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

export const deleteById = async (id) => {
    try {
        await connectToDatabase()
        const res = await Reserva.findByIdAndDelete(id)
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}
