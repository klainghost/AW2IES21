import { Router } from 'express'
import { readFile, writeFile } from 'fs/promises'
import { calcularTotal, detalleReserva } from '../utils/reservas.js'

const router = Router()

const fileReservas = await readFile('./data/reservas.json', 'utf-8')
let reservasData = JSON.parse(fileReservas)

/* ========== GET ========== */

// Todas las reservas
router.get('/all', (req, res) => {
    res.status(200).json(reservasData)
})

// Una reserva por id, con el detalle (nombre del cliente y de las excursiones)
router.get('/byId/:id', async (req, res) => {
    const id = parseInt(req.params.id)

    try {
        const result = reservasData.find(e => e.id === id)

        if (result) {
            const clientesData = JSON.parse(await readFile('./data/clientes.json', 'utf-8'))
            const excursionesData = JSON.parse(await readFile('./data/excursiones.json', 'utf-8'))
            res.status(200).json(detalleReserva(result, clientesData, excursionesData))
        } else {
            res.status(404).json(`La reserva ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al obtener la reserva')
    }
})

// Todas las reservas de un cliente
router.get('/byCliente/:id_cliente', (req, res) => {
    const id_cliente = parseInt(req.params.id_cliente)
    const result = reservasData.filter(e => e.id_cliente === id_cliente)

    if (result.length > 0) {
        res.status(200).json(result)
    } else {
        res.status(404).json(`El cliente ${id_cliente} no tiene reservas`)
    }
})

/* ========== POST ========== */

// Crear una reserva nueva
router.post('/', async (req, res) => {
    const id_cliente = req.body.id_cliente
    const fecha_reserva = req.body.fecha_reserva
    const fecha_excursion = req.body.fecha_excursion
    const cantidad_personas = req.body.cantidad_personas
    const excursiones = req.body.excursiones

    try {
        // Leemos clientes y excursiones actuales para validar la integridad
        const clientesData = JSON.parse(await readFile('./data/clientes.json', 'utf-8'))
        const excursionesData = JSON.parse(await readFile('./data/excursiones.json', 'utf-8'))

        const cliente = clientesData.find(e => e.id === id_cliente)
        // Excursiones pedidas que no existen o no están disponibles
        const invalidas = excursiones.filter(e => {
            const excursion = excursionesData.find(x => x.id === e.id_excursion)
            return excursion === undefined || excursion.disponible === false
        })

        if (cliente === undefined) {
            res.status(400).json(`El cliente ${id_cliente} no existe`)
        } else if (cliente.activo === false) {
            res.status(400).json(`El cliente ${id_cliente} no está activo`)
        } else if (invalidas.length > 0) {
            res.status(400).json('Una o más excursiones no existen o no están disponibles')
        } else {
            const nuevaReserva = {
                id: reservasData[reservasData.length - 1].id + 1,
                id_cliente: id_cliente,
                fecha_reserva: fecha_reserva,
                fecha_excursion: fecha_excursion,
                cantidad_personas: cantidad_personas,
                pagado: false,
                total: calcularTotal(excursiones, excursionesData),
                excursiones: excursiones
            }
            reservasData.push(nuevaReserva)
            await writeFile('./data/reservas.json', JSON.stringify(reservasData, null, 2))
            res.status(200).json(detalleReserva(nuevaReserva, clientesData, excursionesData))
        }
    } catch (error) {
        res.status(500).json('Error al crear la reserva')
    }
})

// Reservas entre dos fechas de excursión
router.post('/byFecha', (req, res) => {
    const desde = req.body.desde
    const hasta = req.body.hasta

    const result = reservasData.filter(e => e.fecha_excursion >= desde && e.fecha_excursion <= hasta)

    if (result.length > 0) {
        res.status(200).json(result)
    } else {
        res.status(404).json(`No hay reservas entre ${desde} y ${hasta}`)
    }
})

/* ========== PUT ========== */

// Marcar una reserva como pagada
router.put('/pagar/:id', async (req, res) => {
    const id = parseInt(req.params.id)

    try {
        const index = reservasData.findIndex(e => e.id === id)
        if (index !== -1) {
            reservasData[index].pagado = true
            await writeFile('./data/reservas.json', JSON.stringify(reservasData, null, 2))
            res.status(200).json(`Reserva ${id} pagada!!`)
        } else {
            res.status(404).json(`La reserva ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al actualizar la reserva')
    }
})

/* ========== DELETE ========== */

// Eliminar una reserva (nadie depende de una reserva, se puede borrar siempre)
router.delete('/delete/:id', async (req, res) => {
    const id = parseInt(req.params.id)

    try {
        const index = reservasData.findIndex(e => e.id === id)
        if (index !== -1) {
            reservasData = reservasData.filter(e => e.id !== id)
            await writeFile('./data/reservas.json', JSON.stringify(reservasData, null, 2))
            res.status(200).json(`Reserva ${id} eliminada`)
        } else {
            res.status(404).json(`La reserva ${id} no se encuentra`)
        }
    } catch (error) {
        // 500: paraíso del front...
        res.status(500).json('Error al eliminar la reserva... (Front, podés descansar)')
    }
})

export default router
