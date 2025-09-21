# Nginx
nginx는 웹 서버 프로그램이다. 단순히 웹사이트 파일을 사용자에게 보여주는 것외에도, 리버스 프록시, 로드 밸런서 등 다양한 역할을 수행하는 만든 '문지기(Gatekeeper)'라고 생각하면 된다

### Nginx의 주요 역할
1. 정적 웹 서버 : HTML, CSS, 이미지 파일처럼 변하지 않는 파일들을 빠르고 효율적으로 사용자에게 전달
2. 리버스 프록시(Reverse Proxy) : 사용자의 요청을 직접 처리하는 대신, 내부(예 : Django, Node.js)에게 안전하게 전달하고 응답을 대신 받아 사용자에게 들려준다. 보안과 성능 향상에 큰 도움이 된다
3. 로드 밸런서(Load Balancer) : 여러 대의 내부 서버가 있을 경우, 들어오는 요청을 서버들에게 골고루 분산시켜 과부하를 막아준다.

## nginx.conf 파일 구조와 작성법
nginx의 모든 동작은 .conf 설정 파일을 통해 정의된다. 이 파일은 보통 /etc/nginx/nginx.conf 또는 /etc/nginx/conf.d/default.conf 경로에 있다

### 기본 구조
- 지시어 : `listen 80;` 처럼 `키 값;` 형태로 된 한 줄짜리 설정
- 블록 : `http { ... }` 처럼 특정 컨텍스트를 `{ }`로 묶은 설정 그룹

가장 중요한 블록은 http, server, location이다.
``` conf
# 전역 설정 (보통 프로세스 수 등을 설정)
worker_processes 1;

events {
    # 이벤트 처리 관련 설정
    worker_connections 1024;
}

http { #--------- 웹 서버 관련 설정의 시작
    
    server { #--------- 하나의 웹사이트(가상 호스트) 설정의 시작
        listen 80; # 80번 포트에서 요청을 받음
        server_name example.com; # 이 도메인으로 들어온 요청을 처리

        location / { #--------- 특정 URL 경로에 대한 처리 설정
            # '/'는 모든 요청을 의미
            root /var/www/html; # 요청된 파일을 이 디렉토리에서 찾음
            index index.html; # 기본으로 보여줄 파일
        }
    }
}
```

## 리버스 프록시 conf 파일 작성 예시
Django나 Node.js 같은 웹 애플리케이션 서버를 Nginx 뒤에 연결하는 가장 흔한 시나리오의 설정 파일 예시
- 시나리오 : 사용자가 서버에 접속하면 Nginx가 요청을 받아 localhost:8000에서 실행 중인 웹 애플리케이션으로 전달한다.
- 파일 위치 : /etc/nginx/sites-available/myapp.conf(새 파일 생성)

``` conf
# upstream: 요청을 전달할 백엔드 서버 그룹을 정의합니다.
# 로드 밸런싱을 할 경우 여기에 여러 서버를 추가할 수 있습니다.
upstream myapp_server {
    server 127.0.0.1:8000;
}

server {
    # 80번 포트(http)에서 들어오는 모든 요청을 수신합니다.
    listen 80;

    # 이 서버 블록이 처리할 도메인 이름을 지정합니다.
    # server_name your_domain.com; # 실제 도메인이 있다면 사용

    # 루트 경로("/")로 들어오는 모든 요청을 처리합니다.
    location / {
        # 요청을 'myapp_server' 그룹으로 전달합니다.
        proxy_pass http://myapp_server;

        # 백엔드 서버가 클라이언트의 실제 IP, 프로토콜 등의 정보를 알 수 있도록 헤더를 설정합니다.
        # 이 설정은 대부분의 웹 프레임워크에서 필수적입니다.
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # '/static/' URL로 들어오는 요청은 백엔드 서버로 보내지 않고,
    # Nginx가 직접 지정된 경로에서 파일을 찾아 제공합니다. (성능 향상)
    location /static/ {
        # alias: 지정된 경로 자체를 의미합니다.
        alias /path/to/your/project/static/;
    }
}
```

### 설정 적용 및 관리 명령어
설정 파일을 작성하거나 수정한 후에는 Nginx에 적용해야 한다.
``` conf
# 1. 설정 파일 문법 오류 검사 (가장 중요!)
sudo nginx -t

# 2. (선택) 만든 설정 파일을 Nginx가 읽는 폴더로 링크
# sudo ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/

# 3. Nginx 재시작 또는 설정 리로드
# (서버 중단 없이 설정을 적용하려면 reload 사용)
sudo systemctl restart nginx  # 재시작
sudo systemctl reload nginx   # 리로드 (추천)
```

## nginx실행 명령어를 Dockerfile에 따로 안써도(CMD) 되는 이유
- 실행할 명령어는 있지만 직접 작성하지 않아도 된다
- 그 이유는 공식 Nginx 이미지에 이미 최적의 실행 명령어가 내장되어 있기 때문

### Nginx 베이스 이미지의 마법
우리가 Nginx Dockerfile을 작성할 때 보통 이렇게 시작
``` Dockerfile
FROM nginx:alpine
```
이 nginx:alpine 이라는 베이스 이미지 안에는 이미 다음과 같은 명령어가 CMD로 설정되어 있따
``` Dockerfile
CMD ["nginx","-g","daemon off;"]
```
- nginx : nginx 서버를 실행하는 명령어
- -g 'damon off;' : nginx를 백그라운드가 아닌 포그라운드(foreground)에서 실행시키는 옵션
  - 이것이 핵심이다! Docker 컨테이너 포그라운드에서 실행되는 프로세스가 없으면 '할 일이 끝났다'고 판단하고 바로 종료된다. 이 옵션 때문에 Nginx 컨테이너가 계속 살아있을 수 있다.