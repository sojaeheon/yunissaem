import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // 아이콘 컴포넌트 (X 버튼 등에서 사용)

/*
  CategoryMenu 전체 설명 (요약)
  - 이 컴포넌트는 화면 오른쪽에서 슬라이드로 나타나는 '카테고리 선택 메뉴'입니다.
  - HomeScreen 등에서 "menuVisible" 상태를 true로 하면 표시됩니다.
  - 기존에는 백엔드 API를 호출하여 카테고리를 불러왔지만,
    현재는 프론트 상수(STATIC_CATEGORIES)로 관리하여 서버 부하를 줄였습니다.
*/

// 고정 카테고리 데이터 (프론트 상수)
const STATIC_CATEGORIES = [
  { id: 0, name: "전체", icon: "📚" },
  { id: 1, name: "음악", icon: "🎵" },
  { id: 2, name: "운동", icon: "🏃" },
  { id: 3, name: "예술", icon: "🎨" },
  { id: 4, name: "프로그래밍", icon: "💻" },
  { id: 5, name: "금융/재테크", icon: "💰" },
  { id: 6, name: "외국어", icon: "🌍" },
  { id: 7, name: "기타", icon: "📦" },
];

export default function CategoryMenu({ visible, onClose, navigation }) {
  // 메뉴가 화면에 실제로 표시되는지 여부
  const [isMounted, setIsMounted] = useState(visible);

  // 카테고리 데이터: 서버 요청 대신 상수 사용
  const [categories, setCategories] = useState(STATIC_CATEGORIES);

  // 애니메이션 값 초기화
  const slideAnim = useRef(new Animated.Value(300)).current; // 메뉴 슬라이드 위치 (오른쪽에서 등장)
  const overlayAnim = useRef(new Animated.Value(0)).current; // 배경 오버레이의 투명도

  // ---------------------------
  // 메뉴 열기/닫기 애니메이션
  // ---------------------------
  useEffect(() => {
    if (visible) {
      // 메뉴가 열릴 때: 마운트 + 슬라이드 인
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, // 오른쪽에서 0으로 이동 (화면 안쪽)
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0.5, // 반투명 배경 표시
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 메뉴가 닫힐 때: 슬라이드 아웃 + 배경 사라짐
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300, // 오른쪽으로 밀어내기
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0, // 투명하게 사라짐
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 애니메이션 종료 후 실제로 컴포넌트를 언마운트
        setIsMounted(false);
      });
    }
  }, [visible]);

  // 메뉴가 닫힌 상태라면 렌더링하지 않음
  if (!isMounted) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* --- 배경 오버레이 영역 (터치 시 닫기) --- */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[styles.overlay, { opacity: overlayAnim }]}
          pointerEvents={visible ? "auto" : "none"} // 메뉴 열릴 때만 터치 차단
        />
      </TouchableWithoutFeedback>

      {/* --- 슬라이드 메뉴 본체 (Drawer) --- */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] }, // 슬라이드 애니메이션 적용
        ]}
      >
        {/* 헤더 영역 (제목 + 닫기 버튼) */}
        <View style={styles.header}>
          <Text style={styles.title}>카테고리</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* 카테고리 목록 */}
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => {
              onClose(); // 메뉴 닫기
               // 카테고리별 페이지 이동 (이름과 ID 전달)
              navigation.navigate("CategoryLesson", { category: cat.name, categoryId: cat.id });
            }}
          >
            <Text style={styles.item}>
              {cat.icon} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black", // 반투명 배경
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0, // 오른쪽에서 슬라이드
    width: "50%", // 화면의 절반 차지
    height: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 5, // 안드로이드 그림자 효과
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
