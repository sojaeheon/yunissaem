# 🧠 Front-End (React Native + Expo)

**Note:**  
 1~3 단계는 이미 완료된 상태이므로 현재 진행 시 **건너뛰세요.**

## 설정
- `my-app/src/config/config.js`의 `PC_IP`는 기본값으로 `localhost`를 사용합니다.
- 실제 로컬 네트워크에서 모바일 기기로 테스트하려면 `PC_IP`를 개발용 PC의 LAN IP로 변경하세요.

> 주의: 개인 IP를 리포지토리에 커밋하지 마세요.

## Docker에서 실행
- `Dockerfile` 및 `docker-compose.yml`에서 Expo 포트(19000/19001/19006 등)를 노출했습니다.
- 도커에서 실행할 때는 다음을 사용하세요:
```bash
docker-compose up -d --build frontend
docker-compose logs -f frontend
```

## 📱 Expo Go (모바일)에서 테스트하기

### 1. 본인 PC의 Wi-Fi IP 확인
```bash
# Windows
ipconfig
# Wi-Fi 어댑터의 IPv4 주소 확인 (예: 172.30.1.13)
```

### 2. 환경변수 설정 (두 가지 모두 필요!)

**A: `.env` 파일에 추가 (Docker용 Metro 연결)**
```env
PC_IP=172.30.1.13
```

**B: `config.js` 수정 (API 서버 연결)**
```javascript
export const PC_IP = "172.30.1.13";
```

> ⚠️ `config.js`는 커밋하지 마세요! (본인 IP 노출됨)

### 3. Docker 재시작
```bash
docker compose down
docker compose up -d
docker logs yunissaem-frontend-1
```

QR 코드가 출력되면 Expo Go 앱으로 스캔!


