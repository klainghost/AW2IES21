import { request } from './config.js'

// Login: el back compara la contraseña con bcrypt y devuelve { token, cliente }.
// Email y contraseña van en el body (datos sensibles: nunca en la URL)
export const login = (email, password) => request('POST', '/clientes/login', { email, password })
