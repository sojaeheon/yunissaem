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
import axios from "axios";
import CategoryMenu from "../screens/CategoryMenu";
import { BASE_URL, SERVER_BASE } from "../config/config";
import { useFocusEffect } from "@react-navigation/native";


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

      return item;
    });
  };

  const fetchAllHomeData = async () => {
      setLoadingPopular(true);
      setLoadingNew(true);
      setLoadingMyData(true);
      try {
        const res = await axios.get(`${BASE_URL}/home/`);
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

    return (
      <TouchableOpacity
        style={styles.lessonCard}
        onPress={() => navigation.navigate("LessonDetail", { lesson: item, lessonId: item.id ?? item.pk })}
      >
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.lessonThumbnail} />
        ) : (
          <View style={[styles.lessonThumbnail, { justifyContent: "center", alignItems: "center" }]}>
            <Text>이미지 없음</Text>
          </View>
        )}

        {/* 제목: 2줄 초과 시 말줄임(...) */}
        <Text style={styles.lessonTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.title ?? "제목 없음"}
        </Text>

        <Text style={styles.lessonTutor}>{item.tutor_name || item.tutor || "강사 정보 없음"}</Text>

        {/* 카테고리가 있을 때만 렌더 */}
       {item.category ? <Text style={styles.lessonCategory}>{item.category}</Text> : null}

        {/* 수강 인원 / 정원 표시 */}
        {capacityDisplay ? <Text style={styles.lessonCapacity}>{capacityDisplay}</Text> : null}

        <Text style={styles.lessonRating}>★ {item.rating ?? "-"}</Text>
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
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        // 각 section.data의 첫 (유일) 아이템은 실제 아이템 배열이므로,
        // renderItem에서 해당 배열을 꺼내 가로 FlatList로 렌더링
        renderItem={({ item, section }) => {
          const items = item ?? []; // item은 실제로 배열 (예: popularCourses)
          // 빈 섹션이면 안내 텍스트 표시
          if (!Array.isArray(items) || items.length === 0) {
            return (
              <View style={{ padding: 12 }}>
                <Text>{section.title}이(가) 없습니다.</Text>
              </View>
            );
          }
          return (
            <FlatList
              data={items}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
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
  container: { flex: 1, backgroundColor: "#ffffffff", paddingTop: 10 },

  // 변경: 섹션 타이틀 글씨 키움 (인기 강의, 진행 중인 강의 등)
  sectionTitle: {
    fontSize: 22,      // 기존 18 -> 22로 증가
    fontWeight: "700", // 기존 600 -> 700으로 강조
    marginLeft: 20,
   
    marginVertical: 12,
  },

  lessonCard: {
    width: 170,
    minHeight: 240,
    backgroundColor: "#f8f8f8ff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 30,
    marginRight: 10,           // 오른쪽 간격으로 통일 (FlatList의 contentContainerStyle에서 좌우 패딩 관리)
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  lessonThumbnail: {
    width: "100%",            // 카드 내부 너비에 맞춰 꽉 채우기 -> 좌우 여백이 일정해짐
    height: 110,             // 높이 조정 (필요 시 더 늘릴 수 있음)
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: "#ddd",
  },
  lessonTitle: { fontSize: 16, fontWeight: "bold", alignSelf: "flex-start" },
  lessonTutor: {
    fontSize: 13,
    color: "#333",
    marginBottom: 0,
    alignSelf: "flex-start",
  },
  lessonCategory: { fontSize: 14, color: "#555" },
  lessonCapacity: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    alignSelf: "flex-start",
  },
  lessonRating: {
    fontSize: 13,
    color: "#f5a623",
    marginTop: 4,
    alignSelf: "flex-start",
  },
});