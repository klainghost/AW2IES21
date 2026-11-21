import mongoose from 'mongoose'
const { Schema, models, model } = mongoose
const { ObjectId } = Schema.Types

// Cada ítem de la reserva: qué excursión y para cuántas personas.
// Se guarda una referencia (no la excursión copiada) y se completa con populate
const ItemReservaSchema = new Schema({
    excursion: { type: ObjectId, ref: 'excursion', required: true },
    cantidad_personas: { type: Number, required: true, min: 1 }
}, { _id: false })   // los ítems no necesitan un _id propio

const ReservaSchema = new Schema({
    cliente: { type: ObjectId, ref: 'cliente', required: true },
    // required en un array acepta [] → se valida a mano que haya al menos una
    excursiones: {
        type: [ItemReservaSchema],
        validate: {
            validator: (items) => items.length > 0,
            message: 'La reserva tiene que incluir al menos una excursión'
        }
    },
    fecha_reserva: { type: Date, default: Date.now },
    fecha_excursion: { type: Date, required: true },
    cantidad_personas: { type: Number, required: true, min: 1 },
    pagado: { type: Boolean, default: false },
    total: { type: Number, required: true, min: 0 }
}, {
    timestamps: true,
    // Sin el campo __v (contador de versión interno de Mongoose) en los documentos
    versionKey: false,
    collection: 'reservas',
    toJSON: { virtuals: true }
})

const Reserva = models.reserva || model('reserva', ReservaSchema)
export default Reserva
