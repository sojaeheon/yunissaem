import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets(); // ✅ SafeArea 하단 값 가져오기 (홈 인디케이터 대응)

  // 랜덤 자동응답 후보
  const replies = ["ㅇㅋ👌", "좋아 👍", "ㅋㅋㅋㅋ", "오호라~"];

  const sendMessage = () => {
    if (!text.trim()) return;
    const newMsg = { id: Date.now().toString(), text, sender: "me" };
    setMessages((prev) => [...prev, newMsg]);
    setText("");

    // 자동 스크롤
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // ✅ 2초 후 랜덤 자동 응답
    setTimeout(() => {
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const reply = {
        id: (Date.now() + 1).toString(),
        text: `상대방: ${randomReply}`,
        sender: "other",
      };
      setMessages((prev) => [...prev, reply]);
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 2000);
  };

  useEffect(() => {
    const keyboardListener = Keyboard.addListener("keyboardDidShow", () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => keyboardListener.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 + insets.bottom : 0}
        // ✅ iOS에서 탭바 + SafeArea bottom 만큼 올려줌
      >
        {/* 메시지 리스트 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.sender === "me" ? styles.myMessage : styles.otherMessage,
              ]}
            >
              <Text
                style={item.sender === "me" ? styles.myText : styles.otherText}
              >
                {item.text}
              </Text>
            </View>
          )}
          contentContainerStyle={{ padding: 10 }}
        />

        {/* 입력창 */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="메시지 입력"
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={{ color: "white" }}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "tomato",
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
    borderBottomLeftRadius: 0,
  },
  myText: {
    color: "white",
  },
  otherText: {
    color: "black",
  },
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "tomato",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});
