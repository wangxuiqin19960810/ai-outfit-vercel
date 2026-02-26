// api/recommend.js
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { prompt } = await req.json();

  // 👇 替换为你自己的 DashScope API Key（在 Vercel 后台设置为环境变量）
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "qwen-max",
        input: {
          messages: [{ role: "user", content: prompt }]
        },
        parameters: {
          result_format: "message"
        }
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}