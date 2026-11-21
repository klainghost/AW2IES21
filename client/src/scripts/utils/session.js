// Sesión del usuario en sessionStorage (se borra al cerrar la pestaña)
// Se guarda lo que devuelve POST /clientes/login: { token, cliente }
const KEY = 'user'

export const setSession = (sesion) => sessionStorage.setItem(KEY, JSON.stringify(sesion))

export const getSession = () => {
    try {
        const sesion = JSON.parse(sessionStorage.getItem(KEY))
        // Una sesión sin token (formato viejo, de antes del login con JWT) no sirve
        if (!sesion?.token || !sesion?.cliente) return null
        return sesion
    } catch {
        return null
    }
}

export const getToken = () => getSession()?.token ?? null

export const removeSession = () => sessionStorage.removeItem(KEY)
