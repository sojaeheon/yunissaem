import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/axiosInstance";
import { BASE_URL, SERVER_BASE } from "../config/config";
import CategoryMenu from "../screens/CategoryMenu";

const SORT_OPTIONS = [
  { label: "최신순", query: "" },
  { label: "인기순", query: "popular" },
  { label: "리뷰 많은 순", query: "review" },
];

export default function CategoryLessonScreen({ navigation, route }) {
  const { category = "전체", categoryId } = route.params || {};
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState([]);

  const [showUnavailable, setShowUnavailable] = useState(false);
  const [sortOption, setSortOption] = useState("최신순");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  const resetToPristine = () => {
    setSearchQuery("");
    setSearchTerm("");
    setSearchFocused(false);
    setDropdownVisible(false);
    setShowUnavailable(false);
    setSortOption("최신순");
    Keyboard.dismiss();
  };

  const isPristine = () =>
    searchQuery === "" &&
    searchTerm === "" &&
    !searchFocused &&
    !dropdownVisible &&
    !showUnavailable &&
    sortOption === "최신순";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${category} 과외`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            setDropdownVisible(false);
            setMenuVisible(true);
          }}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, category]);

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const selectedSort = SORT_OPTIONS.find((it) => it.label === sortOption);
        const query = selectedSort?.query ? `?sort=${selectedSort.query}` : "";
        const endpoint = `${BASE_URL}/courses/category/${categoryId}/${query}`;
        const res = await api.get(endpoint);
        const data = res?.data?.courses ?? [];

        const normalized = data.map((item) => {
          const enrolled = item.current_tutees_count ?? item.enrolled_count ?? item.view_count ?? 0;
          const capacity = item.max_tutees ?? item.capacity ?? 0;
          const thumbnailRaw = item.thumbnail_image_url ?? item.thumbnail ?? null;
          const thumbnail =
            typeof thumbnailRaw === "string" && thumbnailRaw.startsWith("/")
              ? `${SERVER_BASE}${thumbnailRaw}`
              : thumbnailRaw;

          return {
            id: item.id,
            title: item.title ?? "제목 없음",
            description: item.introduction || item.description || "소개가 없습니다.",
            tutor: item.tutor_name || item.tutor || "강사 정보 없음",
            thumbnail,
            enrolled,
            capacity,
            rating: item.average_rating ?? item.rating ?? "-",
            available: enrolled < capacity,
            category: item.category_name || category || "전체",
          };
        });

        setLessons(normalized);
      } catch (err) {
        console.error("fetchLessons error:", err);
        Alert.alert("오류", "강의 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId !== undefined && categoryId !== null) {
      fetchLessons();
    }
  }, [categoryId, category, sortOption]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!isPristine()) {
        e.preventDefault();
        resetToPristine();
      }
    });
    return unsub;
  }, [navigation, searchQuery, searchTerm, searchFocused, dropdownVisible, showUnavailable, sortOption]);

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

  const toggleFavorite = async (id) => {
    try {
      const res = await api.post(`/courses/${id}/wish/`);
      const isLiked = !!res?.data?.is_wished;
      setFavoriteIds((prev) => (isLiked ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));
      Alert.alert("알림", res?.data?.message || (isLiked ? "찜 목록에 추가되었습니다." : "찜이 해제되었습니다."));
    } catch (err) {
      console.error("toggleFavorite error:", err?.response?.data || err);
      Alert.alert("오류", "찜 처리 중 문제가 발생했습니다.");
    }
  };

  const filteredLessons = useMemo(() => {
    const filtered = lessons.filter((item) => {
      const inCategory = category === "전체" || item.category === category;
      const availableMatch = showUnavailable || item.available;
      const keyword = searchTerm.trim().toLowerCase();
      const searchMatch = keyword === "" || (item.title || "").toLowerCase().includes(keyword);
      return inCategory && availableMatch && searchMatch;
    });

    const deduped = new Map();
    filtered.forEach((item) => {
      // 백엔드에서 동일 강의가 다른 id로 중복 전달되는 경우를 대비해
      // 내용 기반 시그니처로 중복 제거한다.
      const key = [
        (item.title || "").trim().toLowerCase(),
        (item.tutor || "").trim().toLowerCase(),
        (item.description || "").trim().toLowerCase(),
        String(item.capacity ?? ""),
        (item.thumbnail || "").trim().toLowerCase(),
      ].join("::");

      if (!deduped.has(key)) deduped.set(key, item);
    });
    return Array.from(deduped.values());
  }, [lessons, category, showUnavailable, searchTerm]);

  const renderCard = ({ item }) => {
    const liked = favoriteIds.includes(item.id);
    const ratingText = item.rating === "-" ? "-" : Number(item.rating).toFixed(1);
    const thumbSize = isCompact ? 82 : 96;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => !dropdownVisible && navigation.navigate("LessonDetail", { lesson: item })}
      >
        <View style={[styles.cardInner, !item.available && styles.cardUnavailable]}>
          <Image
            source={{
              uri:
                item.thumbnail ||
                "https://dummyimage.com/120x120/cccccc/000000&text=No+Image",
            }}
            style={[styles.thumbnail, { width: thumbSize, height: thumbSize }]}
          />

          <View style={styles.cardContent}>
            <Text style={styles.lessonTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.lessonTutor} numberOfLines={1}>
              {item.tutor}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="people-outline" size={13} color="#4b5563" />
                <Text style={styles.metaText}>
                  {item.enrolled}/{item.capacity}
                </Text>
              </View>

              <View style={[styles.metaPill, styles.ratingPill]}>
                <Ionicons name="star" size={13} color="#b45309" />
                <Text style={[styles.metaText, styles.ratingText]}>{ratingText}</Text>
              </View>
            </View>
          </View>

          {item.available ? (
            <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.heartButton}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? "#ef4444" : "#94a3b8"}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>모집 마감</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={searchFocused ? "" : "과외 검색하기"}
          placeholderTextColor="#7b8798"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => {
            setSearchFocused(false);
            setSearchTerm(searchQuery);
          }}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            setSearchTerm(searchQuery);
          }}
          returnKeyType="search"
        />
        {searchQuery !== "" && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery("");
              setSearchTerm("");
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
          >
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.switchWrap}>
          <Text style={styles.switchLabel}>마감 강의 포함</Text>
          <Switch value={showUnavailable} onValueChange={setShowUnavailable} />
        </View>

        <View style={styles.dropdownWrap}>
          <TouchableOpacity
            style={[styles.dropdownButton, isCompact && styles.dropdownButtonCompact]}
            onPress={() => setDropdownVisible((v) => !v)}
          >
            <Text style={styles.dropdownText}>{sortOption}</Text>
            <Ionicons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={16} color="#334155" />
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownMenu}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSortOption(option.label);
                    setDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      sortOption === option.label && styles.dropdownItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>강의를 불러오는 중...</Text>
        </View>
      ) : filteredLessons.length === 0 ? (
        <Pressable style={styles.emptyBox} onPress={() => searchInputRef.current?.focus()}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
        </Pressable>
      ) : (
        <FlatList
          data={filteredLessons}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={renderCard}
        />
      )}

      <CategoryMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8fc",
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  searchWrapper: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0ec",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 6,
  },
  filterPanel: {
    zIndex: 1,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
    flexWrap: "wrap",
  },
  switchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2f7",
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 13,
    color: "#334155",
    marginRight: 4,
    fontWeight: "600",
  },
  dropdownWrap: {
    position: "relative",
    zIndex: 2,
    elevation: 2,
  },
  dropdownButton: {
    minWidth: 108,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0ec",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  dropdownButtonCompact: {
    minWidth: 96,
  },
  dropdownText: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: 38,
    right: 0,
    width: 132,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0ec",
    paddingVertical: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    zIndex: 20,
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#334155",
  },
  dropdownItemTextActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 0,
  },
  card: {
    marginBottom: 8,
    paddingTop: 2,
  },
  cardInner: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    minHeight: 126,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardUnavailable: {
    opacity: 0.5,
  },
  thumbnail: {
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
    minHeight: 96,
    justifyContent: "space-between",
    paddingRight: 34,
  },
  lessonTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    flexShrink: 1,
  },
  lessonTutor: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
    flexShrink: 1,
  },
  description: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    flexShrink: 1,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#eef2f7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ratingPill: {
    backgroundColor: "#fef3c7",
  },
  metaText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  ratingText: {
    color: "#92400e",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  unavailableBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  unavailableText: {
    fontSize: 11,
    color: "#991b1b",
    fontWeight: "700",
  },
});
