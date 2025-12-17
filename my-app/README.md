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
