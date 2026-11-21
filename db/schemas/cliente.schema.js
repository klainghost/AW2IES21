import mongoose from 'mongoose'
const { Schema, models, model } = mongoose

const ClienteSchema = new Schema({
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    // unique crea un índice: Mongo rechaza un email repetido (error E11000)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Se guarda el hash de bcrypt, nunca la contraseña en texto plano.
    // select: false → ninguna query lo trae salvo que se pida con .select('+password') (solo el login)
    password: { type: String, required: true, select: false },
    telefono: { type: String, trim: true },
    edad: { type: Number, min: 0 },
    ciudad: { type: String, trim: true },
    activo: { type: Boolean, default: true },
    fecha_registro: { type: Date, default: Date.now }
}, {
    timestamps: true,
    // Sin el campo __v (contador de versión interno de Mongoose) en los documentos
    versionKey: false,
    collection: 'clientes',
    toJSON: {
        // Expone "id" además de "_id" (el front ya usa .id)
        virtuals: true,
        // Segunda protección: al serializar (res.json / JSON.stringify) se borra el hash.
        // Cubre el caso de create(), que devuelve el documento completo con password
        transform: (doc, ret) => {
            delete ret.password
            return ret
        }
    }
})

// models.cliente || ... evita "Cannot overwrite model" cuando node --watch recarga
const Cliente = models.cliente || model('cliente', ClienteSchema)
export default Cliente
