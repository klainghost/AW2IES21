// Hace cruzar la estrella fugaz por la pantalla (ver components/EstrellaFugaz.astro)
export const lanzarEstrellaFugaz = () => {
    const capa = document.getElementById('estrellaFugaz')
    capa.classList.remove('activa')
    void capa.offsetWidth // reinicia la animación si se lanza dos veces seguidas
    capa.classList.add('activa')
    setTimeout(() => capa.classList.remove('activa'), 1500)
}
