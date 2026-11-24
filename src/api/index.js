// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

// 获取教书先生天气 API
// https://api.oioweb.cn/doc/weather/GetWeather
export const getOtherWeather = async () => {
  const res = await fetch("https://api.oioweb.cn/api/weather/GetWeather");
  return await res.json();
};

/**
 * AI 助手
 * 默认使用 Pollinations 免费接口（无需密钥），可通过 .env 自定义
 */

// 本地开发走 vite 代理，线上直接请求免费接口
const DEFAULT_AI_API_URL = import.meta.env.DEV
  ? "/ai-api/openai"
  : "https://text.pollinations.ai/openai";

const AI_API_URL = import.meta.env.VITE_AI_API_URL || DEFAULT_AI_API_URL;
const AI_MODEL = import.meta.env.VITE_AI_MODEL || "openai";
const AI_KEY = import.meta.env.VITE_AI_KEY || "";
// 去掉末尾的 /openai，用于拼接兜底的 GET 接口
const AI_BASE_URL = AI_API_URL.replace(/\/openai\/?$/, "");

export const getAIConfig = () => ({
  url: AI_API_URL,
  model: AI_MODEL,
  hasKey: !!AI_KEY,
});

// 拼接请求头
const getAIHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (AI_KEY) headers.Authorization = `Bearer ${AI_KEY}`;
  return headers;
};

// 免费 GET 接口（不支持流式，作为兜底）
const chatByGet = async (messages, signal) => {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const prompt = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");
  const res = await fetch(
    `${AI_BASE_URL}/${encodeURIComponent(prompt)}?model=${encodeURIComponent(
      AI_MODEL,
    )}&system=${encodeURIComponent(system)}&referrer=${encodeURIComponent(location.hostname)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`请求失败（${res.status}）`);
  return await res.text();
};

// 读取错误响应中的可读信息
const readErrorDetail = async (res) => {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return (
        json?.error?.message ||
        (typeof json?.error === "string" ? json.error : "") ||
        json?.message ||
        ""
      );
    } catch {
      return text.slice(0, 200);
    }
  } catch {
    return "";
  }
};

/**
 * 流式对话
 * @param {Array} messages OpenAI 格式的消息列表
 * @param {Function} onDelta 收到增量内容时回调 (delta, fullText)
 * @param {AbortSignal} signal 用于中止请求
 */
export const chatCompletion = async ({ messages, onDelta, signal }) => {
  let res;
  try {
    res = await fetch(AI_API_URL, {
      method: "POST",
      headers: getAIHeaders(),
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        stream: true,
        referrer: location.hostname || "localhost",
      }),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    // 网络异常时走 GET 兜底
    const text = await chatByGet(messages, signal);
    onDelta(text, text);
    return text;
  }

  if (!res.ok) {
    const detail = await readErrorDetail(res);
    try {
      const text = await chatByGet(messages, signal);
      onDelta(text, text);
      return text;
    } catch {
      throw new Error(
        `AI 服务暂时不可用（${res.status}）${detail ? `：${detail}` : ""}`,
      );
    }
  }

  const contentType = res.headers.get("content-type") || "";

  // SSE 流式响应
  if (contentType.includes("text/event-stream") && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta =
            json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? "";
          if (delta) {
            full += delta;
            onDelta(delta, full);
          }
        } catch {
          // 忽略无法解析的片段
        }
      }
    }
    return full;
  }

  // 非流式响应兜底
  const raw = await res.text();
  let content = raw;
  try {
    const json = JSON.parse(raw);
    content = json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? raw;
  } catch {
    // 纯文本直接使用
  }
  content = String(content || "").trim();
  if (content) onDelta(content, content);
  return content;
};

/**
 * 在线搜索
 * 百度百科（JSONP，国内可用）+ 维基百科 / DuckDuckGo（海外可用）
 */
const stripHtml = (str = "") =>
  str
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();

// 带超时的 fetch，避免网络不可达时长时间等待
const fetchWithTimeout = (url, timeout = 6000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
};

// 把口语化的问题转成更适合检索的关键词
const toSearchKeyword = (query = "") =>
  query
    .replace(/[？?！!。，,、；;：:"'“”‘’（）()\s]/g, "")
    .replace(
      /^(请问一下|请问你|请问|请帮我|请|帮我|帮忙|我想知道|我想问|想知道|告诉我|什么是|谁是|为什么|怎么|怎样|如何|能否|可以)/,
      "",
    )
    .replace(/(是什么意思|是什么|是谁|什么意思|怎么样|怎么办|是怎样的|吗|呢|啊)$/, "")
    .trim() || query;

export const webSearch = async (query) => {
  const keyword = toSearchKeyword(query);
  const results = [];

  // 百度百科（JSONP 跨域，国内网络可用）
  const searchBaike = async () => {
    const res = await fetchJsonp(
      `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_length=600&bk_key=${encodeURIComponent(
        keyword,
      )}`,
      { timeout: 6000 },
    );
    const data = await res.json();
    const summary = stripHtml(data?.abstract || data?.desc || "");
    if (!data?.title || !summary) return;
    results.push({
      title: data.title,
      snippet: summary,
      url: (data.url || "").replace(/^http:/, "https:"),
      source: "百度百科",
    });
  };

  // 维基百科
  const searchWikipedia = async () => {
    const res = await fetchWithTimeout(
      `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        keyword,
      )}&format=json&origin=*&srlimit=2`,
    );
    if (!res.ok) return;
    const data = await res.json();
    (data?.query?.search || []).forEach((item) => {
      results.push({
        title: item.title,
        snippet: stripHtml(item.snippet),
        url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s/g, "_"))}`,
        source: "维基百科",
      });
    });
  };

  // DuckDuckGo 摘要
  const searchDuckDuckGo = async () => {
    const res = await fetchWithTimeout(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(
        keyword,
      )}&format=json&no_html=1&skip_disambig=1`,
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.AbstractText) {
      results.push({
        title: data.Heading || keyword,
        snippet: data.AbstractText,
        url: data.AbstractURL || "",
        source: "DuckDuckGo",
      });
    }
    (data.RelatedTopics || [])
      .filter((topic) => topic.Text && topic.FirstURL)
      .slice(0, 2)
      .forEach((topic) => {
        results.push({
          title: topic.Text.split(" - ")[0].slice(0, 40),
          snippet: topic.Text,
          url: topic.FirstURL,
          source: "DuckDuckGo",
        });
      });
  };

  await Promise.allSettled([searchBaike(), searchWikipedia(), searchDuckDuckGo()]);

  // 去重并限制数量
  const seen = new Set();
  return results
    .filter((item) => item.url)
    .filter((item) => {
      const key = item.title + item.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
};

/**
 * 文生图
 * 使用 Pollinations 免费图片接口（无需密钥），可通过 .env 替换为自有服务
 */
const AI_IMAGE_URL = import.meta.env.VITE_AI_IMAGE_URL || "https://image.pollinations.ai/prompt";

export const buildImageUrl = ({ prompt, width = 1024, height = 1024, seed }) =>
  `${AI_IMAGE_URL}/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${
    seed ?? Math.floor(Math.random() * 1e9)
  }&nologo=true&referrer=${encodeURIComponent(location.hostname || "localhost")}`;

/**
 * 生成图片并预加载，确保拿到可用的图片地址
 * @param {Object} options prompt / width / height / signal
 * @returns {Promise<string>} 图片地址
 */
export const generateImage = ({ prompt, width, height, signal }) =>
  new Promise((resolve, reject) => {
    const url = buildImageUrl({ prompt, width, height });
    const img = new Image();
    let settled = false;

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException("aborted", "AbortError"));
    };

    img.onload = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(url);
    };

    img.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("图片生成失败，请稍后重试"));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort);

    img.src = url;
  });
