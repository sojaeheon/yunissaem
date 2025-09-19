import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function FindPasswordScreen({ navigation }) {
  const [id, setId] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>비밀번호 찾기</Text>

      <TextInput
        style={styles.input}
        placeholder="아이디"
        value={id}
        onChangeText={setId}
      />

      <Button
        title="비밀번호 찾기"
        onPress={() => alert("비밀번호는 임시값입니다: 1234")}
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
