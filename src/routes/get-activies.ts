import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'

export async function getActivies(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activies', {
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
                activies: {
                    orderBy: {
                        occurs_at: 'asc',
                    }
                }
            }
        })

        if (!trip) {
            throw new Error('Viagem não encontrada.')
        }

        const differenceInDaysBetweenTripStartAndEnd = dayjs(trip.ends_at).diff(trip.starts_at, 'days')

        const activities = Array.from({ length: differenceInDaysBetweenTripStartAndEnd + 1 }).map((_, index) => {
            const date = dayjs(trip.starts_at).add(index, 'days')

            return {
                data: date.toDate(),
                activities: trip.activies.filter(activity => {
                    return dayjs(activity.occurs_at).isSame(date, 'day')
                })
            }
        }) 

        return { activities }
    })
}