Deno.serve(async (request: Request) => {
  // CORS 预检处理
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

    const data = await response.json();
    let combined = data.hitokoto;

    if (data.from_who) {
      // 有作者时：句子 —— 作者《出处》
      combined += ' —— ' + data.from_who;
      if (data.from) {
        combined += '《' + data.from + '》';
      }
    } else {
      // 作者为 null 时：句子 —— 佚名（不写出处）
      combined += ' —— 佚名';
    }

    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
    const origin = request.headers.get('Origin') || 'unknown';
    const ip = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
    console.log(`[${time}] [IP: ${ip}] [来源: ${origin}] 一言: ${combined}`);
    
    return new Response(JSON.stringify({
      hitokoto: combined,
      original: data,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5',  // 缩短为 5 秒
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('获取一言失败:', error);
    return new Response(JSON.stringify({
      hitokoto: '世界很大，我想去看看。 —— 佚名',
      original: null,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
