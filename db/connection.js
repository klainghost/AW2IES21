import mongoose from 'mongoose'

// Se guarda la conexión en global para reusarla: cada action llama a
// connectToDatabase() y no queremos abrir una conexión nueva por request
let cached = global.mongoose || { conn: null, promise: null }
global.mongoose = cached

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn

    // Se lee acá adentro (y no al importar el archivo) para que funcione
    // aunque dotenv se cargue después de los imports
    const MONGODB_URI = process.env.MONGODB_URI
    if (!MONGODB_URI) throw new Error('MONGODB_URI is missing')

    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: process.env.MONGODB_DB || 'astroturismo',
        // Si no hay conexión, la query falla enseguida en vez de quedar esperando
        bufferCommands: false
    })

    try {
        cached.conn = await cached.promise
    } catch (error) {
        // Si falló, se limpia la promesa para poder reintentar en el próximo request
        cached.promise = null
        throw error
    }

    return cached.conn
}
