#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# JARVIS + Website Builder — one-command setup.
#   git clone <repo> && cd <repo> && ./setup.sh
#
# Works on any machine with (or installable) Node 18+. On macOS it also
# installs Ollama and pulls the local model. On the new Mac, follow
# docs/SETUP-MAC.md for the complete zero-to-operational list (whisper.cpp,
# Electron wrap, native voice).
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
say_step() { printf "\n\033[1;36m▸ %s\033[0m\n" "$1"; }
say_ok()   { printf "\033[1;32m  ✔ %s\033[0m\n" "$1"; }
say_warn() { printf "\033[1;33m  ⚠ %s\033[0m\n" "$1"; }

say_step "JARVIS setup starting"

# ── 1. Node.js ≥ 18 ──────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1 || [[ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt 18 ]]; then
  if [[ "$(uname)" == "Darwin" ]]; then
    say_step "Installing Node.js via Homebrew"
    command -v brew >/dev/null 2>&1 || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
    brew install node
  else
    say_warn "Install Node.js 18+ (https://nodejs.org) and re-run."; exit 1
  fi
fi
say_ok "Node $(node -v)"

# ── 2. macOS only: Ollama + local model (the free-forever brain) ─────────
if [[ "$(uname)" == "Darwin" ]]; then
  if ! command -v ollama >/dev/null 2>&1; then
    say_step "Installing Ollama"
    brew install ollama
  fi
  brew services start ollama >/dev/null 2>&1 || (ollama serve >/dev/null 2>&1 &)
  sleep 2
  MODEL="${JARVIS_LOCAL_MODEL:-llama3.1}"
  ollama list 2>/dev/null | grep -q "$MODEL" || {
    say_step "Pulling local model: $MODEL (one-time, a few GB)"
    ollama pull "$MODEL" || say_warn "Pull failed; run 'ollama pull $MODEL' later."
  }
  say_ok "Local brain ready"
else
  say_warn "Not macOS: skipping Ollama. Jarvis runs with API keys or in graceful no-brain mode."
fi

# ── 3. Jarvis: core + UI build ───────────────────────────────────────────
say_step "Setting up Jarvis"
cd "$ROOT/jarvis"
[[ -f .env ]] || cp .env.example .env
npm install --no-fund --no-audit
say_step "Building the HUD (ui/)"
npm run ui:build
say_ok "Jarvis ready — run: cd jarvis && npm start → http://localhost:7747"

# ── 4. Website builder (zero npm deps by design) ─────────────────────────
say_step "Preparing Website Builder"
cd "$ROOT/website-builder"
[[ -f .env ]] || cp .env.example .env
node --check cli.js
say_ok "Website builder ready (standalone)"

# ── 5. Memory check — Jarvis knows Faris from the repo ───────────────────
say_step "Checking memory"
if grep -q "InteliSite" "$ROOT/jarvis/memory/profile.md" 2>/dev/null; then
  say_ok "Memory populated — Jarvis knows who you are from day one"
else
  say_warn "memory/profile.md looks empty — Jarvis starts with a blank slate"
fi

printf "\n\033[1;32m══════════════════════════════════════════════════\033[0m\n"
printf "\033[1;32m  Setup complete.\033[0m\n\n"
printf "  Jarvis:           cd jarvis && npm start    → http://localhost:7747\n"
printf "  UI dev mode:      cd jarvis/ui && npm run dev\n"
printf "  Website builder:  cd website-builder && node cli.js --help\n"
printf "  New Mac:          docs/SETUP-MAC.md (Ollama, whisper.cpp, Electron)\n\n"
printf "  Optional keys → jarvis/.env (Claude/OpenAI/Gmail). Guide:\n"
printf "  jarvis/docs/CONNECTORS.md\n\n"
printf "  Welcome back, Faris.\n"
printf "\033[1;32m══════════════════════════════════════════════════\033[0m\n"
