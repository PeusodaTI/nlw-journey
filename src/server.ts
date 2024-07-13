import fastify from 'fastify'
import cors from '@fastify/cors'
import { createTrip } from './routes/create-trip'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { confirmTrip } from './routes/confirm-trip'
import { confirmParticipants } from './routes/confirm-participant'
import { createActivity } from './routes/create-activity'
import { getActivies } from './routes/get-activies'
import { createLink } from './routes/create-link'
import { getLinks } from './routes/get-links'

const app = fastify()

app.register(cors, {
    origin: true,    
})

// Add schema validator and serializer
// Doc Zod provider
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmParticipants)
app.register(createActivity)
app.register(getActivies)
app.register(createLink)
app.register(getLinks)

app.listen({ port: 3333 }).then(() => {
    console.log("Server running!")
})