export const formatoPrecio = (numero) =>
    numero.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

// "2026-11-01" → "01/11/2026"
export const formatoFecha = (fecha) => fecha.split('-').reverse().join('/')

// Fecha local en formato YYYY-MM-DD, sumando días (0 = hoy, 1 = mañana)
export const fechaISO = (dias = 0) => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + dias)
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
    return fecha.toISOString().slice(0, 10)
}
