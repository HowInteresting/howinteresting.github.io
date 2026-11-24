<template>
  <div class="ai-page">
    <!-- 顶部栏 -->
    <header class="ai-header">
      <router-link to="/" class="back">
        <span class="arrow">←</span>
        返回首页
      </router-link>
      <div class="brand">
        <span class="logo">AI</span>
        <div class="brand-text">
          <h1>AI 助手</h1>
          <span class="model">模型 {{ config.model }}</span>
        </div>
      </div>
      <div class="modes">
        <button
          class="mode"
          :class="{ active: mode === 'chat' }"
          @click="switchMode('chat')"
        >
          对话
        </button>
        <button
          class="mode"
          :class="{ active: mode === 'image' }"
          @click="switchMode('image')"
        >
          画图
        </button>
      </div>
      <div class="actions">
        <button
          v-if="mode === 'chat'"
          class="btn search-btn"
          :class="{ active: searchEnabled }"
          :title="searchEnabled ? '已开启联网搜索' : '开启联网搜索'"
          @click="searchEnabled = !searchEnabled"
        >
          <span class="indicator"></span>
          联网搜索
        </button>
        <button class="btn" :disabled="!messages.length" @click="clearChat">清空</button>
      </div>
    </header>

    <!-- 消息区 -->
    <div class="ai-body" ref="bodyRef" @scroll="onScroll">
      <!-- 欢迎页 -->
      <div v-if="!messages.length" class="welcome">
        <div class="welcome-logo">{{ mode === "image" ? "IMG" : "AI" }}</div>
        <h2>{{ mode === "image" ? "想画点什么？" : "有什么可以帮你的？" }}</h2>
        <p class="welcome-desc">
          {{
            mode === "image"
              ? "描述你想要的画面，AI 会用免费的文生图模型为你绘制，支持中英文提示词。"
              : "这是一个免费的 AI 问答助手，开启「联网搜索」后可以结合公开网页资料进行回答。"
          }}
        </p>
        <div class="suggestions">
          <button v-for="item in suggestions" :key="item" class="suggestion" @click="send(item)">
            {{ item }}
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="ai-list">
        <div v-for="(msg, index) in messages" :key="index" class="msg" :class="msg.role">
          <div class="avatar">{{ msg.role === "user" ? "我" : "AI" }}</div>
          <div class="bubble">
            <div v-if="msg.status" class="status">
              <span class="typing"><i></i><i></i><i></i></span>
              {{ msg.status }}
            </div>
            <div
              v-if="msg.role === 'user'"
              class="content user-content"
            >{{ msg.content }}</div>
            <template v-else-if="msg.type === 'image'">
              <img
                v-if="msg.imageUrl"
                class="gen-image"
                :src="msg.imageUrl"
                alt="AI 生成的图片"
                @load="scrollToBottom()"
              />
              <div v-if="msg.content" class="content image-error">{{ msg.content }}</div>
              <a
                v-if="msg.imageUrl"
                class="image-link"
                :href="msg.imageUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                查看原图 ↗
              </a>
            </template>
            <div
              v-else-if="msg.content"
              class="content md-content"
              v-html="renderMarkdown(msg.content)"
            ></div>
            <div v-if="msg.sources && msg.sources.length" class="sources">
              <span class="sources-title">参考资料</span>
              <a
                v-for="(source, sourceIndex) in msg.sources"
                :key="sourceIndex"
                class="source"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                :title="source.snippet"
              >
                [{{ sourceIndex + 1 }}] {{ source.title }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <footer class="ai-footer">
      <div v-if="mode === 'image'" class="ratios">
        <button
          v-for="item in ratios"
          :key="item.key"
          class="ratio"
          :class="{ active: ratio === item.key }"
          :disabled="loading"
          @click="ratio = item.key"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="input-wrap">
        <textarea
          ref="textareaRef"
          v-model="input"
          rows="1"
          :placeholder="mode === 'image' ? '描述你想生成的画面…' : '问我任何问题…'"
          @keydown="onKeydown"
          @input="autoResize"
        ></textarea>
        <button v-if="loading" class="send stop" @click="stop">停止</button>
        <button v-else class="send" :disabled="!input.trim()" @click="send()">
          {{ mode === "image" ? "生成" : "发送" }}
        </button>
      </div>
      <p class="tips">
        {{
          mode === "image"
            ? "Enter 生成 · Shift + Enter 换行 · 图片由 AI 生成，仅供参考"
            : "Enter 发送 · Shift + Enter 换行 · 内容由 AI 生成，仅供参考"
        }}
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from "vue";
import { getAIConfig, chatCompletion, webSearch, generateImage } from "@/api";
import { renderMarkdown } from "@/utils/markdown";

const SYSTEM_PROMPT =
  "你是一位简洁、可靠的 AI 助手，请使用简体中文回答。回答要准确、条理清晰，尽量简短；不确定的内容要明确说明，不要编造。如果提供了参考资料，请优先依据资料作答，并在句末用 [1]、[2] 这样的序号标注引用来源。";

const config = getAIConfig();

const chatSuggestions = [
  "用三句话介绍一下你自己",
  "什么是量子纠缠？",
  "帮我写一条周末出游的朋友圈文案",
  "最近有什么值得关注的科技新闻？",
];

const imageSuggestions = [
  "夜晚的江南水乡，灯笼倒映在河面",
  "赛博朋克风格的城市街道，霓虹灯",
  "一只戴着宇航员头盔的橘猫",
  "极简风格的水墨山水画",
];

// 图片比例选项
const ratios = [
  { key: "square", label: "方形 1:1", width: 1024, height: 1024 },
  { key: "portrait", label: "竖版 3:4", width: 768, height: 1024 },
  { key: "landscape", label: "横版 16:9", width: 1024, height: 576 },
];

const mode = ref("chat");
const ratio = ref("square");
const messages = ref([]);
const input = ref("");
const loading = ref(false);
const searchEnabled = ref(true);
const bodyRef = ref(null);
const textareaRef = ref(null);

const suggestions = computed(() =>
  mode.value === "image" ? imageSuggestions : chatSuggestions,
);

let controller = null;
let autoScroll = true;

// 是否停留在底部附近
const onScroll = () => {
  const el = bodyRef.value;
  if (!el) return;
  autoScroll = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
};

const scrollToBottom = (force = false) => {
  nextTick(() => {
    const el = bodyRef.value;
    if (el && (force || autoScroll)) {
      el.scrollTop = el.scrollHeight;
    }
  });
};

// 输入框高度自适应
const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
};

const onKeydown = (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  send();
};

// 组装带搜索资料的系统提示
const buildMessages = (question, sources) => {
  const list = [{ role: "system", content: SYSTEM_PROMPT }];

  if (sources.length) {
    const context = sources
      .map(
        (item, index) =>
          `[${index + 1}] ${item.title}（${item.source}）\n${item.snippet}\n链接：${item.url}`,
      )
      .join("\n\n");
    list.push({
      role: "system",
      content: `以下是刚刚联网检索到的参考资料，请结合它们回答用户的问题：\n\n${context}`,
    });
  }

  // 去掉最后的助手占位消息，只保留有内容的上下文
  const history = messages.value
    .slice(0, -1)
    .filter((msg) => msg.content)
    .slice(-8);

  history.forEach((msg) => {
    list.push({ role: msg.role, content: msg.content });
  });

  list.push({ role: "user", content: question });
  return list;
};

// 切换对话 / 画图模式
const switchMode = (next) => {
  if (mode.value === next) return;
  if (loading.value) stop();
  mode.value = next;
  messages.value = [];
  input.value = "";
  nextTick(autoResize);
};

// 生成图片
const sendImage = async (prompt) => {
  messages.value.push({ role: "user", content: prompt });

  const assistant = reactive({
    role: "assistant",
    type: "image",
    content: "",
    imageUrl: "",
    status: "正在绘制图片，通常需要几秒到几十秒…",
  });
  messages.value.push(assistant);

  loading.value = true;
  controller = new AbortController();
  scrollToBottom(true);

  const size = ratios.find((item) => item.key === ratio.value) || ratios[0];

  try {
    assistant.imageUrl = await generateImage({
      prompt,
      width: size.width,
      height: size.height,
      signal: controller.signal,
    });
    assistant.status = "";
  } catch (error) {
    assistant.status = "";
    assistant.content =
      error.name === "AbortError" ? "（已停止生成）" : `抱歉，${error.message || "图片生成失败"}`;
  } finally {
    loading.value = false;
    controller = null;
    scrollToBottom();
  }
};

const send = async (preset) => {
  if (loading.value) return;
  const question = (typeof preset === "string" ? preset : input.value).trim();
  if (!question) return;

  input.value = "";
  autoResize();
  autoScroll = true;

  if (mode.value === "image") {
    await sendImage(question);
    return;
  }

  messages.value.push({ role: "user", content: question });

  const assistant = reactive({
    role: "assistant",
    content: "",
    sources: [],
    status: "",
  });
  messages.value.push(assistant);

  loading.value = true;
  controller = new AbortController();
  scrollToBottom(true);

  try {
    let sources = [];
    if (searchEnabled.value) {
      assistant.status = "正在联网搜索…";
      scrollToBottom(true);
      try {
        sources = await webSearch(question);
      } catch {
        sources = [];
      }
      assistant.sources = sources;
      assistant.status = sources.length ? "正在整理搜索结果…" : "正在思考…";
    } else {
      assistant.status = "正在思考…";
    }

    const payload = buildMessages(question, sources);
    await chatCompletion({
      messages: payload,
      signal: controller.signal,
      onDelta: (delta, full) => {
        assistant.status = "";
        assistant.content = full;
        scrollToBottom();
      },
    });

    if (!assistant.content.trim()) {
      assistant.content = "抱歉，这次没有生成有效回答，请换个问法再试一次。";
    }
  } catch (error) {
    if (error.name === "AbortError") {
      if (!assistant.content) assistant.content = "（已停止生成）";
    } else {
      assistant.content = `抱歉，AI 服务暂时不可用，请稍后重试。\n\n${error.message || ""}`;
    }
  } finally {
    assistant.status = "";
    loading.value = false;
    controller = null;
    scrollToBottom();
  }
};

const stop = () => {
  if (controller) controller.abort();
};

const clearChat = () => {
  if (loading.value) stop();
  messages.value = [];
  input.value = "";
  nextTick(autoResize);
};

onMounted(() => {
  autoResize();
});
</script>

<style lang="scss" scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #101014;
  background-image:
    radial-gradient(60vw 60vw at 50% -10%, rgba(90, 120, 255, 0.16), transparent 70%),
    radial-gradient(50vw 50vw at 100% 100%, rgba(120, 80, 255, 0.1), transparent 70%);
  color: #e8e8ea;
  font-family:
    -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.ai-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(16, 16, 20, 0.7);
  backdrop-filter: blur(12px);
  z-index: 2;

  .back {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    color: #b9b9c6;
    font-size: 13px;
    text-decoration: none;
    transition:
      color 0.2s,
      border-color 0.2s,
      background 0.2s;

    &:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.06);
    }

    .arrow {
      font-size: 14px;
    }
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b6cf6, #7a5cff);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;

      h1 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #f2f2f5;
      }

      .model {
        font-size: 11px;
        color: #7d7d8c;
      }
    }
  }

  .modes {
    display: flex;
    padding: 3px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);

    .mode {
      padding: 5px 15px;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: #9a9aa8;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition:
        color 0.2s,
        background 0.2s;

      &:hover {
        color: #dcdce4;
      }

      &.active {
        background: linear-gradient(135deg, #3b6cf6, #7a5cff);
        color: #fff;
        box-shadow: 0 2px 10px rgba(80, 110, 255, 0.35);
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;

    .btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      background: transparent;
      color: #b9b9c6;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition:
        color 0.2s,
        border-color 0.2s,
        background 0.2s;

      &:hover:not(:disabled) {
        color: #fff;
        border-color: rgba(255, 255, 255, 0.28);
        background: rgba(255, 255, 255, 0.06);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #5c5c68;
        transition: background 0.2s;
      }

      &.active {
        color: #dfe6ff;
        border-color: rgba(110, 140, 255, 0.55);
        background: rgba(70, 100, 255, 0.16);

        .indicator {
          background: #6d8dff;
          box-shadow: 0 0 6px #6d8dff;
        }
      }
    }
  }
}

.ai-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 18px 8px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.16);
  }
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 20px;
  text-align: center;

  .welcome-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 62px;
    height: 62px;
    border-radius: 20px;
    background: linear-gradient(135deg, #3b6cf6, #7a5cff);
    box-shadow: 0 10px 30px rgba(80, 110, 255, 0.35);
    color: #fff;
    font-size: 22px;
    font-weight: 700;
  }

  h2 {
    margin: 22px 0 0;
    font-size: 23px;
    font-weight: 600;
    color: #f4f4f7;
  }

  .welcome-desc {
    max-width: 420px;
    margin: 10px 0 0;
    font-size: 13.5px;
    line-height: 1.7;
    color: #8f8f9c;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    max-width: 560px;
    margin-top: 26px;

    .suggestion {
      padding: 9px 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.04);
      color: #c3c3cf;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition:
        background 0.2s,
        border-color 0.2s,
        color 0.2s,
        transform 0.2s;

      &:hover {
        transform: translateY(-1px);
        border-color: rgba(120, 150, 255, 0.5);
        background: rgba(90, 120, 255, 0.14);
        color: #fff;
      }
    }
  }
}

.ai-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.msg {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: fade 0.3s;

  .avatar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  .bubble {
    max-width: 78%;
    padding: 11px 15px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.045);
    font-size: 14.5px;
    line-height: 1.75;
    word-break: break-word;
    user-select: text;

    .content {
      user-select: text;
      white-space: pre-wrap;
    }

    .user-content {
      color: #f1f1f5;
    }
  }

  &.user {
    flex-direction: row-reverse;

    .avatar {
      background: linear-gradient(135deg, #3b6cf6, #7a5cff);
    }

    .bubble {
      border-color: rgba(110, 140, 255, 0.35);
      background: rgba(70, 100, 255, 0.16);
    }
  }
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #9a9aa8;
}

.typing {
  display: inline-flex;
  gap: 4px;

  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #8ea4ff;
    animation: typing 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}

.sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);

  .sources-title {
    font-size: 12px;
    color: #7d7d8c;
  }

  .source {
    max-width: 100%;
    overflow: hidden;
    padding: 2px 9px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    color: #a9bdff;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-decoration: none;
    transition:
      background 0.2s,
      color 0.2s;

    &:hover {
      background: rgba(110, 140, 255, 0.22);
      color: #fff;
      text-decoration: none;
    }
  }
}

.md-content {
  :deep(p) {
    margin: 0 0 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.md-gap) {
    height: 6px;
  }

  :deep(.md-title) {
    margin: 10px 0 6px;
    font-weight: 600;
    color: #eef0ff;
  }

  :deep(ul),
  :deep(ol) {
    margin: 4px 0 8px;
    padding-left: 20px;
  }

  :deep(li) {
    margin: 2px 0;
  }

  :deep(strong) {
    color: #fff;
    font-weight: 600;
  }

  :deep(a) {
    color: #8fa8ff;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  :deep(.md-inline-code) {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.9em;
    color: #ffd9a3;
  }

  :deep(.md-code) {
    margin: 8px 0;
    padding: 10px 12px;
    overflow-x: auto;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.4);

    code {
      font-family: "SF Mono", Menlo, Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.6;
      color: #d8d8e4;
      white-space: pre;
    }
  }
}

// 生成图片
.gen-image {
  display: block;
  width: 100%;
  max-width: 420px;
  margin-top: 4px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  animation: fade 0.4s;
}

.image-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12.5px;
  color: #8fa8ff;
  text-decoration: none;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
}

.image-error {
  color: #ffb4b4;
  font-size: 13.5px;
}

.ai-footer {
  flex-shrink: 0;
  padding: 10px 18px 16px;
  background: linear-gradient(180deg, rgba(16, 16, 20, 0), rgba(16, 16, 20, 0.92) 30%);

  .ratios {
    display: flex;
    justify-content: center;
    gap: 8px;
    width: 100%;
    max-width: 860px;
    margin: 0 auto 8px;

    .ratio {
      padding: 5px 13px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.04);
      color: #9a9aa8;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      transition:
        color 0.2s,
        border-color 0.2s,
        background 0.2s;

      &:hover:not(:disabled) {
        color: #dcdce4;
      }

      &.active {
        border-color: rgba(110, 140, 255, 0.55);
        background: rgba(70, 100, 255, 0.18);
        color: #dfe6ff;
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }
  }

  .input-wrap {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    width: 100%;
    max-width: 860px;
    margin: 0 auto;

    textarea {
      flex: 1;
      min-height: 48px;
      max-height: 140px;
      padding: 13px 15px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      outline: none;
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 14.5px;
      font-family: inherit;
      line-height: 1.5;
      resize: none;
      user-select: text;
      transition:
        border-color 0.2s,
        background 0.2s;

      &::placeholder {
        color: #6f6f7c;
      }

      &:focus {
        border-color: rgba(110, 140, 255, 0.6);
        background: rgba(255, 255, 255, 0.07);
      }
    }

    .send {
      flex-shrink: 0;
      height: 48px;
      padding: 0 22px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b6cf6, #7a5cff);
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      transition:
        opacity 0.2s,
        transform 0.2s;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      &.stop {
        background: rgba(255, 255, 255, 0.12);
      }
    }
  }

  .tips {
    margin: 8px 0 0;
    font-size: 11.5px;
    color: #62626f;
    text-align: center;
  }
}

@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (max-width: 720px) {
  .ai-header {
    gap: 10px;
    padding: 12px 14px;

    .brand .brand-text .model {
      display: none;
    }
  }

  .ai-body {
    padding: 18px 12px 4px;
  }

  .msg .bubble {
    max-width: 84%;
    font-size: 14px;
  }

  .ai-footer {
    padding: 8px 12px 12px;
  }
}
</style>
