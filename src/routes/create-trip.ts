import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import dayjs from 'dayjs'
import z from 'zod'

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(4),
                //tente converter o starts_at para uma data, caso não consiga retorna erro
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
            })
        },
    }, async(request, response) => {
        const { destination, starts_at, ends_at, owner_name, owner_email } = request.body

        //verifica se a data inicial da viagem é anterior a data atual
        if (dayjs(starts_at).isBefore(new Date())) {
            throw new Error('Data de início da viagem invalida.')
        }

        if (dayjs(ends_at).isBefore(starts_at)) {
            throw new Error('Data de fim da viagem invalida.')
        }

        return {
            destination,
            starts_at,
            ends_at
        }
    })
}