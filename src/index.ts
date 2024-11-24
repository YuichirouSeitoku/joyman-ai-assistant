import { Ai } from '@cloudflare/ai'
import { AiTextGenerationOutput } from '@cloudflare/ai/dist/ai/tasks/types/tasks'
import { Hono } from 'hono'

type Bindings = {
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/ai', async (c) => {
  const ai = new Ai(c.env.AI)
  const answer:AiTextGenerationOutput = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      {
        role: 'user',
        content: `日本のお笑い芸人、ジョイマンの説明をしてください`
      }
    ]
  })

  return c.text(JSON.stringify(answer))
})

export default app
