/*
============================================================
  RegisterScreen 전체 설명 (요약)
============================================================

  - 사용자가 회원가입 정보를 입력하고 서버(/my/signup/)에 POST 요청을 보내는 화면입니다.

  - 입력해야 하는 필드는 Django Serializer(UserRegisterSerializer)에 따라 다음 순서입니다:
      1) username (필수)
      2) password (필수)
      3) password_confirm (필수)
      4) email (선택)
      5) name (필수)
      6) phone (선택)
    → 필수 항목은 UI에도 "(필수)"라고 명시했습니다.

  - 입력값을 변경할 때는 form 상태를 업데이트하며, 필드별 오류는 errors 상태로 별도 관리합니다.
    (errors.username, errors.password 등)

  - 회원가입 버튼을 누르면 axios가 POST 요청을 보내며,
    - 성공 시: Alert로 메시지를 보여주고 "확인"을 누르면 Login 화면으로 이동합니다.
    - 실패 시: 서버가 보내준 필드별 에러(response.data)를 화면 아래 표시합니다.

  - 이 화면은 Navigation의 Stack 내부에서 사용되므로,
    navigation.navigate("Login")으로 로그인 화면으로 이동합니다.

============================================================
*/

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import axios from "axios";
import { BASE_URL } from "../config/config";

export default function RegisterScreen({ navigation }) {
  /*
    ------------------------------------------------------------
    1) form 상태: 사용자 입력값 관리
       - key는 Django Serializer 필드명과 동일해야 함
    ------------------------------------------------------------
  */
  const [form, setForm] = useState({
    username: "",
    password: "",
    password_confirm: "",
    email: "",
    name: "",
    phone: "",
  });

  /*
    ------------------------------------------------------------
    2) errors 상태: 서버에서 받은 필드별 에러 저장
       { username: "...", password: "...", ... }
    ------------------------------------------------------------
  */
  const [errors, setErrors] = useState({});

  /*
    ------------------------------------------------------------
    3) handleChange: 입력값 변경 처리
       - form[field] 값을 갱신
       - errors[field]는 즉시 초기화하여 에러 문구 제거
    ------------------------------------------------------------
  */
  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: "" });
  };

  /*
    ------------------------------------------------------------
    4) handleRegister: 회원가입 요청 처리
       - axios로 POST /my/signup/ 요청
       - 성공 시: Alert -> Login 화면 이동
       - 실패 시: response.data의 필드별 에러를 errors에 저장해 화면 표시
    ------------------------------------------------------------
  */
  const handleRegister = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/my/signup/`, form);

      Alert.alert("회원가입 성공", res.data.message, [
        {
          text: "확인",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (err) {
      // Django serializer validation error (400)
      if (err.response?.status === 400) {
        setErrors(err.response.data);
      } else {
        // 서버 연결 불가 또는 서버 에러
        Alert.alert("오류", "서버와 연결할 수 없습니다.");
      }
    }
  };

  /*
    ------------------------------------------------------------
    5) 렌더링
    ------------------------------------------------------------
  */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      {/* ----------------------- 아이디 ----------------------- */}
      <Text style={styles.label}>아이디 (필수)</Text>
      <TextInput
        style={styles.input}
        placeholder="아이디를 입력하세요"
        placeholderTextColor="#aaa"
        value={form.username}
        onChangeText={(v) => handleChange("username", v)}
      />
      {errors.username && <Text style={styles.error}>{errors.username}</Text>}

      {/* ----------------------- 비밀번호 ----------------------- */}
      <Text style={styles.label}>비밀번호 (필수)</Text>
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={form.password}
        onChangeText={(v) => handleChange("password", v)}
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      {/* ----------------------- 비밀번호 확인 ----------------------- */}
      <Text style={styles.label}>비밀번호 확인 (필수)</Text>
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={form.password_confirm}
        onChangeText={(v) => handleChange("password_confirm", v)}
      />
      {errors.password_confirm && (
        <Text style={styles.error}>{errors.password_confirm}</Text>
      )}

      {/* ----------------------- 이메일 ----------------------- */}
      <Text style={styles.label}>이메일</Text>
      <TextInput
        style={styles.input}
        placeholder="example@email.com"
        placeholderTextColor="#aaa"
        value={form.email}
        onChangeText={(v) => handleChange("email", v)}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      {/* ----------------------- 이름 ----------------------- */}
      <Text style={styles.label}>이름 (필수)</Text>
      <TextInput
        style={styles.input}
        placeholder="이름을 입력하세요"
        placeholderTextColor="#aaa"
        value={form.name}
        onChangeText={(v) => handleChange("name", v)}
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}

      {/* ----------------------- 전화번호 ----------------------- */}
      <Text style={styles.label}>전화번호</Text>
      <TextInput
        style={styles.input}
        placeholder="xxx-xxxx-xxxx"
        placeholderTextColor="#aaa"
        value={form.phone}
        onChangeText={(v) => handleChange("phone", v)}
      />
      {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

      {/* ----------------------- 회원가입 버튼 ----------------------- */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>

      {/* ----------------------- 로그인 화면 이동 ----------------------- */}
      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginLinkText}>
          이미 계정이 있으신가요? 로그인하기
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/*
============================================================
  스타일 설정
============================================================
*/
const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 25,
    color: "#222",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 14,
    color: "#333",
  },
  input: {
    borderWidth: 1.2,
    borderColor: "#d0d0d0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  error: {
    color: "tomato",
    marginTop: 4,
    fontSize: 13,
    marginBottom: -8,
  },
  button: {
    backgroundColor: "tomato",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: 20,
    alignSelf: "center",
  },
  loginLinkText: {
    color: "#555",
    fontSize: 14,
  },
});
