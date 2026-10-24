#!/usr/bin/env bash
# Install host node_modules → build Docker image → run services.
# External MySQL via .env.prod (no MySQL container).
#
# Usage on AWS server:
#   chmod +x deploy/aws/deploy.sh
#   ./deploy/aws/deploy.sh setup      # install Node 24 + pnpm (once)
#   ./deploy/aws/deploy.sh install    # pnpm install + prisma generate on host
#   ./deploy/aws/deploy.sh build      # docker build only
#   ./deploy/aws/deploy.sh up         # start services (no rebuild)
#   ./deploy/aws/deploy.sh migrate    # prisma migrate (uses host node_modules)
#   ./deploy/aws/deploy.sh            # install → build → up
#   ./deploy/aws/deploy.sh pull       # git pull → install → build → up

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

NODE_VERSION="${NODE_VERSION:-24.21.0}"
PNPM_VERSION="${PNPM_VERSION:-12.9.1}"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
ACTION="${1:-all}"

require_env() {
  if [[ ! -f .env.prod ]]; then
    echo "Missing .env.prod — copy from .env.prod.example and fill secrets."
    exit 1
  fi
}

# Ensure Node + pnpm available (fnm preferred, falls back to nvm / system node)
ensure_node() {
  if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env)"
    fnm use "$NODE_VERSION" >/dev/null 2>&1 || fnm install "$NODE_VERSION"
    fnm use "$NODE_VERSION"
  elif [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
    nvm use "$NODE_VERSION" >/dev/null 2>&1 || nvm install "$NODE_VERSION"
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found. Run: ./deploy/aws/deploy.sh setup"
    exit 1
  fi

  corepack enable
  corepack prepare "pnpm@${PNPM_VERSION}" --activate
  echo "==> Node $(node -v) · pnpm $(pnpm -v)"
}

# One-time: install Node 24 via fnm on Ubuntu
setup() {
  echo "==> Installing Node ${NODE_VERSION} (fnm) + pnpm..."
  if ! command -v fnm >/dev/null 2>&1; then
    curl -fsSL https://fnm.vercel.app/install | bash
    # shellcheck disable=SC1091
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"
  else
    eval "$(fnm env)"
  fi
  fnm install "$NODE_VERSION"
  fnm use "$NODE_VERSION"
  fnm default "$NODE_VERSION"
  corepack enable
  corepack prepare "pnpm@${PNPM_VERSION}" --activate
  echo "==> Setup done: Node $(node -v) · pnpm $(pnpm -v)"
  echo "    Add to ~/.bashrc if needed: eval \"\$(fnm env)\""
}

# Install node_modules on the host system
install_deps() {
  ensure_node
  echo "==> Installing node_modules on host..."
  pnpm install --frozen-lockfile
  echo "==> Generating Prisma client..."
  pnpm prisma:generate
  echo "==> Host install done."
}

build() {
  require_env
  echo "==> Building Docker images..."
  "${COMPOSE[@]}" build --pull
  echo "==> Docker build done."
}

up() {
  require_env
  echo "==> Starting services..."
  # shellcheck disable=SC1091
  set -a && . ./.env && set +a
  "${COMPOSE[@]}" up -d --no-build
  "${COMPOSE[@]}" ps
  echo "==> Deployed. Health: curl -s http://127.0.0.1:${PORT:-4000}/v1/health"
}

migrate() {
  require_env
  ensure_node
  if [[ ! -d node_modules ]]; then
    install_deps
  fi
  echo "==> Running Prisma migrations against external DB..."
  # shellcheck disable=SC1091
  set -a && . ./.env.prod && set +a
  pnpm prisma:deploy
  echo "==> Migrations done."
}

case "$ACTION" in
  setup)
    setup
    ;;
  install)
    install_deps
    ;;
  build)
    build
    ;;
  up)
    up
    ;;
  migrate)
    migrate
    ;;
  pull)
    echo "==> Pulling latest code..."
    git pull --ff-only
    install_deps
    build
    up
    ;;
  all)
    install_deps
    build
    up
    ;;
  *)
    echo "Usage: $0 [setup|install|build|up|migrate|pull|all]"
    exit 1
    ;;
esac
