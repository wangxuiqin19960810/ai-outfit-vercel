// Vercel Edge Function - 安全调用 DashScope
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 仅允许 POST 请求
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { prompt } = await request.json();

    // 从环境变量读取 API Key（在 Vercel 后台设置）
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

    if (!DASHSCOPE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing DASHSCOPE_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 调用 DashScope qwen-turbo
    const dashResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [{ role: 'user', content: prompt }],
        },
        parameters: {
          result_format: 'message',
        },
      }),
    });

    const result = await dashResponse.json();

    // 返回结果（自动继承 CORS 头，因同域）
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}