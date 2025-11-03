import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function RegisterScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput style={styles.input} placeholder="이름" />
      <TextInput style={styles.input} placeholder="전화번호" />
      <TextInput style={styles.input} placeholder="아이디" />
      <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry />
      <TextInput style={styles.input} placeholder="이메일" />
      <Button title="회원가입 완료" onPress={() => navigation.navigate("Login")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 10 },
});
