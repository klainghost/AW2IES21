// Calcula el total de una reserva: precio por persona x cantidad, de cada excursión
export const calcularTotal = (excursionesReserva, excursionesData) => {
    let total = 0
    excursionesReserva.map(e => {
        const excursion = excursionesData.find(x => x.id === e.id_excursion)
        total = total + excursion.precio_por_persona * e.cantidad_personas
    })
    return total
}

// Arma el detalle de una reserva con los nombres en lugar de solo los ids
export const detalleReserva = (reserva, clientesData, excursionesData) => {
    const cliente = clientesData.find(e => e.id === reserva.id_cliente)

    return {
        id: reserva.id,
        cliente: `${cliente.nombre} ${cliente.apellido}`,
        fecha_reserva: reserva.fecha_reserva,
        fecha_excursion: reserva.fecha_excursion,
        cantidad_personas: reserva.cantidad_personas,
        pagado: reserva.pagado,
        total: reserva.total,
        excursiones: reserva.excursiones.map(e => {
            const excursion = excursionesData.find(x => x.id === e.id_excursion)
            return {
                excursion: excursion.nombre,
                cantidad_personas: e.cantidad_personas
            }
        })
    }
}
