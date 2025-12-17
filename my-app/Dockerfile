# Node.js LTS 버전 사용 (Alpine: 경량화)
FROM node:20-alpine

# 작업 디렉터리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 (캐싱 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# Expo 개발 서버 포트 노출
# 19000: Metro bundler
# 19001: Expo DevTools
# 19006: Expo web
EXPOSE 19000 19001 19006

# 개발 서버 시작
CMD ["npx", "expo", "start"]
