# yunissaem_project

React Native (Expo) + Docker (Nginx) 기본 구조 연습용 프로젝트  
**목표**: RN 앱 화면 전환(nav) 연습 + Nginx 컨테이너 테스트  

### 1. 프로젝트 만들기

`npx create-expo-app@latest my-app` (my-app는 프로젝트 이름)<br>
(`npx create-expo-app@latest my-app --template blank` 로 하면 밑의 Expo 캐시 초기화 안봐도 됨<br>
-> 기본 expo-router 템플릿 안쓰겠다는 뜻)

---
## Expo 캐시 초기화

간혹 `Welcome to Expo`, `Start by creating a file in the app directory` 같은 기본 화면이 뜰 때가 있습니다.  

이 경우는 **예전 빌드 결과물이 캐시에 남아 있어서** 발생합니다.  
(실제로는 app/index.tsx 등의 파일이 없어도, 캐시에 저장된 옛 코드가 불러와지는 것)

### 해결 방법

1) PC 캐시 삭제<br>
`npx expo start -c`

2) Expo Go 앱 캐시 삭제<br>
안드로이드:
설정 → 앱 → Expo Go → 저장공간 → 캐시 삭제<br>
iOS: Expo Go 앱 삭제 후 다시 설치

3) 다시 실행<br>
`cd my-app`<br>
`npx expo start`

---

### 2. 필수 패키지 설치
`npm install @react-navigation/native @react-navigation/native-stack`

`npx expo install react-native-screens react-native-safe-area-context`

---

### 3. 탭 네비게이터 설치
`npm install @react-navigation/bottom-tabs`
`npx expo install react-native-gesture-handler react-native-reanimated`

(`npx create-expo-app@latest my-app`로 프로젝트를 만들었고, <br>내가 만든 화면들 띄우려면 기본 템플릿 (add폴더) 삭제해야함)

---

### 4. 실행
`cd my-app`<br>`npx expo start` (QR 나오면 찍기)<br>
단, 실행 중인 컴퓨터와 핸드폰이 연결된 와이파이가 다르다면
`npx expo start --tunnel`

웹에서도 실행하고 싶다?<br>
`npx expo install react-dom react-native-web`<br>
`npx expo start --web`<br>
근데 이거 안해도 `npx expo start` 한 다음 생성되는 localhost 주소 누르면 되긴 함

---

## <현재 폴더 구조>
```
my-project/                   ← 최상위 폴더 (이름 자유)
│
├── my-app/                   ← React Native 앱
│   ├── App.js
│   ├── app.json
│   ├── index.js
│   └── src/
│       ├── navigation/
│       │   └── RootNavigator.js
│       └── screens/
│           ├── LoginScreen.js
│           ├── RegisterScreen.js
│           ├── FindIdScreen.js
│           ├── FindPasswordScreen.js
│           ├── HomeScreen.js
│           ├── CategoryMenu.js
│           ├── CategoryLessonScreen.js
│           ├── LessonCreateScreen.js
│           ├── LessonDetailScreen.js
│           ├── ReviewWriteScreen.js
│           ├── AIChatbotScreen.js
│           ├── ChatListScreen.js
│           ├── ChatScreen.js
│           ├── MyPageScreen.js
│           ├── IntroScreen.js
│           └── SearchScreen.js
│
└── docker-nginx-demo/        ← 서버 (Docker로 실행)
    ├── docker-compose.yml
    └── nginx.conf
```
---

nginx를 docker에 올리기?<br>yml 파일 있는 곳으로 이동 후 `docker compose up -d`<br>
`docker ps`로 올라갔는지 확인 가능

그 후 http://localhost 들어가서 확인 해보기

`docker compose down` 으로 컨테이너 종료