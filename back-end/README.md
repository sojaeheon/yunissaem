# yunissaem  

## back-end 개발 환경

- **언어**: Python 3.11  
- **프레임워크**: Django  
- **가상환경**: venv  

---

## 📁 프로젝트 구조

```
yunissaem/
├── manage.py
├── requirements.txt
├── venv/ # 가상환경 폴더
├── yunissaem/ # 프로젝트 설정 폴더
│ ├── init.py
│ ├── asgi.py
│ ├── settings.py
│ ├── urls.py
│ └── wsgi.py
├── [app_name]/ # Django 앱 (예: users, posts 등)
│ ├── migrations/
│ ├── init.py
│ ├── admin.py
│ ├── apps.py
│ ├── models.py
│ ├── tests.py
│ └── views.py
```

> **참고**: `[app_name]`은 실제 생성한 앱 이름으로 변경해주세요.

---

## 개발 시작하기

### 1. 가상환경 설정

가상환경 폴더가 없다면 아래 명령어로 생성합니다.

```bash
$ python -m venv venv
```
가상환경 활성화 (Windows 기준):
```bash
$ source venv/Scripts/activate
```

### 2. 의존성 설치
```bash
$ pip install -r requirements.txt
```

## 앱 개발

### 1. 새로운 앱 시작

```bash
$ python manage.py startapp [앱 이름]
```

### 2. DB 마이그레이션
**settings.py, 모델, DB에 변경이 있을 경우 매번 아래 명령어 실행**  

```bash
$ python manage.py makemigrations
$ python manage.py migrate
```

### 3. Django 서버 실행  

```bash
$ python manage.py runserver
```
* 접속 주소: http://127.0.0.1:8000

## 📌 기타 참고 사항
> Django 앱을 추가하면 settings.py의 INSTALLED_APPS에 해당 앱을 등록해야 합니다.  
.env 파일을 사용하는 경우, 환경변수 로딩을 위해 python-decouple, django-environ 등을 활용할 수 있습니다.  