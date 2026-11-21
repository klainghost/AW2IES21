// Calcula el total de una reserva: precio por persona x cantidad, de cada excursión.
// excursionesReserva: [{ excursion: id, cantidad_personas }] (lo que llega en el body)
// excursionesData: las excursiones traídas de Mongo (con su precio actual)
export const calcularTotal = (excursionesReserva, excursionesData) => {
    let total = 0
    excursionesReserva.map(e => {
        const excursion = excursionesData.find(x => x.id === e.excursion)
        total = total + excursion.precio_por_persona * e.cantidad_personas
    })
    return total
}

// detalleReserva (cruce manual de JSONs) ya no hace falta: lo reemplaza populate()
// en db/actions/reserva.actions.js
