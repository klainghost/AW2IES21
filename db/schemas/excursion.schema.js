import mongoose from 'mongoose'
const { Schema, models, model } = mongoose

const ExcursionSchema = new Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    duracion_horas: { type: Number, required: true, min: 0 },
    precio_por_persona: { type: Number, required: true, min: 0 },
    incluye_almuerzo: { type: Boolean, default: false },
    incluye_guia: { type: Boolean, default: false },
    dificultad: { type: String, required: true, enum: ['baja', 'moderada', 'alta'] },
    disponible: { type: Boolean, default: true },
    imagen: { type: String, trim: true }
}, {
    // Sin esto Mongoose pluraliza "excursion" como "excursions"
    collection: 'excursiones',
    // Sin el campo __v (contador de versión interno de Mongoose) en los documentos
    versionKey: false,
    toJSON: { virtuals: true }
})

const Excursion = models.excursion || model('excursion', ExcursionSchema)
export default Excursion
