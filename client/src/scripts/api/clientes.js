import { request } from './config.js'

// El email va en el body (dato sensible), igual que en el TP2
export const getClienteByEmail = (email) => request('POST', '/clientes/byEmail', { email })
