import { formatoPrecio } from '../utils/formato.js'

const coloresDificultad = {
    baja: 'border-bosque-claro/50 bg-bosque/20 text-bosque-claro',
    moderada: 'border-estrella/50 bg-estrella/10 text-estrella',
    alta: 'border-atardecer/50 bg-atardecer/10 text-atardecer'
}

// Devuelve el HTML de la card de una excursión
export const ExcursionCard = (excursion) => `
    <article class="flex flex-col gap-3 rounded-2xl border border-noche-700 bg-noche-800/70 p-5 backdrop-blur-sm transition hover:border-estrella/50">
        <div class="flex items-center justify-between text-xs">
            <span class="rounded-full border px-3 py-1 font-bold capitalize ${coloresDificultad[excursion.dificultad] ?? ''}">
                ${excursion.dificultad}
            </span>
            <span class="text-niebla">${excursion.duracion_horas} h</span>
        </div>

        <h3 class="text-lg font-extrabold leading-snug">${excursion.nombre}</h3>
        <p class="grow text-sm text-niebla">${excursion.descripcion}</p>

        <ul class="flex flex-wrap gap-2 text-xs text-niebla">
            ${excursion.incluye_guia ? '<li class="rounded-full bg-noche-700/70 px-2 py-1">Con guía</li>' : ''}
            ${excursion.incluye_almuerzo ? '<li class="rounded-full bg-noche-700/70 px-2 py-1">Almuerzo incluido</li>' : ''}
        </ul>

        <div class="mt-2 flex items-center justify-between gap-3">
            <p>
                <span class="text-xl font-extrabold text-estrella">${formatoPrecio(excursion.precio_por_persona)}</span>
                <span class="text-xs text-niebla">/ persona</span>
            </p>
            ${
                excursion.disponible
                    ? `<button name="btnAgregar" data-id="${excursion.id}" class="btn-primario">Agregar</button>`
                    : '<span class="text-sm italic text-niebla">No disponible</span>'
            }
        </div>
    </article>
`
