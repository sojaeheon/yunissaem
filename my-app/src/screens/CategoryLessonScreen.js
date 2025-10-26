/*
  CategoryLessonScreen 전체 설명 (요약)
  - 특정 카테고리(또는 "전체")에 속한 과외 목록을 조회하고 표시하는 화면입니다.
  - ⚠️ 현재는 서버에서 인기 과외(/courses/popular/) 데이터를 불러오며,
    추후에는 선택된 카테고리 ID에 따라 /courses/category/{category_id}/ 형태의 API로 확장 예정입니다.
  - 정렬 옵션(인기순, 최신순, 리뷰 많은 순), 찜(좋아요) 토글, 신청 불가 과외 표시 토글 등의
    필터링 기능을 제공합니다.
  - 찜(좋아요)은 로컬 상태로만 관리되며, 서버 연동은 아직 구현되지 않았습니다.
  - 화면 내 상태를 모두 초기화하는 "맨 처음 상태 복귀(resetToPristine)" 기능이 있으며,
    뒤로가기(헤더·하드웨어) 시 동작이 아래와 같이 정의됩니다:
      ① 현재 상태가 변경되어 있으면 → 초기화만 수행
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
import axios from "axios";
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
  const [sortOption, setSortOption] = useState("인기순"); // 현재 정렬 기준
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
        // 카테고리별 API 엔드포인트 선택
        let endpoint = `${BASE_URL}/courses/popular/`;
        if (category !== "전체" && categoryId) {
          endpoint = `${BASE_URL}/courses/category/${categoryId}/`;
        }

        const res = await axios.get(endpoint);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results ?? [];

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
            rating: item.rating ?? "-",
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
  }, [category, categoryId]);

  // -----------------------------------------------------------
  // 화면 초기화: “맨 처음 상태”로 되돌리기
  // -----------------------------------------------------------
  const resetToPristine = () => {
    setSearchQuery("");
    setSearchTerm("");
    setSearchFocused(false);
    setDropdownVisible(false);
    setShowUnavailable(false);
    setSortOption("인기순");
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
    sortOption === "인기순";

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
  const toggleFavorite = (id) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // -----------------------------------------------------------
  // 정렬 및 필터링 처리
  // -----------------------------------------------------------
  let filteredLessons = lessons.filter(
    (l) =>
      (category === "전체" || l.category === category) &&
      (showUnavailable || l.available) &&
      (searchTerm === "" || l.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (sortOption === "인기순") {
    filteredLessons.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
  } else if (sortOption === "최신순") {
    filteredLessons.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
  }

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
              {["인기순", "최신순", "리뷰 많은 순"].map((opt) => (
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
