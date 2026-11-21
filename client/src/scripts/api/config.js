import { getToken, removeSession } from '../utils/session.js'

// URL del back-end (Express). El front de Astro corre en otro puerto (4321)
export const API_URL = 'http://localhost:3000'

// Wrapper de fetch: todas las llamadas al back pasan por acá
export const request = async (method, ruta, body) => {
    const opciones = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    }
    if (body !== undefined) opciones.body = JSON.stringify(body)

    // Si hay sesión, se manda el JWT en el header (lo verifica el middleware auth del back)
    const token = getToken()
    if (token) opciones.headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${API_URL}${ruta}`, opciones)
    const data = await res.json().catch(() => null)

    // 401 con token = el token venció o no es válido → se cierra la sesión y vuelve al login.
    // (Sin token, el 401 es del propio login con contraseña incorrecta: ese lo maneja la página)
    if (res.status === 401 && token) {
        removeSession()
        window.location.href = '/?sesion=vencida'
    }

    return { ok: res.ok, status: res.status, data }
}
