import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function FindIdScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>아이디 찾기</Text>

      <TextInput
        style={styles.input}
        placeholder="이름"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="전화번호 또는 이메일"
        value={phone}
        onChangeText={setPhone}
      />

      <Button
        title="아이디 찾기"
        onPress={() => alert("아이디는 예시입니다: user123")}
      />

      <Button title="뒤로가기" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 10 },
});
