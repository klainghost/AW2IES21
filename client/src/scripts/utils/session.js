// Sesión del usuario en sessionStorage (se borra al cerrar la pestaña)
const KEY = 'user'

export const setSession = (user) => sessionStorage.setItem(KEY, JSON.stringify(user))

export const getSession = () => JSON.parse(sessionStorage.getItem(KEY))

export const removeSession = () => sessionStorage.removeItem(KEY)
