import { z } from 'zod'

const coord = z.number().int().min(-100000).max(100000)
const label = z.string().trim().min(1).max(100)

export const pointSchema = z.object({ x: coord, y: coord })

export const blueprintRef = z.object({ author: label, name: label })

export const drawEventSchema = z.object({
  room: z.string().min(1).max(250),
  author: label,
  name: label,
  point: pointSchema,
})

export const roomOf = ({ author, name }) => `blueprints.${author}.${name}`
