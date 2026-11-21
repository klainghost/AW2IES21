import jwt from 'jsonwebtoken'

// Middleware de autenticación: se pone antes del handler en las rutas protegidas
//   router.post('/', auth, async (req, res) => { ... req.user.id ... })
// El token viaja en el header  Authorization: Bearer <token>
// Si es válido, deja el payload ({ id, email, nombre }) en req.user y sigue (next).
// Si no, corta con 401: "no sé quién sos" (403 queda para "sé quién sos, pero no podés")
export const auth = (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || '').split(' ')

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json('Falta el token (header Authorization: Bearer <token>)')
    }

    try {
        // verify comprueba la firma con el secret y la fecha de vencimiento:
        // si alguien modificó el payload o el token venció, tira error
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json('El token venció, iniciá sesión de nuevo')
        } else {
            res.status(401).json('Token inválido')
        }
    }
}
