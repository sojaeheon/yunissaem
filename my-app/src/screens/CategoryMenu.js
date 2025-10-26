import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons"; // 아이콘 컴포넌트 (X 버튼 등에서 사용)
import { BASE_URL } from "../config/config";
import { Alert } from "react-native";

/*
  CategoryMenu 전체 설명 (요약)
  - 이 컴포넌트는 화면 오른쪽에서 슬라이드로 나타나는 '카테고리 선택 메뉴'입니다.
  - HomeScreen 등에서 "menuVisible" 상태를 true로 하면 표시됩니다.
  - 사용자가 카테고리를 선택하면 해당 카테고리 이름을 route 파라미터로 전달하여
    "CategoryLessonScreen" 화면으로 이동합니다.
  - 기존에는 categories를 더미 배열로 하드코딩했지만, 실제 운영 시에는
    백엔드 API(/api/categories/)를 호출해 동적으로 카테고리 목록을 불러오도록 개선했습니다.
  - 백엔드 응답은 [{ id, name, icon }, ...] 형태를 가정하며,
    아이콘이 없는 경우 기본 이모지를 표시합니다.
  - 백엔드 통신 실패 시 Alert로 사용자에게 알리고, 기본 더미 목록으로 fallback 처리합니다.
*/


export default function CategoryMenu({ visible, onClose, navigation }) {
  // 메뉴가 화면에 실제로 표시되는지 여부
  const [isMounted, setIsMounted] = useState(visible);

  // 카테고리 데이터 (서버에서 불러오기)
  const [categories, setCategories] = useState([]); // 서버 응답 저장
  const [loading, setLoading] = useState(false); // 로딩 상태 관리

  // 애니메이션 값 초기화
  const slideAnim = useRef(new Animated.Value(300)).current; // 메뉴 슬라이드 위치 (오른쪽에서 등장)
  const overlayAnim = useRef(new Animated.Value(0)).current; // 배경 오버레이의 투명도

  // ---------------------------
  // axios를 이용한 백엔드 카테고리 호출
  // ---------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // 백엔드에서 카테고리 목록 가져오기
        // ⚠️ 일단 경로는 임의로 설정 (백엔드와 협의 필요)
        const res = await axios.get(`${BASE_URL}/categories/`);
        // 응답이 배열 형태인지 확인 후 상태에 저장
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else if (Array.isArray(res.data.results)) {
          setCategories(res.data.results);
        } else {
          throw new Error("Unexpected API response format");
        }
      } catch (err) {
        console.error("fetchCategories error:", err);
        Alert.alert("카테고리 로드 실패", "서버에 연결할 수 없습니다.");
        // 실패 시 fallback용 더미 데이터
        // 카테고리는 기능정의서에 나온 것들로만 구성
        setCategories([
          { name: "전체", icon: "📚" },
          { name: "음악", icon: "🎵" },
          { name: "운동", icon: "🏃" },
          { name: "예술", icon: "🎨" },
          { name: "프로그래밍", icon: "💻" },
          { name: "금융/재테크", icon: "💰" },
          { name: "외국어", icon: "🌍" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);


  // ---------------------------
  // 메뉴 열기/닫기 애니메이션
  // ---------------------------
  // visible 상태가 바뀔 때마다 애니메이션 실행
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
              navigation.navigate("CategoryLesson", { category: cat.name }); // 카테고리별 페이지 이동
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
