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

    const res = await fetch(`${API_URL}${ruta}`, opciones)
    const data = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, data }
}
