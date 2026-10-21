import { request } from './config.js'

// La orden de compra es una reserva: el back valida el cliente y las excursiones y calcula el total
export const crearReserva = (reserva) => request('POST', '/reservas', reserva)
