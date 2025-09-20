# yunissaem  

## back-end 개발 환경
`python=3.11`  
```Powershell
# 만약 venv 폴더(가상환경 폴더)가 없을 시  
$ python -m venv venv
```  
가상환경에서 python 실행  
```Powershell
$ source venv/Scripts/activate 
```
의존성 설치
```Powershell
$ pip install -r requirements.txt
```  
앱을 만들 시  
```Powershell
$ python manage.py startapp [앱 이름]
```

---  

아래는 server 실행 시마다  

settings.py 혹은 DB 등에 변화가 있을 경우, 아래와 같이 migrate 해주어야 함
```Powershell
$ python manage.py makemigrations
$ python manage.py migrate
```  
서버 실행  
```Powershell
$ python manage.py runserver
```
`Port: 127.0.0.1:8000`  
 