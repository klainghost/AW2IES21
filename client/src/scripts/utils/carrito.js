// Carrito en localStorage (queda guardado aunque se cierre el navegador)
const KEY = 'carrito'

// Los ids ahora son ObjectId de Mongo (24 caracteres hexadecimales)
const esIdValido = (id) => typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id)

export const getCarrito = () => {
    try {
        const carrito = JSON.parse(localStorage.getItem(KEY)) || []
        // Limpia ítems de un carrito viejo con ids numéricos (de cuando los datos estaban en JSON):
        // esas excursiones ya no existen con ese id
        const limpio = carrito.filter(e => esIdValido(e.id))
        if (limpio.length !== carrito.length) localStorage.setItem(KEY, JSON.stringify(limpio))
        return limpio
    } catch {
        return []
    }
}

const guardarCarrito = (carrito) => {
    localStorage.setItem(KEY, JSON.stringify(carrito))
    // Avisa al navbar para que actualice el contador
    window.dispatchEvent(new Event('carrito-actualizado'))
}

export const agregarAlCarrito = (excursion) => {
    const carrito = getCarrito()
    const item = carrito.find(e => e.id === excursion.id)

    if (item) {
        item.cantidad++
    } else {
        carrito.push({
            id: excursion.id,
            nombre: excursion.nombre,
            precio: excursion.precio_por_persona,
            cantidad: 1
        })
    }
    guardarCarrito(carrito)
}

// delta = +1 o -1. Si llega a 0 se quita del carrito
export const cambiarCantidad = (id, delta) => {
    const carrito = getCarrito()
    const item = carrito.find(e => e.id === id)
    if (!item) return

    item.cantidad += delta
    guardarCarrito(item.cantidad > 0 ? carrito : carrito.filter(e => e.id !== id))
}

export const quitarDelCarrito = (id) => guardarCarrito(getCarrito().filter(e => e.id !== id))

export const vaciarCarrito = () => guardarCarrito([])

export const cantidadTotal = () => getCarrito().reduce((acc, e) => acc + e.cantidad, 0)

export const totalCarrito = () => getCarrito().reduce((acc, e) => acc + e.precio * e.cantidad, 0)
