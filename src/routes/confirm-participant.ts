import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'

export async function confirmParticipants(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId/confirm/', {
        schema: {
            params: z.object({
                participantId: z.string().uuid(),
            })
        },
    }, async(request, reply) => {

        const { participantId } = request.params

        const participant = await prisma.participant.findUnique({
            where: {
                id: participantId,
            }
        })

        if (!participant) {
            throw new Error('Participante não encontrado.')
        }

        if (participant.is_confirmed) {
            return reply.redirect('http://localhost:3000/home')
        }

        await prisma.participant.update({
            where: {
                id: participant.id,
            },
            data: {
                is_confirmed: true,
            }
        })

        return reply.redirect(`http://localhost:3000/home`)
    })
}