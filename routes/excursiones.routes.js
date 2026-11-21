import { Router } from 'express'
import mongoose from 'mongoose'
import {
    findAll, findById, findDisponibles, findByDificultad, findByPrecio,
    create, updatePrecio, countReservas, deleteById
} from '../db/actions/excursion.actions.js'

const router = Router()

// La ruta no habla con Mongo: lee el request, llama a una action y responde

/* ========== GET ========== */

// Todas las excursiones
router.get('/all', async (req, res) => {
    try {
        const result = await findAll()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json('Error al obtener las excursiones')
    }
})

// Una excursión por id
router.get('/byId/:id', async (req, res) => {
    const id = req.params.id

    // Si no tiene formato de ObjectId, Mongo tiraría CastError → se corta antes con 400
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }

    try {
        const result = await findById(id)
        if (result) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`La excursión ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al obtener la excursión')
    }
})

// Solo las excursiones disponibles
router.get('/disponibles', async (req, res) => {
    try {
        const result = await findDisponibles()
        if (result.length > 0) {
            res.status(200).json(result)
        } else {
            res.status(404).json('No hay excursiones disponibles')
        }
    } catch (error) {
        res.status(500).json('Error al obtener las excursiones')
    }
})

// Excursiones por dificultad (baja, moderada, alta)
router.get('/byDificultad/:dificultad', async (req, res) => {
    const dificultad = req.params.dificultad.toLowerCase()

    try {
        const result = await findByDificultad(dificultad)
        if (result.length > 0) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`No hay excursiones de dificultad ${dificultad}`)
        }
    } catch (error) {
        res.status(500).json('Error al obtener las excursiones')
    }
})

/* ========== POST ========== */

// Crear una excursión nueva
router.post('/', async (req, res) => {
    const nombre = req.body.nombre
    const descripcion = req.body.descripcion
    const duracion_horas = req.body.duracion_horas
    const precio_por_persona = req.body.precio_por_persona
    const incluye_almuerzo = req.body.incluye_almuerzo
    const incluye_guia = req.body.incluye_guia
    const dificultad = req.body.dificultad
    const imagen = req.body.imagen

    try {
        // disponible no se toma del body: toda excursión nueva arranca disponible
        const nuevaExcursion = await create({
            nombre, descripcion, duracion_horas, precio_por_persona,
            incluye_almuerzo, incluye_guia, dificultad, imagen,
            disponible: true
        })
        res.status(200).json(nuevaExcursion)
    } catch (error) {
        // ValidationError: falta un campo required, dificultad fuera del enum, etc.
        if (error.name === 'ValidationError') {
            res.status(400).json(error.message)
        } else {
            res.status(500).json('Error al crear la excursión')
        }
    }
})

// Buscar excursiones por rango de precio
router.post('/byPrecio', async (req, res) => {
    const min = req.body.min
    const max = req.body.max

    if (typeof min !== 'number' || typeof max !== 'number') {
        return res.status(400).json('min y max tienen que ser números')
    }

    try {
        const result = await findByPrecio(min, max)
        if (result.length > 0) {
            res.status(200).json(result)
        } else {
            res.status(404).json(`No hay excursiones entre $${min} y $${max}`)
        }
    } catch (error) {
        res.status(500).json('Error al buscar las excursiones')
    }
})

/* ========== PUT ========== */

// Actualizar el precio de una excursión
router.put('/precio/update/:id', async (req, res) => {
    const id = req.params.id
    const nuevo_precio = req.body.precio_por_persona

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }
    if (typeof nuevo_precio !== 'number') {
        return res.status(400).json('precio_por_persona tiene que ser un número')
    }

    try {
        const result = await updatePrecio(id, nuevo_precio)
        if (result) {
            res.status(200).json('Precio actualizado!!')
        } else {
            res.status(404).json(`La excursión ${id} no se encuentra`)
        }
    } catch (error) {
        // Ej: precio negativo (min: 0 en el Schema, se valida por runValidators)
        if (error.name === 'ValidationError') {
            res.status(400).json(error.message)
        } else {
            res.status(500).json('Error al actualizar el precio')
        }
    }
})

/* ========== DELETE ========== */

// Eliminar una excursión (solo si ninguna reserva la incluye → integridad de datos)
router.delete('/delete/:id', async (req, res) => {
    const id = req.params.id

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json(`El id ${id} no es válido`)
    }

    try {
        const excursion = await findById(id)
        if (!excursion) {
            return res.status(404).json(`La excursión ${id} no se encuentra`)
        }

        // Mongo no impide borrar algo referenciado: el control lo hacemos nosotros
        const cantidadReservas = await countReservas(id)
        if (cantidadReservas > 0) {
            res.status(400).json(`No se puede eliminar la excursión ${id} porque está en ${cantidadReservas} reserva/s.`)
        } else {
            await deleteById(id)
            res.status(200).json(`Excursión ${id} eliminada`)
        }
    } catch (error) {
        res.status(500).json('Error al eliminar la excursión')
    }
})

export default router
