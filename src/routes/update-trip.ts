import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { ClienteErrors } from '../errors/client-errors'

export async function updateTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                destination: z.string().min(4),
                //tente converter o starts_at para uma data, caso não consiga retorna erro
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
            })
        },
    }, async(request, response) => {
        const { destination, starts_at, ends_at } = request.body
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            }
        })

        if (!trip) {
            throw new ClienteErrors('Viagem não encontrada.')
        }

        //verifica se a data inicial da viagem é anterior a data atual
        if (dayjs(starts_at).isBefore(new Date())) {
            throw new ClienteErrors('Data de início da viagem invalida.')
        }

        if (dayjs(ends_at).isBefore(starts_at)) {
            throw new ClienteErrors('Data de fim da viagem invalida.')
        }

        await prisma.trip.update({
            where: {
                id: tripId,
            },
            data: {
                destination,
                starts_at,
                ends_at,
            }
        })

        return {
            "trip.id": trip.id
        }
    })
}