import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from "react-native";

export default function LessonCreateScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [intro, setIntro] = useState("");
  const [curriculum, setCurriculum] = useState("");

  const handleUpload = () => {
    Alert.alert("업로드 완료", "과외가 생성되었습니다!", [
      { text: "확인", onPress: () => navigation.navigate("Home") },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>과외 생성</Text>

      <TextInput
        style={styles.input}
        placeholder="과외 제목"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="수강 인원"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="가격 (₩)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="과외 소개"
        value={intro}
        onChangeText={setIntro}
        multiline
      />

      <TextInput
        style={[styles.input, { height: 120 }]}
        placeholder="커리큘럼"
        value={curriculum}
        onChangeText={setCurriculum}
        multiline
      />

      <Button title="썸네일 이미지 업로드" onPress={() => Alert.alert("이미지 업로드 기능은 나중에 구현")} />

      <View style={{ marginTop: 20 }}>
        <Button title="과외 업로드" onPress={handleUpload} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
});
