import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'
import nodemailer from 'nodemailer'
import { ClienteErrors } from '../errors/client-errors'
import { env } from '../env'

export async function createInvite(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                email: z.string().email(),
            })
        },
    }, async(request, response) => {
        const { tripId } = request.params
        const { email } = request.body

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            }
        })

        if (!trip) {
            throw new ClienteErrors('Viagem não encontrada.')
        }

        const participant = await prisma.participant.create({
            data: {
                email: email,
                trip_id: tripId,
            }
        })

        const formattedStartDate = dayjs(trip.starts_at).format('LL')
        const formattedEndDate = dayjs(trip.ends_at).format('LL')

        const mail = await getMailClient()

        const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm/`

        const messege = await mail.sendMail({
            from: {
                name: 'Equipe SodaTI',
                address: 'soda@ti.com',
            },
            to: participant.email,
            subject: `Confirme sua presença na Viagem para ${trip.destination} em ${formattedStartDate}`,
            html: `
                <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;"> 
                    <p>Você foi convidado(a) para participar de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
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

        return { participantId: participant.id }
    })
}