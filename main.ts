// main.ts
// 这是 Deno Deploy 启动服务的标准入口，类似于你之前的 `export default`
Deno.serve(async (request: Request) => {
  // 1. 性能优化：设置超时，防止第三方 API 抽风卡死你的服务
  const controller = new AbortController();
  // 设置 5 秒超时
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    // 2. 核心请求逻辑（与你之前的代码基本一致）
    // 调用外部 API 时传入 signal，以便超时时可以中断请求
    const response = await fetch('https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=i&c=k', {
      signal: controller.signal,
    });
    
    // 清除超时定时器，因为请求已成功返回
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`一言 API 响应异常: ${response.status}`);
    }

    const data = await response.json();

    // 拼接句子、作者、出处（这部分逻辑完全不变）
    let combined = data.hitokoto;
    if (data.from_who) {
      combined += ' —— ' + data.from_who;
    }

    // 返回给 Fluid 主题的格式（这部分也完全不变）
    return new Response(JSON.stringify({ hitokoto: combined }), {
      headers: { 
        'Content-Type': 'application/json',
        // 建议加上缓存头，减少对一言 API 的请求压力
        'Cache-Control': 'public, max-age=30' 
      },
    });

  } catch (error) {
    // 3. 错误处理：无论超时还是网络错误，都返回一个默认句子，保证服务可用
    console.error('获取一言失败:', error);
    
    // 返回一个预设的句子，避免前端因请求失败而显示空白或报错
    return new Response(JSON.stringify({
      hitokoto: '世界很大，我想去看看。 —— 佚名',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
