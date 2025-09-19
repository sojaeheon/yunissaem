import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ← 아이콘 사용

const categories = [
  { key: "전체", icon: "📚" },
  { key: "음악", icon: "🎵" },
  { key: "운동", icon: "🏃" },
  { key: "예술", icon: "🎨" },
  { key: "프로그래밍", icon: "💻" },
  { key: "금융/재테크", icon: "💰" },
  { key: "외국어", icon: "🌍" },
];

export default function CategoryMenu({ visible, onClose, navigation }) {
  const [isMounted, setIsMounted] = useState(visible);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsMounted(false);
      });
    }
  }, [visible]);

  if (!isMounted) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 배경 오버레이 */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[styles.overlay, { opacity: overlayAnim }]}
          pointerEvents={visible ? "auto" : "none"} // ✅ 메뉴 열릴 때만 터치 차단
        />
      </TouchableWithoutFeedback>

      {/* 메뉴 Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* 헤더 (타이틀 + X 버튼) */}
        <View style={styles.header}>
          <Text style={styles.title}>카테고리</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* 카테고리 리스트 */}
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => {
              onClose();
              navigation.navigate("CategoryLesson", { category: cat.key });
            }}
          >
            <Text style={styles.item}>
              {cat.icon} {cat.key}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%", // 화면 50%
    height: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  item: { fontSize: 18, marginVertical: 10 },
});
