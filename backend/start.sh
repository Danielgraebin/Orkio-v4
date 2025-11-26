#!/bin/bash
set -e

echo "==> Verificando DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL não está definida!"
    exit 1
fi

echo "==> DATABASE_URL encontrada: ${DATABASE_URL:0:50}..."

echo "==> Rodando migrações do Alembic..."
alembic upgrade head

echo "==> Iniciando servidor Uvicorn..."
uvicorn app.main:app --host 0.0.0.0 --port 8000

