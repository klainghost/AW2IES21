import { connectToDatabase } from '../connection.js'
import Cliente from '../schemas/cliente.schema.js'
import Reserva from '../schemas/reserva.schema.js'

// Mismo patrón que excursion.actions.js. El password nunca sale de acá:
// tiene select: false en el Schema y además el toJSON lo borra

export const findAll = async () => {
    try {
        await connectToDatabase()
        const res = await Cliente.find()
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Devuelve null si no existe
export const findById = async (id) => {
    try {
        await connectToDatabase()
        const res = await Cliente.findById(id)
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

export const findByCiudad = async (ciudad) => {
    try {
        await connectToDatabase()
        const res = await Cliente.find({ ciudad })
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Devuelve null si no existe
export const findByEmail = async (email) => {
    try {
        await connectToDatabase()
        const res = await Cliente.findOne({ email })
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Solo para el login: es la única query que pide el hash (+password).
// Devuelve el cliente ya serializado (sin password) y el hash por separado,
// así la ruta puede compararlo sin riesgo de mandarlo en la respuesta
export const findParaLogin = async (email) => {
    try {
        await connectToDatabase()
        const res = await Cliente.findOne({ email }).select('+password')
        if (!res) return null
        return { cliente: JSON.parse(JSON.stringify(res)), hash: res.password }
    } catch (error) {
        throw error
    }
}

// Recibe la contraseña YA hasheada (el hash se hace en la ruta)
export const create = async (datos) => {
    try {
        await connectToDatabase()
        const res = await Cliente.create(datos)
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

export const updateTelefono = async (id, telefono) => {
    try {
        await connectToDatabase()
        const res = await Cliente.findByIdAndUpdate(
            id,
            { telefono },
            { returnDocument: 'after', runValidators: true }
        )
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}

// Cuántas reservas tiene el cliente (para no dejar reservas huérfanas al borrar)
export const countReservas = async (id) => {
    try {
        await connectToDatabase()
        return await Reserva.countDocuments({ cliente: id })
    } catch (error) {
        throw error
    }
}

export const deleteById = async (id) => {
    try {
        await connectToDatabase()
        const res = await Cliente.findByIdAndDelete(id)
        return JSON.parse(JSON.stringify(res))
    } catch (error) {
        throw error
    }
}
