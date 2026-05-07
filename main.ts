// main.ts
Deno.serve(async (request: Request) => {
  // 1. 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=i&c=k', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`一言 API 响应异常: ${response.status}`);
    }

    const data = await response.json();
    let combined = data.hitokoto;
    if (data.from_who) combined += '\n —— ' + data.from_who;

    // 3. 返回结果，并添加 CORS 头部
    return new Response(JSON.stringify({ hitokoto: combined }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
        'Access-Control-Allow-Origin': '*',   // ← 关键加入
      },
    });

  } catch (error) {
    console.error('获取一言失败:', error);
    // 错误时也加上 CORS 头部
    return new Response(JSON.stringify({
      hitokoto: '世界很大，我想去看看。\n—— 佚名',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',   // ← 关键加入
      },
    });
  }
});
