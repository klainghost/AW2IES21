import { Router } from 'express'
import { readFile, writeFile } from 'fs/promises'

const router = Router()

const fileExcursiones = await readFile('./data/excursiones.json', 'utf-8')
let excursionesData = JSON.parse(fileExcursiones)

/* ========== GET ========== */

// Todas las excursiones
router.get('/all', (req, res) => {
    res.status(200).json(excursionesData)
})

// Una excursión por id
router.get('/byId/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const result = excursionesData.find(e => e.id === id)

    if (result) {
        res.status(200).json(result)
    } else {
        res.status(404).json(`La excursión ${id} no se encuentra`)
    }
})

// Solo las excursiones disponibles
router.get('/disponibles', (req, res) => {
    const result = excursionesData.filter(e => e.disponible === true)

    if (result.length > 0) {
        res.status(200).json(result)
    } else {
        res.status(404).json('No hay excursiones disponibles')
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
        const nuevaExcursion = {
            id: excursionesData[excursionesData.length - 1].id + 1,
            nombre: nombre,
            descripcion: descripcion,
            duracion_horas: duracion_horas,
            precio_por_persona: precio_por_persona,
            incluye_almuerzo: incluye_almuerzo,
            incluye_guia: incluye_guia,
            dificultad: dificultad,
            disponible: true,
            imagen: imagen
        }
        excursionesData.push(nuevaExcursion)
        await writeFile('./data/excursiones.json', JSON.stringify(excursionesData, null, 2))
        res.status(200).json(nuevaExcursion)
    } catch (error) {
        res.status(500).json('Error al crear la excursión')
    }
})

// Buscar excursiones por rango de precio
router.post('/byPrecio', (req, res) => {
    const min = req.body.min
    const max = req.body.max

    const result = excursionesData.filter(e => e.precio_por_persona >= min && e.precio_por_persona <= max)

    if (result.length > 0) {
        res.status(200).json(result)
    } else {
        res.status(404).json(`No hay excursiones entre $${min} y $${max}`)
    }
})

/* ========== PUT ========== */

// Actualizar el precio de una excursión
router.put('/precio/update/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    const nuevo_precio = req.body.precio_por_persona

    try {
        const index = excursionesData.findIndex(e => e.id === id)
        if (index !== -1) {
            excursionesData[index].precio_por_persona = nuevo_precio
            await writeFile('./data/excursiones.json', JSON.stringify(excursionesData, null, 2))
            res.status(200).json('Precio actualizado!!')
        } else {
            res.status(404).json(`La excursión ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al actualizar el precio')
    }
})

/* ========== DELETE ========== */

// Eliminar una excursión (solo si ninguna reserva la incluye → integridad de datos)
router.delete('/delete/:id', async (req, res) => {
    const id = parseInt(req.params.id)

    try {
        const index = excursionesData.findIndex(e => e.id === id)
        if (index !== -1) {
            // Leemos las reservas actuales para ver si alguna incluye esta excursión
            const fileReservas = await readFile('./data/reservas.json', 'utf-8')
            const reservasData = JSON.parse(fileReservas)
            const reservasConExcursion = reservasData.filter(r => r.excursiones.find(e => e.id_excursion === id))

            if (reservasConExcursion.length > 0) {
                res.status(400).json(`No se puede eliminar la excursión ${id} porque está en ${reservasConExcursion.length} reserva/s.`)
            } else {
                excursionesData = excursionesData.filter(e => e.id !== id)
                await writeFile('./data/excursiones.json', JSON.stringify(excursionesData, null, 2))
                res.status(200).json(`Excursión ${id} eliminada`)
            }
        } else {
            res.status(404).json(`La excursión ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al eliminar la excursión')
    }
})

export default router
