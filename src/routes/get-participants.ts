import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { ClienteErrors } from '../errors/client-errors'

export async function getParticipants(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/participants', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            })
        },
    }, async(request, response) => {
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
            include: {
                participant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        is_confirmed: true,
                    }
                }
            }
        })

        if (!trip) {
            throw new ClienteErrors('Viagem não encontrada.')
        }

        

        return { activities: trip.participant }
    })
}