import { ExcursionCard } from './excursionCard.js'
import { mostrarAviso } from './aviso.js'
import { agregarAlCarrito } from '../utils/carrito.js'

export const renderExcursiones = (contenedor, excursiones) => {
    contenedor.innerHTML = excursiones.map(e => ExcursionCard(e)).join('')
}

// Delegación de eventos: un solo listener para todos los botones "Agregar"
export const escucharAgregar = (contenedor, getExcursiones) => {
    contenedor.addEventListener('click', (e) => {
        const boton = e.target.closest('button[name="btnAgregar"]')
        if (!boton) return

        // El id es un ObjectId (string): se compara tal cual, sin Number()
        const excursion = getExcursiones().find(x => x.id === boton.dataset.id)
        if (excursion) {
            agregarAlCarrito(excursion)
            mostrarAviso(`"${excursion.nombre}" se agregó al carrito`)
        }
    })
}
