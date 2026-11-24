/**
 * 轻量 Markdown 渲染
 * 仅支持 AI 回答中常见的语法，渲染前已做 HTML 转义，避免注入风险
 */

const escapeHtml = (str = "") =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const renderMarkdown = (raw = "") => {
  const blocks = [];

  // 1. 先取出代码块，避免后续转义破坏内容
  let text = raw.replace(/```[^\n]*\n?([\s\S]*?)```/g, (_, code) => {
    const index = blocks.push(`<pre class="md-code"><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`) - 1;
    return `@@BLOCK${index}@@`;
  });

  // 2. 转义剩余 HTML
  text = escapeHtml(text);

  // 3. 行内代码
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (_, code) => {
    const index = inlineCodes.push(`<code class="md-inline-code">${code}</code>`) - 1;
    return `@@INLINE${index}@@`;
  });

  // 4. 链接 / 加粗
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

  // 5. 按行处理标题、列表、段落
  let html = "";
  let listType = "";
  const closeList = () => {
    if (listType) {
      html += `</${listType}>`;
      listType = "";
    }
  };

  for (const line of text.split("\n")) {
    const current = line.trim();

    if (!current) {
      closeList();
      html += '<div class="md-gap"></div>';
      continue;
    }

    const unordered = /^[-*+]\s+(.*)$/.exec(current);
    if (unordered) {
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${unordered[1]}</li>`;
      continue;
    }

    const ordered = /^\d+[.、]\s+(.*)$/.exec(current);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${ordered[1]}</li>`;
      continue;
    }

    closeList();

    const heading = /^#{1,6}\s+(.*)$/.exec(current);
    if (heading) {
      html += `<p class="md-title">${heading[1]}</p>`;
      continue;
    }

    html += `<p>${current}</p>`;
  }
  closeList();

  // 6. 还原占位符
  html = html.replace(/@@INLINE(\d+)@@/g, (_, index) => inlineCodes[index] || "");
  html = html.replace(/@@BLOCK(\d+)@@/g, (_, index) => blocks[index] || "");

  return html;
};
