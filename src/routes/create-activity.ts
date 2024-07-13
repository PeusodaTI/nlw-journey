import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'

export async function createActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activies', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                //tente converter o starts_at para uma data, caso não consiga retorna erro
                occurs_at: z.coerce.date(),
            })
        },
    }, async(request, response) => {
        const { tripId } = request.params
        const { title, occurs_at } = request.body

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            }
        })

        if (!trip) {
            throw new Error('Viagem não encontrada.')
        }

        if (dayjs(occurs_at).isBefore(trip.starts_at)) {
            throw new Error('Data da atividade invalida.')
        }

        if (dayjs(occurs_at).isAfter(trip.ends_at)) {
            throw new Error('Data da atividade invalida.')
        }

        const activity = await prisma.activity.create({
            data: {
                title,
                occurs_at,
                trip_id: tripId,
            }
        })

        return {
            "activity.id": activity.id
        }
    })
}