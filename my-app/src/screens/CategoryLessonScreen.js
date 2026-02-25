/*
  CategoryLessonScreen 전체 설명 (요약)
  [주요 기능 요약]
  - 특정 카테고리(또는 "전체")에 속한 과외 목록을 서버에서 조회해 표시합니다.

  - 카테고리별 조회 시: /courses/category/{category_id}/

  [지원 기능]
  - 정렬 옵션: 최신순 / 인기순 / 리뷰 많은 순

  - 찜(좋아요) 토글 기능

  - 신청 불가 항목 보기: 정원 초과 시 자동 비활성화 처리

  - 검색 기능: 제목 기준 실시간 필터링

  - 카테고리 메뉴(CategoryMenu) 슬라이드 Drawer를 통해 다른 카테고리로 이동 가능

  - 뒤로가기(헤더 및 하드웨어) 시 동작:
      ① 현재 상태가 변경되어 있으면 → 화면 초기화만 수행
      ② 이미 초기 상태라면 → 이전 화면으로 이동
*/


import React, { useState, useLayoutEffect, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Switch,
  Image,
  TextInput,
  Keyboard,
  BackHandler,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/axiosInstance";
import { BASE_URL, SERVER_BASE } from "../config/config";
import CategoryMenu from "../screens/CategoryMenu";

export default function CategoryLessonScreen({ navigation, route }) {
  // -----------------------------------------------------------
  // 기본 파라미터 및 상태 변수 정의
  // -----------------------------------------------------------

  // 라우트 파라미터에서 선택된 카테고리명 및 카테고리 ID 추출
  const { category, categoryId } = route.params || { category: "전체" };

  // UI 상태 관리
  const [showUnavailable, setShowUnavailable] = useState(false); // 신청 불가 항목 보기 여부
  const [sortOption, setSortOption] = useState("최신순"); // 현재 정렬 기준
  const [dropdownVisible, setDropdownVisible] = useState(false); // 정렬 옵션 드롭다운 표시 여부
  const [favoriteIds, setFavoriteIds] = useState([]); // 사용자가 찜한 강의 ID 목록
  const [menuVisible, setMenuVisible] = useState(false); // 카테고리 메뉴 표시 여부


  // 검색 관련 상태 관리
  const [searchQuery, setSearchQuery] = useState(""); // 입력 중인 검색어
  const [searchTerm, setSearchTerm] = useState(""); // 실제 필터링에 사용되는 검색어
  const [searchFocused, setSearchFocused] = useState(false); // 검색창 포커스 여부
  const searchInputRef = useRef(null); // 검색창 포커스 제어용 ref

  // 서버 데이터 상태 관리
  const [lessons, setLessons] = useState([]); // 서버에서 받아온 강의 목록
  const [loading, setLoading] = useState(false); // 로딩 상태 제어용

  // 내부 상태 제어용 Ref
  const firstRenderRef = useRef(true); // 첫 렌더링 여부
  const keyboardVisibleRef = useRef(false); // 키보드 표시 상태
  const keyboardHeightRef = useRef(0); // 키보드 높이 (Toast 위치 조정용)
  const lastToastRef = useRef(null); // 마지막 Toast 설정값 저장용

  // -----------------------------------------------------------
  // 서버에서 과외 목록 데이터 불러오기
  // -----------------------------------------------------------
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        let endpoint;

        // 정렬 파라미터 설정
        let sortParam = "";
        if (sortOption === "인기순") sortParam = "?sort=popular";
        else if (sortOption === "리뷰 많은 순") sortParam = "?sort=review";
        else sortParam = ""; // 최신순 → 쿼리 없음

        endpoint = `${BASE_URL}/courses/category/${categoryId}/${sortParam}`;

        const res = await api.get(endpoint);
        let data = res.data.courses ?? [];
        
        // 서버 응답 데이터 정규화
        const normalized = data.map((item) => {
          const enrolled = item.current_tutees_count ?? item.view_count ?? 0;
          const capacity = item.max_tutees ?? 0;

          return {
            id: item.id,
            title: item.title,
            thumbnail: item.thumbnail_image_url?.startsWith("/")
              ? SERVER_BASE + item.thumbnail_image_url
              : item.thumbnail_image_url,
            description: item.introduction || item.description || "소개가 없습니다.",
            tutor: item.tutor_name || item.tutor || "강사 정보 없음",
            enrolled,
            capacity,
            view_count: item.view_count ?? 0,
            updated_at: item.updated_at ?? null,
            rating: item.average_rating ?? item.rating ?? "-",
            available: enrolled < capacity, // 수강 인원 >= 정원이면 신청 불가 처리
            category: item.category_name || category || "전체",
          };
        });

        setLessons(normalized);
      } catch (err) {
        console.error("fetchLessons error:", err);
        Alert.alert("데이터 로드 실패", "서버에 연결할 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [category, categoryId, sortOption]);

  // -----------------------------------------------------------
  // 화면 초기화: “맨 처음 상태”로 되돌리기
  // -----------------------------------------------------------
  const resetToPristine = () => {
    setSearchQuery("");
    setSearchTerm("");
    setSearchFocused(false);
    setDropdownVisible(false);
    setShowUnavailable(false);
    setSortOption("최신순");
    Keyboard.dismiss();
    Toast.hide();
  };

  // 현재 상태가 “초기 상태”인지 판별
  const isPristine = () =>
    searchQuery === "" &&
    searchTerm === "" &&
    !searchFocused &&
    !dropdownVisible &&
    showUnavailable === false &&
    sortOption === "최신순";

  // -----------------------------------------------------------
  // Toast 표시 및 키보드 이벤트 처리
  // -----------------------------------------------------------
  const showSmartToast = (opts) => {
    const offset = keyboardVisibleRef.current
      ? keyboardHeightRef.current + 60
      : 60;

    const config = {
      position: "bottom",
      ...opts,
      bottomOffset: offset,
      visibilityTime: 2500,
      onPress: () => {
        Toast.hide();
        lastToastRef.current = null;
      },
      onHide: () => {
        setTimeout(() => (lastToastRef.current = null), 2700);
      },
    };

    Toast.hide();
    requestAnimationFrame(() => {
      Toast.show(config);
      lastToastRef.current = config;
    });
  };

  // 키보드 표시 시 Toast 위치 자동 조정
  useEffect(() => {
    const onShow = (e) => {
      keyboardVisibleRef.current = true;
      keyboardHeightRef.current = e?.endCoordinates?.height ?? 0;
      if (lastToastRef.current) {
        const updated = {
          ...lastToastRef.current,
          bottomOffset: keyboardHeightRef.current + 60,
        };
        Toast.hide();
        requestAnimationFrame(() => {
          Toast.show(updated);
          lastToastRef.current = updated;
        });
      }
    };

    const onHide = () => {
      keyboardVisibleRef.current = false;
      if (lastToastRef.current) {
        const updated = { ...lastToastRef.current, bottomOffset: 60 };
        Toast.hide();
        requestAnimationFrame(() => {
          Toast.show(updated);
          lastToastRef.current = updated;
        });
      }
    };

    const s1 = Keyboard.addListener("keyboardDidShow", onShow);
    const s2 = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  // -----------------------------------------------------------
  // 뒤로가기 동작 정의 (헤더 / 하드웨어)
  // -----------------------------------------------------------
  // 헤더 뒤로가기
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      Toast.hide();
      lastToastRef.current = null;

      if (!isPristine()) {
        e.preventDefault();
        resetToPristine();
        return;
      }
    });
    return unsub;
  }, [navigation, searchQuery, searchTerm, searchFocused, dropdownVisible, showUnavailable, sortOption]);

  // 안드로이드 하드웨어 뒤로가기
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        if (!isPristine()) {
          resetToPristine();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [searchQuery, searchTerm, searchFocused, dropdownVisible, showUnavailable, sortOption])
  );

  // -----------------------------------------------------------
  // 헤더 타이틀 설정
  // -----------------------------------------------------------
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${category} 과외 목록`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}   // 메뉴 열기
          style={{ marginRight: 12 }}
        >
          <Ionicons name="menu" size={26} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, category]);

  // -----------------------------------------------------------
  // 찜(좋아요) 토글 기능
  // -----------------------------------------------------------
  const toggleFavorite = async (id) => {
    try {
      const res = await api.post(`/courses/${id}/wish/`);
      const isLiked = res.data.is_wished;

      setFavoriteIds((prev) =>
        isLiked ? [...prev, id] : prev.filter((f) => f !== id)
      );

      // 사용자 피드백
      Alert.alert("알림", res.data.message || (isLiked ? "찜 추가" : "찜 해제"));
    } catch (err) {
      console.error("❌ 찜 토글 실패:", err.response?.data || err);
      Alert.alert("오류", "찜 기능 실행 중 문제가 발생했습니다.");
    }
  };


  // -----------------------------------------------------------
  // 필터링 처리 (정렬은 서버에서)
  // -----------------------------------------------------------
  const filteredLessonsRaw = lessons.filter(
    (l) =>
      (category === "전체" || l.category === category) &&
      (showUnavailable || l.available) &&
      (searchTerm === "" || l.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 같은 강의가 중복 표시되는 경우를 방지 (제목+튜터 기준)
  const filteredLessons = Array.from(
    new Map(
      filteredLessonsRaw.map((item) => [
        `${(item.title || "").trim().toLowerCase()}::${(item.tutor || "").trim().toLowerCase()}`,
        item,
      ])
    ).values()
  );

  // -----------------------------------------------------------
  // 렌더링
  // -----------------------------------------------------------
  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* 검색창 */}
      <View style={styles.searchWrapper}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchBar}
          placeholder="과외 검색하기"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => {
            setSearchFocused(true);
            Toast.hide();
          }}
          onBlur={() => {
            setSearchFocused(false);
            setSearchTerm(searchQuery);
          }}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            setSearchTerm(searchQuery);
          }}
        />

        {/* 돋보기 / 닫기 아이콘 */}
        {searchQuery === "" ? (
          <TouchableOpacity
            onPress={() => searchInputRef.current?.focus()}
            style={styles.iconBtn}
          >
            <Ionicons name="search" size={20} color="#888" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setSearchTerm("");
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            style={styles.iconBtn}
          >
            <Ionicons name="close" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* 옵션 영역 (토글 + 정렬) */}
      <View style={styles.optionRow}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>신청 불가 항목 보기</Text>
          <Switch value={showUnavailable} onValueChange={setShowUnavailable} />
        </View>

        {/* 정렬 드롭다운 */}
        <View style={styles.dropdown}>
          <TouchableOpacity onPress={() => setDropdownVisible((p) => !p)}>
            <Text style={styles.dropdownSelected}>{sortOption} ▼</Text>
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownMenu}>
              {["최신순", "인기순", "리뷰 많은 순"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    setSortOption(opt);
                    setDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItem,
                      sortOption === opt && styles.dropdownActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 카드 리스트 */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>불러오는 중...</Text>
        </View>
      ) : filteredLessons.length === 0 ? (
        <Pressable
          style={styles.noResultBox}
          onPress={() => searchInputRef.current?.focus()}
        >
          <Text style={styles.noResultText}>검색 결과가 없습니다 😢</Text>
        </Pressable>
      ) : (
        <FlatList
          data={filteredLessons}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => {
            const isFavorite = favoriteIds.includes(item.id);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  !dropdownVisible &&
                  navigation.navigate("LessonDetail", { lesson: item })
                }
                activeOpacity={0.8}
              >
                <View
                  style={[styles.cardInner, !item.available && styles.cardUnavailable]}
                >
                  <Image
                    source={{
                      uri:
                        item.thumbnail ||
                        "https://dummyimage.com/100x100/cccccc/000000&text=No+Image",
                    }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.lessonTitle}>{item.title}</Text>
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.footerRow}>
                      <View>
                        <Text style={styles.tutor}>{item.tutor}</Text>
                        <Text style={styles.capacity}>
                          {item.enrolled}/{item.capacity}
                        </Text>
                        <Text style={styles.rating}>★ {item.rating ?? "-"}</Text>
                      </View>
                      {item.available && (
                        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                          <Ionicons
                            name={isFavorite ? "heart" : "heart-outline"}
                            size={26}
                            color={isFavorite ? "tomato" : "#aaa"}
                            style={styles.heartIcon}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
                {!item.available && (
                  <Text style={styles.unavailableTag}>신청 불가</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
      {/* 카테고리 메뉴 (슬라이드 Drawer) */}
      <CategoryMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}


// -----------------------------------------------------------
// 스타일 정의
// -----------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  searchWrapper: { position: "relative", marginTop: 0, marginBottom: 12 },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 32,
  },
  iconBtn: { position: "absolute", right: 8, top: "50%", transform: [{ translateY: -10 }] },
  noResultBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  noResultText: { fontSize: 15, color: "#777" },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  switchRow: { flexDirection: "row", alignItems: "center" },
  switchLabel: { marginRight: 8 },
  dropdown: { position: "relative" },
  dropdownSelected: { fontSize: 14, color: "blue" },
  dropdownMenu: {
    position: "absolute",
    top: 24,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    minWidth: 120,
    zIndex: 10,
    elevation: 3,
  },
  dropdownItem: { padding: 8, fontSize: 14, color: "#333" },
  dropdownActive: { fontWeight: "bold", color: "tomato" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    position: "relative",
  },
  cardInner: { flexDirection: "row", alignItems: "center", padding: 10, minHeight: 120 },
  cardUnavailable: { opacity: 0.4 },
  thumbnail: { width: 90, height: 90, borderRadius: 8, marginRight: 12 },
  cardContent: { flex: 1, justifyContent: "space-between" },
  lessonTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  description: { fontSize: 13, color: "#555", marginBottom: 8, lineHeight: 18 },
  rating: { fontSize: 13, color: "#f5a623", marginBottom: 2 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  tutor: { fontSize: 13, fontWeight: "500" },
  capacity: { fontSize: 12, color: "gray" },
  unavailableTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "tomato",
    color: "#fff",
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    opacity: 1,
    fontWeight: "bold",
    zIndex: 10,
  },
  heartIcon: { marginLeft: 8, marginBottom: 2 },
});
