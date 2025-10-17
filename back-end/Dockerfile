# 기본 이미지 설정
FROM python:3.11-slim

# 환경 변수 설정
# 이 설정은 Python 이 .pyc 파일(파이썬 바이트코드 파일)을 생성하지 않도록 한다
# .py 스크립트를 실행할 때, 실행 속도를 약간 빠르게 하려고 __pycache__ 폴더 안에 .pyc라는 컴파일된 파일을 만들어 둔다
# Docker 컨테이너는 일회용으로 사용되기 때문에 거의 내부 코드가 변경되지 않음
# 따라서 .pyc 파일이 주는 약간의 실행 속도 이점은 거의 의미가 없음
ENV PYTHONDONTWRITEBYTECODE 1

# 이 설정은 Python이 출력하는 내용(print()문의 결과)을 버퍼링(buffering)하지 않도록 만듬
# 원래 python은 효율성을 위해 print() 같은 출력을 바로 화면에 표시하지 않고, '버퍼'라는 임시 저장 공간에 모아 뒀다가 한번에 보냄
# docker에서는 컨테이너의 사태를 확인하기 위해 docker logs명령어를 로그를 본다.
# 만약 파이썬이 출력을 버퍼링하면, 에러가 발생하거나 중요한 로그가 찍혀도 버퍼가 다 찰 때까지 로그가 표시되지 않는 문제가 생김
# 이 설정을 켜면 모든 출력이 즉시 전송되므로, 실시간으로 컨테이너의 로그를 확인하고 디버깅하는 데 매우 중요
ENV PYTHONUNBUFFERED 1

# 작업 디렉터리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY requirements.txt /app/

RUN pip install --upgrade pip && pip install -r requirements.txt

# 프로젝트 파일 복사
COPY . /app/