# 🧠 Front-End (React Native + Expo)

> **Note:**  
> 1~3 단계는 이미 완료된 상태이므로 현재 진행 시 **건너뛰세요.**

---

## 🚀 1. 프로젝트 생성 (✅ 이미 완료)

```bash
npx create-expo-app@latest my-app
my-app → 프로젝트 이름

기본 템플릿이 아닌 blank 템플릿으로 생성하려면 아래 명령어를 사용하세요:

npx create-expo-app@latest my-app --template blank


이렇게 하면 Expo Router 템플릿이 포함되지 않으므로
이후 Expo 캐시 초기화 관련 단계를 생략할 수 있습니다.
```

---

## 📦 2. 필수 패키지 설치 (✅ 이미 완료)

```bash
React Navigation 기본 설치:

npm install @react-navigation/native @react-navigation/native-stack


React Navigation 실행에 필요한 Expo 패키지 설치:

npx expo install react-native-screens react-native-safe-area-context
```

---

## 🧭 3. 탭 네비게이터 설치 (✅ 이미 완료)

```bash
탭 네비게이터 관련 패키지 설치:

npm install @react-navigation/bottom-tabs
npx expo install react-native-gesture-handler react-native-reanimated


⚙️ 참고:
npx create-expo-app@latest my-app 명령으로 생성된 기본 템플릿은
app 또는 add 폴더를 포함하는 Expo Router 구조입니다.
직접 만든 화면(screens)을 사용하려면 해당 기본 템플릿 폴더를 삭제하세요.
```

---

## 🧰 4. 실행 전 준비

```bash
⚠️ 주의: 반드시 프로젝트 폴더로 이동한 뒤 명령어를 실행하세요.

cd my-app
npm install


이 명령어는 package.json 파일 내의 "dependencies" 항목에 명시된
모든 패키지를 자동으로 설치합니다.

(별도의 가상환경 venv 설정은 필요하지 않습니다.)
```

---

## ▶️ 5. 실행하기

```bash
기본 실행 명령:

npm start


QR 코드가 터미널 또는 브라우저에 표시됩니다.

같은 Wi-Fi 환경이라면 휴대폰으로 QR 코드를 스캔해 실행 가능합니다.

다른 네트워크일 경우 휴대폰에서는 실행되지 않습니다.

🌐 웹에서도 확인 가능:
실행 후 터미널에 표시되는 http://localhost:XXXX 주소를 클릭하면
웹 브라우저에서 앱 화면을 미리볼 수 있습니다.
```

---

### 💡 추가 옵션 (선택 사항)

```
🔸 터널 모드 실행

다른 네트워크(예: PC와 휴대폰 Wi-Fi가 다를 때)에서 접속 가능하게 함.

npx expo start --tunnel

🔸 웹 전용 실행

React Native Web 패키지 설치 후, 브라우저에서 실행 가능.

npx expo install react-dom react-native-web
npx expo start --web
```