import { Ai } from '@cloudflare/ai'
import { AiTextGenerationOutput } from '@cloudflare/ai/dist/ai/tasks/types/tasks'
import { Hono } from 'hono'

type Bindings = {
  AI: any
}

type Answer = {
  response: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const ai = new Ai(c.env.AI)
  const answer:AiTextGenerationOutput = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      {
        role: 'system',
        content: `あなたは入力された単語に対して、日本のお笑い芸人ジョイマンのネタのリズムに合わせて似た単語を出力してくれるAIです
            入力された文章の最後の単語と似た語感の言葉を生成し、それを以下の例に従って出力してください
            回答は出力結果の部分のみ出力してください

            例) 
            入力: ラブストーリーは突然に
            出力結果: ラブストーリーは突然に 食前に 筑前煮

            例) 
            入力: ありがとう
            出力結果: ありがとう オリゴ糖`
      },
      {
        role: 'user',
        content: `ありがとう`
      }
    ]
  })

  // Cloudflare側の不具合により正しい型でうまく受け取れないので、JSON.stringifyとparseで無理やり取得
  const answer_text:Answer = JSON.parse(JSON.stringify(answer))
  console.log("answer_text.response")
  console.log(answer_text.response)
  if (answer_text.response==="") {
      return c.text(JSON.stringify("うまく生成できませんでした"))
  } else {

    const translated_text = await ai.run('@cf/meta/m2m100-1.2b', { text: answer_text.response,
        source_lang: "english", // defaults to english
        target_lang: "japanese"
      }
    );
    console.log(translated_text)

    return c.text(JSON.stringify(translated_text))
  }
})

export default app
