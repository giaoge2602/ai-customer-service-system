#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAGES_REPO_URL="${1:-${PAGES_REPO_URL:-https://gitee.com/YOUR_GITEE_USERNAME/ai-customer-service-pages.git}}"
PAGES_DIR="${PAGES_DIR:-${ROOT_DIR}/../ai-customer-service-pages}"

if [[ "$PAGES_REPO_URL" == *"YOUR_GITEE_USERNAME"* ]]; then
  echo "请先设置 PAGES_REPO_URL，例如："
  echo "  export PAGES_REPO_URL=https://gitee.com/你的用户名/ai-customer-service-pages.git"
  exit 1
fi

cd "$ROOT_DIR"
echo "[1/4] 构建前端..."
npm run build

if [[ -d "$PAGES_DIR/.git" ]]; then
  echo "[2/4] 更新 Pages 仓库..."
  git -C "$PAGES_DIR" pull --ff-only
else
  echo "[2/4] 克隆 Pages 仓库..."
  git clone "$PAGES_REPO_URL" "$PAGES_DIR"
fi

echo "[3/4] 同步 dist 到 Pages 仓库..."
find "$PAGES_DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf -- {} +
cp -R "$ROOT_DIR/dist/." "$PAGES_DIR/"

git -C "$PAGES_DIR" add -A
if git -C "$PAGES_DIR" diff --cached --quiet; then
  echo "没有新的构建文件需要发布。"
  exit 0
fi

git -C "$PAGES_DIR" commit -m "deploy: update frontend build"

BRANCH="$(git -C "$PAGES_DIR" branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  BRANCH="master"
fi

echo "[4/4] 推送到 Gitee Pages（分支：$BRANCH）..."
git -C "$PAGES_DIR" push origin "$BRANCH"
echo "发布文件已推送。回到 Gitee Pages 页面点击「更新」即可。"
