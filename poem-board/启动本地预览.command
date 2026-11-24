#!/bin/bash
# 黑板诗笺 · 本地预览启动器
# 双击这个文件，会在本机启动一个临时网页服务，并打开浏览器。
cd "$(dirname "$0")" || exit 1

PORT=8765
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

python3 -m http.server "$PORT" >/tmp/poem-board-preview.log 2>&1 &
SERVER_PID=$!

sleep 1
URL="http://127.0.0.1:$PORT/"
open "$URL"
echo ""
echo "黑板诗笺已打开：$URL"
echo "关闭这个终端窗口，或按 Ctrl+C，即可停止。"
echo ""

trap 'kill $SERVER_PID 2>/dev/null' EXIT INT TERM
wait $SERVER_PID
