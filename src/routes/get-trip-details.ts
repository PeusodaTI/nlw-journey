import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { ClienteErrors } from '../errors/client-errors'

export async function getTripDetails(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            })
        },
    }, async(request, response) => {
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            select: {
                id: true,
                destination: true,
                created_at: true,
                ends_at: true,
                is_confirmed: true,
            },
            where: {
                id: tripId
            }
        })

        if (!trip) {
            throw new ClienteErrors('Viagem não encontrada.')
        }

        return { trip }
    })
}