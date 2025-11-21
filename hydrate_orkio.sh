#!/usr/bin/env bash
set -euo pipefail

echo "== ORKIO • Hydrate (fix env, migrate, seed, proxy, smoke) =="

ROOT="${PWD}"
BACK="${ROOT}/backend"
APP="${BACK}/app"
CLI="${ROOT}/web"

# ------------ helpers
have() { command -v "$1" >/dev/null 2>&1; }
line() { printf "\n%s\n" "---------------------------------------------"; }
ensure_dir() { mkdir -p "$1"; }

# ------------ 0) sanity
test -d "$BACK" || { echo "ERRO: pasta backend não encontrada em $ROOT"; exit 1; }
test -d "$CLI"  || { echo "ERRO: pasta web não encontrada em $ROOT"; exit 1; }

# ------------ 1) .env backend já existe
cd "$BACK"
echo "[i] backend/.env já existe"

# ------------ 2) requirements (python)
python_bin="python3.11"
have $python_bin || python_bin="python3"
if [ ! -d ".venv" ] || [ ! -d "venv" ]; then
  $python_bin -m venv venv 2>/dev/null || true
fi
source venv/bin/activate
echo "[ok] venv ativado"

# ------------ 3) DB URL ativa
export DATABASE_URL="postgresql+psycopg://orkio:orkio@localhost:5432/orkio"
echo "[i] DB URL ativa: $DATABASE_URL"

# ------------ 4) Alembic upgrade head
alembic upgrade head || {
  echo "[!] falha upgrade; tentando autogenerate..."
  alembic revision --autogenerate -m "sync models" || true
  alembic upgrade head
}
echo "[ok] alembic upgrade head"

# ------------ 5) Seed admin idempotente
cat > seed_admin.py <<'PY'
import os
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import User
from app.core.security import get_password_hash

email = os.environ.get("SEED_ADMIN_EMAIL","admin@patro.ai")
pwd   = os.environ.get("SEED_ADMIN_PASSWORD","Passw0rd!")
role  = "OWNER"

db: Session = SessionLocal()
try:
    u = db.query(User).filter(User.email==email).first()
    if not u:
        u = User(email=email, password_hash=get_password_hash(pwd), role=role)
        db.add(u); db.commit(); db.refresh(u)
        print(f"admin criado: {email} (id={u.id})")
    else:
        u.password_hash = get_password_hash(pwd)
        db.commit()
        print("admin senha atualizada")
finally:
    db.close()
PY
SEED_ADMIN_EMAIL=admin@patro.ai SEED_ADMIN_PASSWORD=Passw0rd! $python_bin seed_admin.py
rm -f seed_admin.py
echo "[ok] seed admin"

# ------------ 6) API quick check (já rodando na porta 8001)
curl -sSf http://localhost:8001/api/v1/health >/dev/null && echo "[ok] api já up (porta 8001)" || echo "[!] api não respondeu"

# ------------ 7) web já rodando na porta 3000
curl -sSf http://localhost:3000 >/dev/null && echo "[ok] web já up (porta 3000)" || echo "[!] web não respondeu"

# ------------ 8) Smoke test (API direta)
line
echo "[SMOKE] login/agents (API direta)"
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@patro.ai","password":"Passw0rd!"}' | python3.11 -c 'import sys,json; print(json.load(sys.stdin).get("access_token",""))' || true)

test -n "$TOKEN" && echo "[ok] JWT obtido" || echo "[!] falha JWT (ver logs)"

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/v1/agents >/tmp/agents.json || true
echo "[ok] GET /agents ->"; cat /tmp/agents.json || echo "[]"

line
echo "SMOKE OK • API=http://localhost:8001  WEB=http://localhost:3000"
echo "Admin: admin@patro.ai / Passw0rd!"
echo ""
echo "URLs públicas (Manus VM):"
echo "  API: https://8001-ia96ib8le53ob5nncbjwz-fa72d872.manusvm.computer"
echo "  WEB: https://3000-ia96ib8le53ob5nncbjwz-fa72d872.manusvm.computer"
line
