#!/usr/bin/env bash
# scripts/verify_deploy_readiness.sh
#
# Verifica que el entorno backend esté listo para producción.
# Uso: bash scripts/verify_deploy_readiness.sh
#
# Requiere: REDIS_URL en env (local: export REDIS_URL=redis://localhost:6379/0)
set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-$(cd "$(dirname "$0")/../backend" && pwd)}"
cd "$BACKEND_DIR"

REDIS_URL_VAL="${REDIS_URL:-redis://localhost:6379/0}"
SECRET_KEY_VAL="${SECRET_KEY:-$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')}"

export DEBUG="False"
export SECRET_KEY="$SECRET_KEY_VAL"
export ALLOWED_HOSTS="localhost,127.0.0.1"
export REDIS_URL="$REDIS_URL_VAL"

echo "=========================================="
echo "  Deploy Readiness Check"
echo "=========================================="

echo ""
echo "[1/5] Django deploy checks (WARNING level)..."
python manage.py check --deploy --fail-level WARNING
echo "  PASS"

echo ""
echo "[2/5] No pending migrations..."
python manage.py makemigrations --check --dry-run
echo "  PASS"

echo ""
echo "[3/5] Collectstatic dry-run..."
python manage.py collectstatic --noinput --dry-run >/dev/null
echo "  PASS"

echo ""
echo "[4/5] Fail-fast: sin SECRET_KEY en prod debe fallar..."
output=$(env -u SECRET_KEY python manage.py check --deploy --fail-level WARNING 2>&1 || true)
if echo "$output" | grep -q "ImproperlyConfigured"; then
    echo "  PASS (bloqueado correctamente)"
else
    echo "  FAIL (no se lanzó ImproperlyConfigured)"
    exit 1
fi

echo ""
echo "[5/5] Fail-fast: sin REDIS_URL en prod debe fallar..."
output=$(env -u REDIS_URL python manage.py check --deploy --fail-level WARNING 2>&1 || true)
if echo "$output" | grep -q "REDIS_URL must be set"; then
    echo "  PASS (bloqueado correctamente)"
else
    echo "  FAIL (no se lanzó ImproperlyConfigured por REDIS_URL)"
    exit 1
fi

echo ""
echo "=========================================="
echo "  All checks passed"
echo "=========================================="
