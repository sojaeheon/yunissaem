// 카테고리별 과외 목록 화면
// - 카테고리별 과외 카드 리스트 표시
// - 검색, 정렬, 찜(좋아요), 토글 필터, Toast 알림 기능 구현
// - 뒤로가기(헤더/하드웨어) 1회: 화면 초기화 → 2회: 이전 화면

import React, { useState, useLayoutEffect, useRef } from "react";
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
  BackHandler,            // ✅ 하드웨어 뒤로가기용
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const dummyLessons = [
  // 🎵 음악
  {
    id: "music-1",
    title: "피아노 기초",
    category: "음악",
    tutor: "김선생",
    enrolled: 8,
    capacity: 12,
    description: "피아노를 처음 배우는 분들을 위한 기초 수업입니다.",
    thumbnail: "https://picsum.photos/seed/piano1/200/200",
    available: true,
  },
  {
    id: "music-2",
    title: "기타 중급",
    category: "음악",
    tutor: "이선생",
    enrolled: 5,
    capacity: 10,
    description: "코드 진행과 간단한 연주를 배우는 기타 중급 과정입니다.",
    thumbnail: "https://picsum.photos/seed/guitar/200/200",
    available: true,
  },
  {
    id: "music-3",
    title: "보컬 트레이닝",
    category: "음악",
    tutor: "박보컬",
    enrolled: 12,
    capacity: 15,
    description: "호흡, 발성, 감정 표현까지 배우는 보컬 레슨입니다.",
    thumbnail: "https://picsum.photos/seed/vocal/200/200",
    available: false,
  },

  // 🏋 운동
  {
    id: "fitness-1",
    title: "헬스 PT",
    category: "운동",
    tutor: "박트레이너",
    enrolled: 5,
    capacity: 5,
    description: "개인 맞춤형 트레이닝으로 건강한 몸을 만듭니다.",
    thumbnail: "https://picsum.photos/seed/fitness/200/200",
    available: false,
  },
  {
    id: "fitness-2",
    title: "요가 클래스",
    category: "운동",
    tutor: "최요가",
    enrolled: 14,
    capacity: 20,
    description: "마음을 다스리고 몸의 균형을 잡는 요가 수업입니다.",
    thumbnail: "https://picsum.photos/seed/yoga/200/200",
    available: true,
  },
  {
    id: "fitness-3",
    title: "필라테스",
    category: "운동",
    tutor: "정필라",
    enrolled: 9,
    capacity: 12,
    description: "코어 근육 강화와 자세 교정을 돕는 필라테스 수업입니다.",
    thumbnail: "https://picsum.photos/seed/pilates/200/200",
    available: true,
  },

  // 💰 금융
  {
    id: "finance-1",
    title: "주식 투자",
    category: "금융",
    tutor: "이애널리스트",
    enrolled: 20,
    capacity: 30,
    description: "주식 초보를 위한 기본 개념부터 투자 전략까지.",
    thumbnail: "https://picsum.photos/seed/stock/200/200",
    available: true,
  },
  {
    id: "finance-2",
    title: "부동산 기초",
    category: "금융",
    tutor: "홍중개",
    enrolled: 10,
    capacity: 20,
    description: "부동산 시장의 기초 지식과 투자 전략을 알려드립니다.",
    thumbnail: "https://picsum.photos/seed/estate/200/200",
    available: true,
  },
  {
    id: "finance-3",
    title: "가계부 작성법",
    category: "금융",
    tutor: "최가계",
    enrolled: 25,
    capacity: 30,
    description: "지출을 효율적으로 관리하는 가계부 작성 실습.",
    thumbnail: "https://picsum.photos/seed/budget/200/200",
    available: false,
  },

  // 💻 프로그래밍
  {
    id: "programming-1",
    title: "React Native 입문",
    category: "프로그래밍",
    tutor: "김개발",
    enrolled: 18,
    capacity: 25,
    description: "모바일 앱 개발을 위한 React Native 기초 과정.",
    thumbnail: "https://picsum.photos/seed/react/200/200",
    available: true,
  },
  {
    id: "programming-2",
    title: "파이썬 기초",
    category: "프로그래밍",
    tutor: "이파이",
    enrolled: 22,
    capacity: 30,
    description: "프로그래밍 입문자를 위한 파이썬 문법과 실습.",
    thumbnail: "https://picsum.photos/seed/python/200/200",
    available: true,
  },
  {
    id: "programming-3",
    title: "웹 개발 풀스택",
    category: "프로그래밍",
    tutor: "정풀스택",
    enrolled: 15,
    capacity: 20,
    description: "프론트엔드와 백엔드를 모두 배우는 풀스택 과정.",
    thumbnail: "https://picsum.photos/seed/fullstack/200/200",
    available: false,
  },

  // 🌍 외국어
  {
    id: "language-1",
    title: "영어 회화",
    category: "외국어",
    tutor: "존샘",
    enrolled: 30,
    capacity: 40,
    description: "실생활에서 바로 쓸 수 있는 영어 회화 배우기.",
    thumbnail: "https://picsum.photos/seed/english/200/200",
    available: true,
  },
  {
    id: "language-2",
    title: "일본어 초급",
    category: "외국어",
    tutor: "사토선생",
    enrolled: 12,
    capacity: 20,
    description: "히라가나부터 기초 회화까지 배우는 일본어 수업.",
    thumbnail: "https://picsum.photos/seed/japanese/200/200",
    available: true,
  },
  {
    id: "language-3",
    title: "중국어 기초",
    category: "외국어",
    tutor: "리선생",
    enrolled: 18,
    capacity: 25,
    description: "발음과 기본 회화를 중심으로 한 중국어 입문 수업.",
    thumbnail: "https://picsum.photos/seed/chinese/200/200",
    available: false,
  },
];

export default function CategoryLessonScreen({ navigation, route }) {
  const { category } = route.params || { category: "전체" };
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [sortOption, setSortOption] = useState("인기순");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const firstRenderRef = useRef(true);

  const keyboardVisibleRef = useRef(false);
  const keyboardHeightRef = useRef(0);
  const lastToastRef = useRef(null);

  // ✅ “맨 처음 상태”로 되돌리는 함수
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

  // ✅ 현재 상태가 “맨 처음 상태”인지 판별
  const isPristine = () =>
    searchQuery === "" &&
    searchTerm === "" &&
    !searchFocused &&
    !dropdownVisible &&
    showUnavailable === false &&
    sortOption === "인기순";

  // 🔔 Toast (키보드 따라 위치 조정)
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
        // ⛔ 여기서 null로 초기화하지 않음 (키보드 이동용 정보 유지)
        // 단, 일정 시간 후 완전 초기화 (재등장 방지)
        setTimeout(() => {
          lastToastRef.current = null;
        }, 2700);
      },
    };

    Toast.hide();
    requestAnimationFrame(() => {
      Toast.show(config);
      lastToastRef.current = config; // ✅ 위치 업데이트용 정보 저장
    });
  };

  // 페이지 들어올 때마다 (단, 첫 진입일 때만 검색 초기화)
  useFocusEffect(
    React.useCallback(() => {
      if (firstRenderRef.current) {
        setSearchQuery("");
        setSearchTerm("");
        setSearchFocused(false);
        firstRenderRef.current = false; // ✅ 이후에는 초기화 안 함
      }

      // 포커스 해제 시점에 다시 true로 만들 필요 없음
      // (다시 이 화면이 완전히 unmount될 때 초기화)
    }, [])
  );

  // ✅ 화면이 완전히 떠날 때 다시 초기화
  React.useEffect(() => {
    const cleanup = navigation.addListener("beforeRemove", () => {
      firstRenderRef.current = true; // 완전히 나갈 때 true로 복귀
    });

    return cleanup;
  }, [navigation]);

  // ⌨️ 키보드 이벤트 (Toast 위치용)
  React.useEffect(() => {
    const onShow = (e) => {
      keyboardVisibleRef.current = true;
      keyboardHeightRef.current = e?.endCoordinates?.height ?? 0;

      // 🔁 토스트가 떠 있으면 다시 띄우기
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


  // ✅ 헤더 뒤로가기 가로채기 (초기화 1회 → 뒤로가기)
  React.useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      // 항상 떠있는 토스트는 닫기
      Toast.hide();
      lastToastRef.current = null;

      // 초기 상태가 아니라면: 네비게이션 막고 화면만 초기화
      if (!isPristine()) {
        e.preventDefault();
        resetToPristine();
        return;
      }

      // 초기 상태면: 그냥 나감 (Toast 이미 닫힘)
    });

    return unsub;
  }, [
    navigation,
    searchQuery,
    searchTerm,
    searchFocused,
    dropdownVisible,
    showUnavailable,
    sortOption,
  ]);


    // ✅ 안드로이드 하드웨어 뒤로가기 (동일한 정책)
    useFocusEffect(
      React.useCallback(() => {
        const onBack = () => {
          if (!isPristine()) {
            resetToPristine();
            return true; // 뒤로가기 소비(이전 화면으로 안 나감)
          }
          return false; // 기본 동작(이전 화면)
        };

        const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
        return () => sub.remove();
      }, [
        searchQuery,
        searchTerm,
        searchFocused,
        dropdownVisible,
        showUnavailable,
        sortOption,
      ])
    );

  // 네비게이션 헤더 타이틀
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${category} 과외 목록`,
    });
  }, [navigation, category]);

  // 추천 검색 데이터 (실시간)
  const suggestions =
    searchQuery.length > 0
      ? dummyLessons.filter(
          (l) =>
            (category === "전체" || l.category === category) &&
            l.title.includes(searchQuery)
        )
      : [];

  // 찜 토글
  const toggleFavorite = (id) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // 리스트 데이터
  let filteredLessons = dummyLessons.filter(
    (l) =>
      (category === "전체" || l.category === category) &&
      (showUnavailable || l.available) &&
      (searchTerm === "" || l.title.includes(searchTerm))
  );

  if (sortOption === "최신순") {
    filteredLessons = [...filteredLessons].reverse();
  } else if (sortOption === "리뷰 많은 순") {
    filteredLessons = [...filteredLessons];
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* 검색바 */}
      <View style={styles.searchWrapper}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchBar}
          placeholder="과외 검색하기"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => {
            setSearchFocused(true);
            Toast.hide(); // 포커스 시 이전 토스트 강제 종료
          }}
          onBlur={() => {
            setSearchFocused(false);
            setSearchTerm(searchQuery); // focus 해제 시 검색 확정
          }}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            setSearchTerm(searchQuery); // 완료 버튼 시 검색 확정
          }}
        />

        {/* 오른쪽 아이콘 (돋보기 / X) */}
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

        {/* 추천 검색 박스 */}
        {searchFocused && suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {suggestions.slice(0, 10).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.suggestionItem,
                  !item.available && styles.suggestionDisabled,
                ]}
                onPress={() => {
                  // 리스트 아이템 '직접 터치'했을 때만 토스트/확정
                  if (!item.available) {
                    showSmartToast({
                      type: "error",
                      text1: "이 강의는 현재 마감되었습니다.",
                    });

                    // ✅ 토스트를 표시하고 나면 즉시 ref 초기화 (자동 반복 방지)
                    setTimeout(() => {
                      lastToastRef.current = null;
                    }, 2500); // 토스트 표시 시간(visibilityTime)과 동일

                    return;
                  }
                  setSearchQuery(item.title);
                  setSearchTerm(item.title);
                  setSearchFocused(false);
                  Keyboard.dismiss();
                }}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    !item.available && styles.suggestionTextDisabled,
                  ]}
                >
                  {item.title}
                  {!item.available && " (마감)"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 옵션 영역 */}
      <View style={styles.optionRow}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>신청 불가 항목 보기</Text>
          <Switch value={showUnavailable} onValueChange={setShowUnavailable} />
        </View>

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
      {filteredLessons.length === 0 ? (
        <Pressable
          style={styles.noResultBox}
          onPress={() => {
            Toast.hide();
            const input = searchInputRef.current;
            if (!input) return;
            input.blur();
            requestAnimationFrame(() => input.focus());
          }}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.noResultText}>검색 결과가 없습니다 😢</Text>
        </Pressable>
      ) : (
        <FlatList
          data={filteredLessons}
          keyExtractor={(item) => item.id}
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
                {/* 카드 본체 (마감 시 전체 반투명 처리) */}
                <View
                  style={[styles.cardInner, !item.available && styles.cardUnavailable]}
                >
                  <Image
                    source={{ uri: item.thumbnail }}
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
                      </View>

                      {/* 마감이 아닐 때만 찜 버튼 노출 */}
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

                {/* 신청 불가 라벨 (밝기 유지) */}
                {!item.available && (
                  <Text style={styles.unavailableTag}>신청 불가</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  searchWrapper: { position: "relative", marginBottom: 12 },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 32,
  },
  iconBtn: { position: "absolute", right: 8, top: "50%", transform: [{ translateY: -10 }] },

  suggestionBox: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    zIndex: 20,
    elevation: 3,
  },
  suggestionItem: { paddingVertical: 8, paddingHorizontal: 12 },
  suggestionText: { fontSize: 14, color: "#333" },
  suggestionDisabled: { backgroundColor: "#f5f5f5" },
  suggestionTextDisabled: { color: "#aaa", fontStyle: "italic" },

  noResultBox: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noResultText: { fontSize: 15, color: "#777" },

  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
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
  cardInner: { flexDirection: "row", alignItems: "center", padding: 8, minHeight: 110 },
  cardUnavailable: { opacity: 0.4 },
  thumbnail: { width: 90, height: 90, borderRadius: 8, marginRight: 12 },

  cardContent: { flex: 1, justifyContent: "space-between" },
  lessonTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  description: { fontSize: 13, color: "#555", marginBottom: 8, lineHeight: 18 },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
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