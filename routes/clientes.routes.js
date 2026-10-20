import { Router } from 'express'
import { readFile, writeFile } from 'fs/promises'

const router = Router()

const fileClientes = await readFile('./data/clientes.json', 'utf-8')
let clientesData = JSON.parse(fileClientes)

/* ========== GET ========== */

// Todos los clientes
router.get('/all', (req, res) => {
    res.status(200).json(clientesData)
})

// Un cliente por id
router.get('/byId/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const result = clientesData.find(e => e.id === id)

    if (result) {
        res.status(200).json(result)
    } else {
        res.status(404).json(`El cliente ${id} no se encuentra`)
    }
})

// Clientes de una ciudad
router.get('/byCiudad/:ciudad', (req, res) => {
    const ciudad = req.params.ciudad
    const result = clientesData.filter(e => e.ciudad === ciudad)

    if (result.length > 0) {
        res.status(200).json(result)
    } else {
        res.status(404).json(`No hay clientes en ${ciudad}`)
    }
})

/* ========== POST ========== */

// Crear un cliente nuevo
router.post('/', async (req, res) => {
    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const email = req.body.email
    const telefono = req.body.telefono
    const edad = req.body.edad
    const ciudad = req.body.ciudad
    const fecha_registro = req.body.fecha_registro

    try {
        const existe = clientesData.find(e => e.email === email)
        if (existe) {
            res.status(400).json(`Ya existe un cliente con el email ${email}`)
        } else {
            const nuevoCliente = {
                id: clientesData[clientesData.length - 1].id + 1,
                nombre: nombre,
                apellido: apellido,
                email: email,
                telefono: telefono,
                edad: edad,
                ciudad: ciudad,
                activo: true,
                fecha_registro: fecha_registro
            }
            clientesData.push(nuevoCliente)
            await writeFile('./data/clientes.json', JSON.stringify(clientesData, null, 2))
            res.status(200).json(nuevoCliente)
        }
    } catch (error) {
        res.status(500).json('Error al crear el cliente')
    }
})

// Buscar un cliente por email (dato sensible: va en el body, no en la URL)
router.post('/byEmail', (req, res) => {
    const email = req.body.email
    const result = clientesData.find(e => e.email === email)

    if (result) {
        res.status(200).json(result)
    } else {
        res.status(404).json(`No hay ningún cliente con el email ${email}`)
    }
})

/* ========== PUT ========== */

// Actualizar el teléfono de un cliente
router.put('/telefono/update/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    const nuevo_telefono = req.body.telefono

    try {
        const index = clientesData.findIndex(e => e.id === id)
        if (index !== -1) {
            clientesData[index].telefono = nuevo_telefono
            await writeFile('./data/clientes.json', JSON.stringify(clientesData, null, 2))
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
    const id = parseInt(req.params.id)

    try {
        const index = clientesData.findIndex(e => e.id === id)
        if (index !== -1) {
            // Leemos las reservas actuales para ver si el cliente tiene alguna
            const fileReservas = await readFile('./data/reservas.json', 'utf-8')
            const reservasData = JSON.parse(fileReservas)
            const reservasDelCliente = reservasData.filter(e => e.id_cliente === id)

            if (reservasDelCliente.length > 0) {
                res.status(400).json(`No se puede eliminar el cliente ${id} porque tiene ${reservasDelCliente.length} reserva/s. Primero elimine sus reservas.`)
            } else {
                clientesData = clientesData.filter(e => e.id !== id)
                await writeFile('./data/clientes.json', JSON.stringify(clientesData, null, 2))
                res.status(200).json(`Cliente ${id} eliminado`)
            }
        } else {
            res.status(404).json(`El cliente ${id} no se encuentra`)
        }
    } catch (error) {
        res.status(500).json('Error al eliminar el cliente')
    }
})

export default router
