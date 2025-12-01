/*
  LoginScreen 전체 설명 (요약)

  - 사용자가 아이디(username)와 비밀번호(password)를 입력해 로그인하는 화면입니다.
  - 로그인 API(/my/login/)로 POST 요청을 보내며, 정상적으로 인증되면 access/refresh 토큰을 전달받습니다.
  - 받은 토큰은 expo-secure-store를 사용해 기기에 안전하게 저장되며, 이후 모든 API 요청에서 자동으로 사용됩니다.

  - 로그인 성공 시 navigation.replace("MainTabs")를 통해 메인 탭(Home, 과외생성, 채팅, 마이페이지) 화면으로 이동합니다.
  - 입력값이 비어 있을 경우 클라이언트 단에서 Alert를 띄워 즉시 검증합니다.
  
  - axiosInstance는 모든 요청에 대해 Authorization 헤더에 Bearer 토큰을 자동으로 포함시키며,
    토큰 만료 시 refresh 토큰을 이용해 자동 재발급하는 인터셉터를 포함하고 있습니다.

  - UI는 TextInput으로 아이디/비밀번호 입력을 받고, 하단 버튼을 통해 로그인/회원가입 화면으로 이동합니다.
  - 스타일은 RN 기본 StyleSheet를 사용하여 간단한 로그인 폼 형태로 구성되어 있습니다.

  - 주의: BASE_URL 및 엔드포인트는 개발 환경 기준이며, 배포 시 환경 변수(.env) 기반으로 분리해야 합니다.
*/

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import api from "../utils/axiosInstance";
import { saveTokens } from "../utils/tokenStorage";

export default function LoginScreen({ navigation }) {
  // 입력값 상태 관리
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /**
   * handleLogin()
   * - 입력값 유효성 검사
   * - 로그인 API 호출 (POST /my/login/)
   * - access / refresh 토큰을 SecureStore에 저장
   * - 로그인 성공 → MainTabs 화면으로 이동
   */
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("알림", "아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      // 로그인 API 요청
      const res = await api.post("/my/login/", { username, password });
      console.log("LOGIN RESPONSE:", res.data);

      // 토큰 저장
      await saveTokens(res.data.access, res.data.refresh);

      // 로그인 성공 → 메인 탭으로 이동
      navigation.replace("MainTabs");
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("로그인 실패", "아이디 또는 비밀번호를 다시 확인하세요.");
    }
  };

  return (
    <View style={styles.container}>
      {/* 타이틀 */}
      <Text style={styles.title}>로그인</Text>

      {/* 아이디 입력 */}
      <TextInput
        style={styles.input}
        placeholder="아이디"
        value={username}
        onChangeText={setUsername}
      />

      {/* 비밀번호 입력 */}
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* 로그인 버튼 */}
      <View style={styles.btnWrapper}>
        <Button title="로그인" onPress={handleLogin} />
      </View>

      {/* 회원가입 이동 버튼 */}
      <View style={styles.btnWrapper}>
        <Button
          title="회원가입"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </View>
  );
}

/* 스타일 */
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff"
  },
  title: { 
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center" 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  btnWrapper: { 
    marginTop: 12 
  },
});
