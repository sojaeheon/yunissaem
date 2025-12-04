import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_PERCENT = 0.5;
const CLOSE_THRESHOLD = SCREEN_HEIGHT * CLOSE_PERCENT;

export default function AIChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: "1", from: "bot", text: "안녕하세요! 과외 소개글을 도와드릴게요." },
  ]);
  const [input, setInput] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // translateY는 시트(흰색 패널)에 적용
  const translateY = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  const flatListRef = useRef(null);

  const closeAndGoLessonCreate = (passParams) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT + 10,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      // 1) 모달(현재 스크린) 제거
      try {
        if (navigation && typeof navigation.dismiss === "function") {
          navigation.dismiss();
        } else if (navigation && typeof navigation.goBack === "function" && navigation.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else if (navigation && typeof navigation.pop === "function") {
          navigation.pop();
        }
      } catch (e) {
        // ignore
      }

      // 2) 짧은 대기 후 LessonCreate로 포커스 및 params 전달
      setTimeout(() => {
        try {
          navigation.navigate("MainTabs", { screen: "LessonCreate", params: passParams || {} });
        } catch (e) {
          try { navigation.goBack(); } catch (_e) {}
        } finally {
          isClosingRef.current = false;
        }
      }, 120);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < 30;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const limited = Math.min(gestureState.dy, SCREEN_HEIGHT);
          translateY.setValue(limited);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalDy = gestureState.dy;
        if (finalDy > CLOSE_THRESHOLD) {
          closeAndGoLessonCreate();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e) => {
      const h = e?.endCoordinates?.height ?? 0;
      setKeyboardHeight(h);
      // 키보드 열릴 때 메시지 맨 아래로 스크롤
      setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 50);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const sendMessage = () => {
    if (!input) return;
    const newMsg = { id: Date.now().toString(), from: "user", text: input };
    const botReply = {
      id: (Date.now() + 1).toString(),
      from: "bot",
      text: `👉 ${input} 에 맞는 예시 소개글입니다.`,
    };

    setMessages((prev) => [...prev, newMsg, botReply]);
    setInput("");
    setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 50);
  };

  const copyToLesson = (text) => {
    // 닫으면서 introText 전달
    closeAndGoLessonCreate({ introText: text });
  };

  return (
    // 루트는 투명. underlying 화면이 바로 보이도록 함.
    <View style={styles.transparentRoot}>
      {/* 흰색 시트만 움직임 */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.header}>
          <View style={styles.handle} />
          <Text style={styles.headerTitle}>AI 챗봇</Text>
          <TouchableOpacity onPress={() => closeAndGoLessonCreate()} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={26} color="black" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10, paddingBottom: 140 + keyboardHeight }}
          renderItem={({ item }) => (
            <View style={[styles.msgBubble, item.from === "user" ? styles.userMsg : styles.botMsg]}>
              <Text style={{ flex: 1 }}>{item.text}</Text>
              {item.from === "bot" && (
                <TouchableOpacity onPress={() => copyToLesson(item.text)} style={styles.copyBtn}>
                  <Ionicons name="copy" size={18} color="black" />
                </TouchableOpacity>
              )}
            </View>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        <View style={[styles.inputRow, { bottom: 40 + keyboardHeight }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="챗봇에게 메시지 보내기"
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Button title="전송" onPress={sendMessage} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  transparentRoot: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "transparent",
  },
  sheet: {
    position: "absolute",
    left: 0, right: 0, bottom: 0, top: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    elevation: 8,
  },
  // 변경: 헤더 높이와 상단 여백를 늘려 드래그 영역 확장
  header: {
    height: 80,
    paddingTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 10,
  },
  // 변경: 핸들 크기 키워서 시각적/터치 영역 확장
  handle: {
    position: "absolute",
    top: 18,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", marginTop: 18 },
  closeBtn: { position: "absolute", right: 12, top: 18 },
  msgBubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userMsg: { backgroundColor: "#d1fcd3", alignSelf: "flex-end" },
  botMsg: { backgroundColor: "#f1f1f1", alignSelf: "flex-start" },
  copyBtn: { marginLeft: 10 },
  inputRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 40,               // 기본값 (키보드가 올라오면 inline style로 덮어씀)
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginRight: 8,
  },
});
