import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getMailClient } from '../lib/mail'
import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { ClienteErrors } from '../errors/client-errors'
import { env } from '../env'

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string({ required_error: 'Campo destination é obrigatório' }).min(4),
                //tente converter o starts_at para uma data, caso não consiga retorna erro
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email()),
            })
        },
    }, async(request, response) => {
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body

        //verifica se a data inicial da viagem é anterior a data atual
        if (dayjs(starts_at).isBefore(new Date())) {
            throw new ClienteErrors('Data de início da viagem invalida.')
        }

        if (dayjs(ends_at).isBefore(starts_at)) {
            throw new ClienteErrors('Data de fim da viagem invalida.')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
                participant: {
                    createMany: {
                        data: [
                            {
                                name: owner_name,
                                email: owner_email,
                                is_owner: true,
                                is_confirmed: true,
                            },
                            ...emails_to_invite.map(email => {
                                return {email}
                            })
                        ],
                    }
                }
            }
        })

        const formattedStartDate = dayjs(starts_at).format('LL')
        const formattedEndDate = dayjs(ends_at).format('LL')

        const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

        const mail = await getMailClient()

        const messege = await mail.sendMail({
            from: {
                name: 'Equipe SodaTI',
                address: 'soda@ti.com',
            },
            to: {
                name: owner_name,
                address: owner_email,
            },
            subject: `Confirme sua Viagem para ${destination} em ${formattedStartDate}`,
            html: `
                <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;"> 
                    <p>Você foi convidado(a) para participar de uma viagem para <strong>${destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
                    <p></p>
                    <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
                    <p></p>
                    <p>
                        <a href="${confirmationLink}">Confirmar presença</a>.
                    </p>
                    <p></p>
                    <p>Caso você não saiba do que se trata esse e-mail ou não poderá estar presente, apenas ignore esse e-mail.</p>
                </div>
            `.trim()
        })

        console.log(nodemailer.getTestMessageUrl(messege))

        return {
            "trip.id": trip.id
        }
    })
}