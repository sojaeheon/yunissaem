# Dockerfile 작성 요령
### Dockerfile 주요 명령어
- `FROM` 
  - 이미지를 만들 때 기반이 될 베이스 이미지를 지정.
  - 모든 Dockerfile의 첫 줄에 위치해야한다
  - `FROM python:3.9-slim`
- `WORKDIR`
  - 컨테이너 내부에서 명령어를 실행할 작업 디렉토리를 설정
  - `WORKDIR /app`
- `COPY`
  - 호스트 컨퓨터의 파일이나 디렉토리를 컨테이너 내부로 복사
  - `COPY . /app`
- RUN
  - 이미지를 빌드하는 과정에서 필요한 명령어를 실행
  - `RUN pip install -r requirements.txt`
- CMD
  - 컨테이너가 시작될 때 기본으로 실행될 명령어를 설정
  - Dockerfile에서 한 번만 사용할 수 있다.
  - `CMD [ "python","main.py"]`
- EXPOSE
  - 컨테이너가 외부에 노출할 포트를 지정
  - 실제 포트 매핑은 docker run 명령어에서 함
  - `EXPOSE 8000`
  