import { Router } from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
    findAll, findById, findByCiudad, findByEmail, findParaLogin,
    create, updateTelefono, countReservas, deleteById
} from '../db/actions/cliente.actions.js'

const router = Router()

// Rondas de bcrypt (2^10 iteraciones): más rondas = más lento de romper por fuerza bruta
const SALT_ROUNDS = 10
const PASSWORD_MIN = 8

// Los emails se guardan en minúscula y sin espacios: se normaliza igual al buscar
const normalizarEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : ''

/* ========== GET ========== */

// Todos los clientes
router.get('/all', async (req, res) => {
    try {
        const result = await findAll()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json('Error al obtener los clientes')
    }
})

// Un cliente por id
router.get('/byId/:id', async (req, res) => {
    const id = req.params.id

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }

    try {
        const result = await findById(id)
        if (result) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`El cliente ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al obtener el cliente')
    }
})

// Clientes de una ciudad
router.get('/byCiudad/:ciudad', async (req, res) => {
    const ciudad = req.params.ciudad

    try {
        const result = await findByCiudad(ciudad)
        if (result.length > 0) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`No hay clientes en ${ciudad}`)
        }
    } catch (error) {
        res.status(500).json('Error al obtener los clientes')
    }
})

/* ========== POST ========== */

// Registro de un cliente nuevo
router.post('/', async (req, res) => {
    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const email = normalizarEmail(req.body.email)
    const password = req.body.password
    const telefono = req.body.telefono
    const edad = req.body.edad
    const ciudad = req.body.ciudad

    // Se valida ANTES de hashear: el hash de un string vacío no está vacío,
    // así que el required del Schema no lo detectaría
    if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
        return res.status(400).json(`La contraseña es obligatoria y debe tener al menos ${PASSWORD_MIN} caracteres`)
    }

    try {
        const existe = await findByEmail(email)
        if (existe) {
            return res.status(400).json(`Ya existe un cliente con el email ${email}`)
        }

        // bcrypt.hash (versión async de hashSync) para no bloquear el servidor mientras calcula
        const hash = await bcrypt.hash(password, SALT_ROUNDS)

        // activo y fecha_registro los pone el servidor, no el body
        const nuevoCliente = await create({
            nombre, apellido, email, telefono, edad, ciudad,
            password: hash,
            activo: true,
            fecha_registro: new Date()
        })
        res.status(200).json(nuevoCliente)
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json(error.message)
        } else if (error.code === 11000) {
            // Índice unique del email: cubre dos registros simultáneos con el mismo email
            res.status(400).json(`Ya existe un cliente con el email ${email}`)
        } else {
            res.status(500).json('Error al crear el cliente')
        }
    }
})

// Login: devuelve un JWT que el front manda en las acciones protegidas (ej: reservar)
router.post('/login', async (req, res) => {
    const email = normalizarEmail(req.body.email)
    const password = req.body.password

    if (!email || typeof password !== 'string' || !password) {
        return res.status(400).json('Faltan email y/o contraseña')
    }

    try {
        const result = await findParaLogin(email)
        if (!result) {
            return res.status(404).json(`No hay ningún cliente con el email ${email}`)
        }

        // No se "desencripta": bcrypt hashea lo que escribió el usuario con la misma sal y compara
        const passwordOk = await bcrypt.compare(password, result.hash)
        if (!passwordOk) {
            return res.status(401).json('Contraseña incorrecta')
        }

        // Se chequea después de la contraseña: así no se revela el estado de una cuenta ajena
        if (!result.cliente.activo) {
            return res.status(403).json('El cliente no está activo')
        }

        // El payload se puede leer (jwt.io): solo datos no sensibles, nunca el password
        const payload = { id: result.cliente.id, email: result.cliente.email, nombre: result.cliente.nombre }
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' })

        res.status(200).json({ token, cliente: result.cliente })
    } catch (error) {
        res.status(500).json('Error al iniciar sesión')
    }
})

// Buscar un cliente por email (dato sensible: va en el body, no en la URL)
router.post('/byEmail', async (req, res) => {
    const email = normalizarEmail(req.body.email)

    try {
        const result = await findByEmail(email)
        if (result) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`No hay ningún cliente con el email ${email}`)
        }
    } catch (error) {
        res.status(500).json('Error al buscar el cliente')
    }
})

/* ========== PUT ========== */

// Actualizar el teléfono de un cliente
router.put('/telefono/update/:id', async (req, res) => {
    const id = req.params.id
    const nuevo_telefono = req.body.telefono

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }
    if (typeof nuevo_telefono !== 'string' || !nuevo_telefono.trim()) {
        return res.status(400).json('El teléfono es obligatorio')
    }

    try {
        const result = await updateTelefono(id, nuevo_telefono)
        if (result) {
            res.status(200).json('Teléfono actualizado!!')
        } else {
            res.status(404).json(`El cliente ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al actualizar el teléfono')
    }
})

/* ========== DELETE ========== */

// Eliminar un cliente (solo si no tiene reservas → integridad de datos)
router.delete('/delete/:id', async (req, res) => {
    const id = req.params.id

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }

    try {
        const cliente = await findById(id)
        if (!cliente) {
            return res.status(404).json(`El cliente ${id} no se encuentra`)
        }

        const cantidadReservas = await countReservas(id)
        if (cantidadReservas > 0) {
            res.status(400).json(`No se puede eliminar el cliente ${id} porque tiene ${cantidadReservas} reserva/s. Primero elimine sus reservas.`)
        } else {
            await deleteById(id)
            res.status(200).json(`Cliente ${id} eliminado`)
        }
    } catch (error) {
        res.status(500).json('Error al eliminar el cliente')
    }
})

export default router
