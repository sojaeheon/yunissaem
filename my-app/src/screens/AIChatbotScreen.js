import { useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AIChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: "1", from: "bot", text: "안녕하세요! 과외 소개글을 도와드릴게요." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input) return;
    const newMsg = { id: Date.now().toString(), from: "user", text: input };
    const botReply = { id: (Date.now() + 1).toString(), from: "bot", text: `👉 ${input} 에 맞는 예시 소개글입니다.` };

    setMessages((prev) => [...prev, newMsg, botReply]);
    setInput("");
  };

  const copyToLesson = (text) => {
    alert(`복사됨: ${text}`);
    navigation.navigate("LessonCreate", { introText: text }); // 과외 생성 페이지로 전달
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.msgBubble, item.from === "user" ? styles.userMsg : styles.botMsg]}>
            <Text>{item.text}</Text>
            {item.from === "bot" && (
              <TouchableOpacity onPress={() => copyToLesson(item.text)} style={styles.copyBtn}>
                <Ionicons name="copy" size={18} color="black" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="챗봇에게 메시지 보내기"
        />
        <Button title="전송" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  msgBubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userMsg: { backgroundColor: "#d1fcd3", alignSelf: "flex-end" },
  botMsg: { backgroundColor: "#f1f1f1", alignSelf: "flex-start" },
  copyBtn: { marginLeft: 10 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginRight: 5,
  },
});
