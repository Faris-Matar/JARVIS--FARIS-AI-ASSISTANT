#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# JARVIS + Website Builder — one-command setup for a fresh Mac.
#   git clone <repo> && cd <repo> && ./setup.sh
# Everything installs; Jarvis remembers you (memory/ is in the repo);
# the website builder is ready to run. Nothing is lost between machines.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
say_step() { printf "\n\033[1;36m▸ %s\033[0m\n" "$1"; }
say_ok()   { printf "\033[1;32m  ✔ %s\033[0m\n" "$1"; }
say_warn() { printf "\033[1;33m  ⚠ %s\033[0m\n" "$1"; }

say_step "JARVIS setup starting"

# ── 1. Homebrew (macOS package manager) ──────────────────────────────────
if [[ "$(uname)" == "Darwin" ]] && ! command -v brew >/dev/null 2>&1; then
  say_step "Installing Homebrew"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
fi
command -v brew >/dev/null 2>&1 && say_ok "Homebrew ready"

# ── 2. Node.js ≥ 18 ──────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1 || [[ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt 18 ]]; then
  say_step "Installing Node.js"
  if command -v brew >/dev/null 2>&1; then brew install node; else
    say_warn "Install Node.js 18+ manually (https://nodejs.org) and re-run."; exit 1
  fi
fi
say_ok "Node $(node -v)"

# ── 3. Ollama + local model (the free-forever brain) ─────────────────────
if ! command -v ollama >/dev/null 2>&1; then
  say_step "Installing Ollama (local model runtime)"
  if command -v brew >/dev/null 2>&1; then brew install ollama; else
    say_warn "Install Ollama manually: https://ollama.com — Jarvis runs API-only until then."
  fi
fi
if command -v ollama >/dev/null 2>&1; then
  say_ok "Ollama installed"
  # make sure the server is up, then pull the default model
  if ! curl -s --max-time 2 http://localhost:11434/api/tags >/dev/null 2>&1; then
    say_step "Starting Ollama server"
    (ollama serve >/dev/null 2>&1 &)
    sleep 3
  fi
  MODEL="${JARVIS_LOCAL_MODEL:-llama3.1}"
  if ! ollama list 2>/dev/null | grep -q "$MODEL"; then
    say_step "Pulling local model: $MODEL (one-time, a few GB)"
    ollama pull "$MODEL" || say_warn "Model pull failed — run 'ollama pull $MODEL' later."
  fi
  say_ok "Local brain ready ($MODEL)"
fi

# ── 4. Jarvis: dependencies + env ────────────────────────────────────────
say_step "Installing Jarvis (Electron app)"
cd "$ROOT/jarvis"
npm install --no-fund --no-audit
[[ -f .env ]] || cp .env.example .env
say_ok "Jarvis installed (.env created — API keys optional)"

# ── 5. Website builder: env (zero npm deps by design) ────────────────────
say_step "Preparing Website Builder"
cd "$ROOT/website-builder"
[[ -f .env ]] || cp .env.example .env
node --check cli.js
say_ok "Website builder ready (standalone — no Jarvis required)"

# ── 6. Memory check — Jarvis remembers you from the repo ─────────────────
say_step "Checking memory"
if [[ -f "$ROOT/jarvis/memory/profile.md" ]]; then
  say_ok "Memory present — Jarvis knows who you are from day one"
else
  say_warn "memory/profile.md missing — Jarvis will start with a blank slate"
fi

# ── Done ─────────────────────────────────────────────────────────────────
printf "\n\033[1;32m══════════════════════════════════════════════════\033[0m\n"
printf "\033[1;32m  Setup complete.\033[0m\n\n"
printf "  Run Jarvis:            cd jarvis && npm start\n"
printf "  Run website builder:   cd website-builder && node cli.js --help\n\n"
printf "  Optional power-ups (jarvis/.env):\n"
printf "    ANTHROPIC_API_KEY / OPENAI_API_KEY  → frontier intelligence\n"
printf "    GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET, then:\n"
printf "      cd jarvis && node core/skills/gmail-auth.js   → inbox skill\n\n"
printf "  Welcome back, Faris.\n"
printf "\033[1;32m══════════════════════════════════════════════════\033[0m\n"
