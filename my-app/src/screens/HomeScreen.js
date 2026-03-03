/*
  HomeScreen 전체 설명 (요약)
  - 하나의 엔드포인트(/home/)를 호출해 인기 강의(popular_courses), 최신 강의(new_courses),
    찜한 강의(my_wishlist), 진행 중인 강의(my_attending_courses)를 한 번에 가져옵니다.

  - 서버 응답은 각 목록을 키별 배열 형태로 반환하며, normalizeResponse 함수를 통해
    DRF의 페이징(results) 여부나 상대경로 썸네일(/media/...) 등을 일관된 구조로 변환합니다.

  - 현재는 백엔드에서 ID=1 유저를 임시 로그인 상태로 가정하므로 토큰 없이 호출 가능합니다.
    추후 실제 로그인 기능이 구현되면 Authorization 헤더에 토큰을 추가해야 합니다.

  - 각 강의 섹션(인기, 최신, 찜, 진행중)은 SectionList를 이용해 구분 표시하며,
    내부에서는 FlatList를 사용해 가로 스크롤 형태로 렌더링됩니다.
    
  - 주의: BASE_URL/SERVER_BASE는 개발 환경용 상수이며, 배포 시에는 환경 변수로 분리해야 합니다.
*/

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/axiosInstance";
import CategoryMenu from "../screens/CategoryMenu";
import { BASE_URL, SERVER_BASE } from "../config/config";
import { useFocusEffect } from "@react-navigation/native";

const CATEGORY_COLORS = {
  음악: { bg: "#ffe3e3", text: "#9f1239", border: "#fecdd3" },
  운동: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  예술: { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  프로그래밍: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  "금융/재테크": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  외국어: { bg: "#fde68a", text: "#854d0e", border: "#facc15" },
  기타: { bg: "#e2e8f0", text: "#334155", border: "#cbd5e1" },
};

const SECTION_COLORS = {
  "인기 강의": { accent: "#f97316", countBg: "#ffedd5", countText: "#9a3412" },
  "최신 강의": { accent: "#0ea5e9", countBg: "#e0f2fe", countText: "#0c4a6e" },
  "찜한 강의": { accent: "#ef4444", countBg: "#fee2e2", countText: "#991b1b" },
  "진행 중인 강의": { accent: "#22c55e", countBg: "#dcfce7", countText: "#166534" },
};

const SECTION_ICONS = {
  "인기 강의": "flame",
  "최신 강의": "sparkles",
  "찜한 강의": "heart",
  "진행 중인 강의": "play-circle",
};

export default function HomeScreen({ navigation, route }) {
  const [menuVisible, setMenuVisible] = useState(false);

  // 인기 / 최신 데이터와 로딩 상태
  const [popularCourses, setPopularCourses] = useState([]);
  const [newCourses, setNewCourses] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingNew, setLoadingNew] = useState(false);

  // 사용자 관련: 찜(wishlist), 수강(attending) 목록과 로딩 상태
  const [wishlist, setWishlist] = useState([]);
  const [attending, setAttending] = useState([]);
  const [loadingMyData, setLoadingMyData] = useState(false);

  // 라우트 파라미터로 카테고리 메뉴 오픈 요청을 처리 (openMenu)
  useEffect(() => {
    if (route?.params?.openMenu) {
      setMenuVisible(true);
      // 한 번 처리했으면 라우트 파라미터 초기화 -> 동일 값 재전송 시에도 트리거되게 함
      navigation.setParams({ openMenu: false });
    }
  }, [route?.params?.openMenu]);

  // ----------------------------------------------------
  // 응답 정규화 함수: 배열 | {results: [...]} 두가지 형태 모두 처리
  // - 모델 필드명과 API 직렬화 결과가 다를 수 있으므로 여러 키들을 매핑해서
  //   thumbnail, enrolled_count, capacity(max_tutees) 등을 보정합니다.
  // ----------------------------------------------------
  const normalizeResponse = (data) => {
    const payload = Array.isArray(data) ? data : (data?.results ?? data ?? []);
    if (!Array.isArray(payload)) return [];
    return payload.map(raw => {
      const item = { ...raw };

      // thumbnail 필드명 매핑: API가 thumbnail_image_url로 제공할 수 있음
      if (!item.thumbnail && item.thumbnail_image_url) item.thumbnail = item.thumbnail_image_url;

      // 썸네일이 상대경로로 오면 서버 베이스 붙이기 (예: '/media/..')
      if (item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('/')) {
        item.thumbnail = SERVER_BASE + item.thumbnail;
      }

      // 수강 인원(enrolled) 계산: 모델의 current_tutees_count 또는 여러 후보 필드 지원
      const enrolled =
        item.current_tutees_count ??
        item.enrolled_count ??
        item.enrolled ??
        item.num_students ??
        (Array.isArray(item.tutees) ? item.tutees.length : undefined) ??
        (Array.isArray(item.attendees) ? item.attendees.length : undefined) ??
        null;

      // 정원(capacity) 매핑: 모델 필드명 max_tutees 우선
      const capacity = item.max_tutees ?? item.capacity ?? item.max_capacity ?? null;

      // 일관된 키로 넣어두면 render에서 안전하게 사용 가능
      item.enrolled_count = enrolled;
      item.capacity = capacity;
      item.rating = item.average_rating ?? item.rating ?? null;
      item.category = item.category_name ?? item.category ?? null;

      return item;
    });
  };

  const fetchAllHomeData = async () => {
      setLoadingPopular(true);
      setLoadingNew(true);
      setLoadingMyData(true);
      try {
        const res = await api.get(`${BASE_URL}/home/`);
        const data = res.data;

        setPopularCourses(normalizeResponse(data.popular_courses));
        setNewCourses(normalizeResponse(data.new_courses));
        setWishlist(normalizeResponse(data.my_wishlist));
        setAttending(normalizeResponse(data.my_attending_courses));
      } catch (err) {
        console.error("fetchAllHomeData error:", err);
        Alert.alert("홈 데이터 로드 실패", "서버에 연결할 수 없습니다.");
      } finally {
        setLoadingPopular(false);
        setLoadingNew(false);
        setLoadingMyData(false);
      }
    };

  // 첫 화면 로드 및 데이터 호출 함수
  useEffect(() => {
    fetchAllHomeData();
  }, []);

  
  // 그 후 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      fetchAllHomeData();
    }, [])
  );

  // ----------------------------------------------------
  // 렌더러: 강의 카드 UI를 재사용 (수강 인원 / 정원 표시 추가)
  // ----------------------------------------------------
  const renderLessonCard = ({ item }) => {
    const enrolledNum = item.enrolled_count;
    const capacityNum = item.capacity;

    // 표시 문자열 결정: 둘 다 있으면 "현재 / 정원" 형태로, 하나만 있으면 해당 정보만 표시
    let capacityDisplay = null;
    if (enrolledNum != null && capacityNum != null) {
      capacityDisplay = `수강 인원: ${enrolledNum} / ${capacityNum}`;
    } else if (enrolledNum != null) {
      capacityDisplay = `수강 인원: ${enrolledNum}`;
    } else if (capacityNum != null) {
      capacityDisplay = `정원: ${capacityNum}`;
    }

    const categoryTheme = CATEGORY_COLORS[item.category] ?? {
      bg: "#e2e8f0",
      text: "#334155",
      border: "#cbd5e1",
    };

    return (
      <TouchableOpacity
        style={styles.lessonCard}
        onPress={() => navigation.navigate("LessonDetail", { lesson: item, lessonId: item.id ?? item.pk })}
        activeOpacity={0.9}
      >
        {item.category ? (
          <View
            style={[
              styles.categoryBadgeCard,
              {
                backgroundColor: categoryTheme.bg,
                borderColor: categoryTheme.border,
              },
            ]}
          >
            <Text style={[styles.categoryBadgeText, { color: categoryTheme.text }]} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
        ) : null}

        <View style={styles.lessonThumbnailWrap}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.lessonThumbnail} />
          ) : (
            <View style={[styles.lessonThumbnail, styles.thumbnailFallback]}>
              <Ionicons name="image-outline" size={26} color="#75808f" />
              <Text style={styles.thumbnailFallbackText}>이미지 없음</Text>
            </View>
          )}
        </View>

        {/* 제목: 2줄 초과 시 말줄임(...) */}
        <Text style={styles.lessonTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.title ?? "제목 없음"}
        </Text>

        <Text style={styles.lessonTutor}>{item.tutor_name || item.tutor || "강사 정보 없음"}</Text>

        <View style={styles.metaRow}>
          {/* 수강 인원 / 정원 표시 */}
          {capacityDisplay ? <Text style={styles.lessonCapacity}>{capacityDisplay}</Text> : null}
          <Text style={styles.lessonRating}>★ {item.rating ?? "-"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 섹션 배열 생성: SectionList에서는 각 section.data가 배열이어야 함.
// 여기서는 section.data를 한 개 원소(배열: 실제 아이템 배열)로 넣어
  const sections = [
    { title: "인기 강의", data: [popularCourses] },
    { title: "최신 강의", data: [newCourses] },
    { title: "찜한 강의", data: [wishlist] },
    { title: "진행 중인 강의", data: [attending] },
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => String(index)}
        // section.header 렌더: 타이틀
        renderSectionHeader={({ section }) => {
          const items = section.data?.[0] ?? [];
          const sectionTheme = SECTION_COLORS[section.title] ?? {
            accent: "#2563eb",
            countBg: "#e8edf8",
            countText: "#334155",
          };
          const sectionIcon = SECTION_ICONS[section.title] ?? "albums";
          return (
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWrap}>
                <View style={[styles.sectionAccent, { backgroundColor: sectionTheme.accent }]} />
                <View style={[styles.sectionIconBubble, { backgroundColor: sectionTheme.countBg }]}>
                  <Ionicons name={sectionIcon} size={14} color={sectionTheme.accent} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text
                style={[
                  styles.sectionCount,
                  { backgroundColor: sectionTheme.countBg, color: sectionTheme.countText },
                ]}
              >
                {Array.isArray(items) ? items.length : 0}
              </Text>
            </View>
          );
        }}
        // 각 section.data의 첫 (유일) 아이템은 실제 아이템 배열이므로,
        // renderItem에서 해당 배열을 꺼내 가로 FlatList로 렌더링
        renderItem={({ item, section }) => {
          const items = item ?? []; // item은 실제로 배열 (예: popularCourses)
          // 빈 섹션이면 안내 텍스트 표시
          if (!Array.isArray(items) || items.length === 0) {
            return (
              <View style={styles.emptyState}>
                <Ionicons name="albums-outline" size={18} color="#7f8b99" />
                <Text style={styles.emptyStateText}>{section.title}이(가) 없습니다.</Text>
              </View>
            );
          }
          return (
            <FlatList
              data={items}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              keyExtractor={(it, idx) => String(it.id ?? it.pk ?? `${section.title}-${idx}`)}
              renderItem={renderLessonCard}
            />
          );
        }}
        // 섹션 사이에 여백
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* 카테고리 메뉴 컴포넌트 (원래 기능 유지) */}
      <CategoryMenu
        visible={menuVisible}
        onClose={() => {
          // 메뉴 닫기 시 상태 및 라우트 파라미터 초기화
          setMenuVisible(false);
          navigation.setParams({ openMenu: false });
        }}
        navigation={navigation}
      />
    </View>
  );
}

/* 스타일: 기존 스타일 재사용 */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fc", paddingTop: 6 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: 3,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#121826",
    letterSpacing: -0.1,
  },
  sectionCount: {
    fontSize: 11,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    overflow: "hidden",
  },
  horizontalListContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  emptyState: {
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#e8edf6",
    flexDirection: "row",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#5f6978",
    fontSize: 13,
    marginLeft: 8,
  },

  lessonCard: {
    width: 178,
    minHeight: 228,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e9f2",
    padding: 10,
    marginBottom: 20,
    marginRight: 10,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    overflow: "visible",
  },
  lessonThumbnail: {
    width: "100%",
    height: 112,
    borderRadius: 10,
    backgroundColor: "#ddd",
  },
  thumbnailFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailFallbackText: {
    marginTop: 4,
    fontSize: 11,
    color: "#667287",
  },
  lessonThumbnailWrap: {
    width: "100%",
    height: 112,
    marginBottom: 8,
    position: "relative",
  },
  categoryBadgeCard: {
    position: "absolute",
    top: -6,
    left: -6,
    zIndex: 5,
    borderWidth: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "62%",
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  lessonTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    alignSelf: "flex-start",
    color: "#131722",
    marginBottom: 2,
  },
  lessonTutor: {
    fontSize: 13,
    color: "#566074",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  metaRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  lessonCapacity: {
    fontSize: 11,
    color: "#4c5568",
    backgroundColor: "#eef2f8",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
    maxWidth: "72%",
  },
  lessonRating: {
    fontSize: 11,
    color: "#b57000",
    backgroundColor: "#fff4d6",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
    fontWeight: "700",
  },
});
