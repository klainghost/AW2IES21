import { Router } from 'express'
import mongoose from 'mongoose'
import { auth } from '../utils/middleware.js'
import { calcularTotal } from '../utils/reservas.js'
import { findAll, findById, findByCliente, findByFecha, create, pagar, deleteById } from '../db/actions/reserva.actions.js'
import { findById as findClienteById } from '../db/actions/cliente.actions.js'
import { findByIds as findExcursionesByIds } from '../db/actions/excursion.actions.js'

const router = Router()

// Todas las rutas de reservas requieren estar logueado (son datos personales):
// router.use aplica el middleware auth a todas las rutas de este router
router.use(auth)

// ¿La reserva es del usuario logueado? (cliente viene populado: { _id, nombre, ... })
const esDelUsuario = (reserva, req) => reserva.cliente !== null && reserva.cliente._id === req.user.id

// Convierte un string a Date; null si no es una fecha válida
const aFecha = (valor) => {
    const fecha = new Date(valor)
    return typeof valor === 'string' && !isNaN(fecha) ? fecha : null
}

// Fecha de hoy (hora local del servidor) como "AAAA-MM-DD".
// Se comparan días y no horas: "2026-12-20" se guarda como medianoche UTC, que en
// Argentina (UTC-3) es el día anterior a las 21 h → comparando Dates, "mañana" fallaría de noche
const hoyISO = () => {
    const hoy = new Date()
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset())
    return hoy.toISOString().slice(0, 10)
}

/* ========== GET ========== */

// Todas las reservas (con nombres del cliente y de las excursiones vía populate)
router.get('/all', async (req, res) => {
    try {
        const result = await findAll()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json('Error al obtener las reservas')
    }
})

// Una reserva por id, con el detalle (solo si es del usuario logueado)
router.get('/byId/:id', async (req, res) => {
    const id = req.params.id

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }

    try {
        const result = await findById(id)
        if (!result) {
            res.status(404).json(`La reserva ${id} no se encuentra`)
        } else if (!esDelUsuario(result, req)) {
            res.status(403).json('No podés ver una reserva de otro cliente')
        } else {
            res.status(200).json(result)
        }
    } catch (error) {
        res.status(500).json('Error al obtener la reserva')
    }
})

// Todas las reservas de un cliente (solo las propias)
router.get('/byCliente/:id_cliente', async (req, res) => {
    const id_cliente = req.params.id_cliente

    if (!mongoose.isValidObjectId(id_cliente)) {
        return res.status(400).json(`El id ${id_cliente} no es válido`)
    }
    // 403: el token es válido (sabemos quién es), pero pide reservas de otro cliente
    if (id_cliente !== req.user.id) {
        return res.status(403).json('No podés ver las reservas de otro cliente')
    }

    try {
        const result = await findByCliente(id_cliente)
        if (result.length > 0) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`El cliente ${id_cliente} no tiene reservas`)
        }
    } catch (error) {
        res.status(500).json('Error al obtener las reservas')
    }
})

/* ========== POST ========== */

// Crear una reserva nueva (la "compra" del carrito)
// Body: { fecha_excursion, excursiones: [{ excursion: <id>, cantidad_personas }] }
router.post('/', async (req, res) => {
    // El cliente sale del token, NO del body: nadie puede reservar a nombre de otro
    const id_cliente = req.user.id
    const fecha_excursion = aFecha(req.body.fecha_excursion)
    const excursiones = req.body.excursiones

    // Validaciones del body antes de ir a la base
    if (!fecha_excursion) {
        return res.status(400).json('fecha_excursion es obligatoria y tiene que ser una fecha válida (AAAA-MM-DD)')
    }
    if (fecha_excursion.toISOString().slice(0, 10) <= hoyISO()) {
        return res.status(400).json('La fecha de la excursión tiene que ser futura')
    }
    if (!Array.isArray(excursiones) || excursiones.length === 0) {
        return res.status(400).json('La reserva tiene que incluir al menos una excursión')
    }
    const itemInvalido = excursiones.find(e =>
        !mongoose.isValidObjectId(e?.excursion) || !Number.isInteger(e.cantidad_personas) || e.cantidad_personas < 1
    )
    if (itemInvalido) {
        return res.status(400).json('Cada excursión necesita un id válido y una cantidad_personas entera mayor a 0')
    }

    try {
        // El token puede ser de un cliente que después se borró o se desactivó
        const cliente = await findClienteById(id_cliente)
        if (!cliente) {
            return res.status(400).json(`El cliente ${id_cliente} no existe`)
        }
        if (cliente.activo === false) {
            return res.status(400).json(`El cliente ${id_cliente} no está activo`)
        }

        // Una sola query para todas las excursiones pedidas
        const excursionesData = await findExcursionesByIds(excursiones.map(e => e.excursion))
        const invalidas = excursiones.filter(e => {
            const excursion = excursionesData.find(x => x.id === e.excursion)
            return excursion === undefined || excursion.disponible === false
        })
        if (invalidas.length > 0) {
            return res.status(400).json('Una o más excursiones no existen o no están disponibles')
        }

        // El total se calcula en el servidor con los precios de la base (no se confía en el front)
        const nuevaReserva = await create({
            cliente: id_cliente,
            excursiones: excursiones.map(e => ({ excursion: e.excursion, cantidad_personas: e.cantidad_personas })),
            fecha_reserva: new Date(),
            fecha_excursion,
            // Personas del grupo = la excursión con más personas (mismo criterio que el carrito)
            cantidad_personas: Math.max(...excursiones.map(e => e.cantidad_personas)),
            pagado: false,
            total: calcularTotal(excursiones, excursionesData)
        })
        res.status(200).json(nuevaReserva)
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json(error.message)
        } else {
            res.status(500).json('Error al crear la reserva')
        }
    }
})

// Reservas entre dos fechas de excursión
router.post('/byFecha', async (req, res) => {
    const desde = aFecha(req.body.desde)
    const hasta = aFecha(req.body.hasta)

    if (!desde || !hasta) {
        return res.status(400).json('desde y hasta tienen que ser fechas válidas (AAAA-MM-DD)')
    }

    try {
        const result = await findByFecha(desde, hasta)
        if (result.length > 0) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`No hay reservas entre ${req.body.desde} y ${req.body.hasta}`)
        }
    } catch (error) {
        res.status(500).json('Error al buscar las reservas')
    }
})

/* ========== PUT ========== */

// Marcar una reserva como pagada (solo el dueño de la reserva)
router.put('/pagar/:id', async (req, res) => {
    const id = req.params.id

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }

    try {
        const reserva = await findById(id)
        if (!reserva) {
            return res.status(404).json(`La reserva ${id} no se encuentra`)
        }
        if (!esDelUsuario(reserva, req)) {
            return res.status(403).json('No podés pagar una reserva de otro cliente')
        }
        if (reserva.pagado) {
            return res.status(400).json(`La reserva ${id} ya está pagada`)
        }

        await pagar(id)
        res.status(200).json(`Reserva ${id} pagada!!`)
    } catch (error) {
        res.status(500).json('Error al actualizar la reserva')
    }
})

/* ========== DELETE ========== */

// Eliminar una reserva (nadie depende de una reserva, se puede borrar siempre; solo el dueño)
router.delete('/delete/:id', async (req, res) => {
    const id = req.params.id

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }

    try {
        const reserva = await findById(id)
        if (!reserva) {
            return res.status(404).json(`La reserva ${id} no se encuentra`)
        }
        if (!esDelUsuario(reserva, req)) {
            return res.status(403).json('No podés eliminar una reserva de otro cliente')
        }

        await deleteById(id)
        res.status(200).json(`Reserva ${id} eliminada`)
    } catch (error) {
        // 500: paraíso del front...
        res.status(500).json('Error al eliminar la reserva... (Front, podés descansar)')
    }
})

export default router
