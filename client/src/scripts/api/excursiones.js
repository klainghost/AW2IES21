import { request } from './config.js'

export const getExcursiones = () => request('GET', '/excursiones/all')

export const getExcursionesByDificultad = (dificultad) => request('GET', `/excursiones/byDificultad/${dificultad}`)
