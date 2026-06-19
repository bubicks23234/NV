#!/usr/bin/env bash
# Пуш кода в репозиторий Amvera (запускать из корня проекта)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Пуш в Amvera (ветка main → master)..."
git push amvera main:master

echo ""
echo "Готово. Сборка начнётся в панели Amvera автоматически."
