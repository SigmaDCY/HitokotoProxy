Deno.serve(async (request: Request) => {
  // 1. CORS 预检处理
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
    const response = await fetch('https://v1.hitokoto.cn/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`一言 API 响应异常: ${response.status}`);
    }

    const data = await response.json();      // 一言返回的原始对象
    let combined = data.hitokoto;
    if (data.from_who) combined += ' —— ' + data.from_who;
    if (data.from) combined += '《' + data.from + '》';

    // 返回的 JSON 中，hitokoto 依然是拼接后的句子，同时多了 original 原始数据
    return new Response(JSON.stringify({
      hitokoto: combined,
      original: data, // ← 一言返回的全部原始字段
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('获取一言失败:', error);
    return new Response(JSON.stringify({
      hitokoto: '世界很大，我想去看看。 —— 佚名',
      original: null,   // 错误时没有原始数据
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
