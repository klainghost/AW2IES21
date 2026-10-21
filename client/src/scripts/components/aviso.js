// Aviso flotante (toast) que desaparece solo
export const mostrarAviso = (mensaje, tipo = 'ok') => {
    const aviso = document.createElement('div')
    aviso.setAttribute('role', 'status')
    aviso.className = `fixed bottom-6 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border bg-noche-900 px-4 py-3 text-center text-sm font-semibold shadow-lg ${
        tipo === 'error' ? 'border-atardecer/60 text-atardecer' : 'border-bosque-claro/60 text-luna'
    }`
    aviso.textContent = mensaje
    document.body.append(aviso)
    setTimeout(() => aviso.remove(), 2500)
}
