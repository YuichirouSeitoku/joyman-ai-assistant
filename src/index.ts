import { Ai } from '@cloudflare/ai';
import { AiTextGenerationOutput } from '@cloudflare/ai/dist/ai/tasks/types/tasks';
import { Hono } from 'hono';

type Bindings = {
  AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

// GET リクエスト: 動作確認用
app.get('/', (c) => c.text('Hono AI App is running!'));

// POST リクエスト: ユーザー入力を受け取る
app.post('/generate', async (c) => {
  const body = await c.req.json<{ input: string }>();
  const userInput = body.input;

  if (!userInput || typeof userInput !== 'string') {
    return c.json({ error: 'Invalid input' }, 400);
  }

  const ai = new Ai(c.env.AI);

  // AI にリクエストを送信
  const answer: AiTextGenerationOutput = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
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
        content: userInput,
      },
    ],
  });

  // Cloudflare側の不具合により正しい型で受け取れない場合の処理
  const answerText = JSON.parse(JSON.stringify(answer)) as { response: string };

  if (!answerText.response) {
    return c.json({ error: 'AI could not generate a response.' });
  }

  // 翻訳処理 (オプション)
  const translatedText = await ai.run('@cf/meta/m2m100-1.2b', {
    text: answerText.response,
    source_lang: 'english',
    target_lang: 'japanese',
  });

  return c.json({
    input: userInput,
    response: answerText.response,
    translatedResponse: translatedText,
  });
});

export default app;