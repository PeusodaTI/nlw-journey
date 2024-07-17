import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { ClienteErrors } from './errors/client-errors'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
    //verifica se o erro está relacionado a validação dos dados da requisição
    if (error instanceof ZodError) {
        return reply.status(400).send({
            message: 'Input invalido',
            errors: error.flatten().fieldErrors
        })
    }

    //Verifica se o erro foi capturado dentro da execução de alguma rota
    if (error instanceof ClienteErrors) {
        return reply.status(400).send({
            message: error.message
        })
    }

    return reply.status(500).send({  message: 'Internal Server Error' })
}