#!/bin/bash
# 도커 실행시 migrate 및 더미데이터 생성 코드 실행
set -e

echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

echo "🚀 Running database migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

echo "🌱 Seeding dummy data..."
python seed_all_data.py || echo "⚠️ Seed script failed (ignored)."

echo "🔥 Starting Django Gunicorn server..."
gunicorn yunissaem_api.asgi:application --bind 0.0.0.0:8000 --worker-class uvicorn.workers.UvicornWorker
