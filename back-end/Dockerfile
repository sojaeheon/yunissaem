FROM python:3.11

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    bash \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# 🔥 entrypoint는 / 에 둔다
COPY entrypoint.sh /entrypoint.sh
COPY . /app/

# 🔥 경로 일치
RUN dos2unix /entrypoint.sh \
    && chmod +x /entrypoint.sh

RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
