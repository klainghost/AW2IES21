import { connectToDatabase } from '../connection.js'
import Excursion from '../schemas/excursion.schema.js'
import Reserva from '../schemas/reserva.schema.js'

// Todas las actions siguen el mismo patrón:
// conectar → query → devolver objeto plano (JSON.parse(JSON.stringify(...)))
// y en el catch se relanza el error para que la ruta responda 400/500
// (si solo se logueara, la ruta recibiría undefined y respondería 200 vacío)

export const findAll = async () => {
    try {
        await connectToDatabase()
        const res = await Excursion.find()
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Devuelve null si no existe
export const findById = async (id) => {
    try {
        await connectToDatabase()
        const res = await Excursion.findById(id)
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Varias excursiones de una sola query ($in = "el _id está en esta lista").
// Lo usa la creación de reservas para validar todas las excursiones juntas
export const findByIds = async (ids) => {
    try {
        await connectToDatabase()
        const res = await Excursion.find({ _id: { $in: ids } })
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

export const findDisponibles = async () => {
    try {
        await connectToDatabase()
        const res = await Excursion.find({ disponible: true })
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

export const findByDificultad = async (dificultad) => {
    try {
        await connectToDatabase()
        const res = await Excursion.find({ dificultad })
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Rango de precio: $gte (mayor o igual) y $lte (menor o igual)
export const findByPrecio = async (min, max) => {
    try {
        await connectToDatabase()
        const res = await Excursion.find({ precio_por_persona: { $gte: min, $lte: max } })
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// create valida contra el Schema (required, enum, min) antes de insertar
export const create = async (datos) => {
    try {
        await connectToDatabase()
        const res = await Excursion.create(datos)
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// returnDocument: 'after' → devuelve la excursión ya actualizada (equivale al { new: true }
// que en Mongoose 9 quedó deprecado). runValidators → aplica el min: 0 del Schema también acá
export const updatePrecio = async (id, precio_por_persona) => {
    try {
        await connectToDatabase()
        const res = await Excursion.findByIdAndUpdate(
            id,
            { precio_por_persona },
            { returnDocument: 'after', runValidators: true }
        )
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Cuántas reservas incluyen esta excursión (se busca dentro del array excursiones)
export const countReservas = async (id) => {
    try {
        await connectToDatabase()
        return await Reserva.countDocuments({ 'excursiones.excursion': id })
    } catch (error) {
        throw error
    }
}

// Devuelve la excursión borrada, o null si no existía
export const deleteById = async (id) => {
    try {
        await connectToDatabase()
        const res = await Excursion.findByIdAndDelete(id)
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}
