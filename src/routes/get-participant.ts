import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { ClienteErrors } from '../errors/client-errors'

export async function getParticipant(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/participant/:participantId', {
        schema: {
            params: z.object({
                participantId: z.string().uuid(),
            })
        },
    }, async(request, response) => {
        const { participantId } = request.params

        const participant = await prisma.participant.findUnique({
            select: {
                id: true,
                name: true,
                email: true,
                is_confirmed: true,
            },
            where: {
                id: participantId
            }
        })

        if (!participant) {
            throw new ClienteErrors('Participante não encontrado.')
        }

        return { participant }
    })
}