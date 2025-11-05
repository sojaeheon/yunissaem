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
    SectionList, // 추가
} from "react-native";
import axios from "axios";
import CategoryMenu from "../screens/CategoryMenu";
import { BASE_URL, SERVER_BASE } from "../config/config";  // import 추가

/*
  HomeScreen 전체 설명 (요약)
  - 인기 강의(/courses/popular/), 최신 강의(/courses/new/)를 각각 호출해
    가로 스크롤 FlatList로 렌더링합니다.
  - 추가로 accounts/data/ 엔드포인트를 호출해 '내 찜 목록'과 '내 수강 목록'을 가져옵니다.
    - 현재 백엔드가 개발용으로 id=1 더미 유저를 직접 조회하는 구조면 클라이언트는
      토큰 없이 호출해도 응답을 받습니다.
    - 운영 환경에서는 토큰(또는 세션 쿠키)을 사용해 서버가 request.user를 식별해야 합니다.
      아래 코드에서는 "토큰이 있으면 Authorization 헤더에 추가, 없으면 헤더 없이 요청" 방식으로 안전하게 처리합니다.
  - normalizeResponse: DRF의 페이징(results) 또는 단순 배열 응답 모두 처리, 썸네일이
    상대경로('/media/...')로 올 경우 SERVER_BASE를 붙여 절대 URL로 보정합니다.
  - 주의: BASE_URL/SERVER_BASE는 개발 환경용 하드코딩입니다. 배포 전에는 환경변수로 분리하세요.
*/

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

  // ---------------------------
  // 인기 강의 호출
  // ---------------------------
  useEffect(() => {
    const fetchPopular = async () => {
      setLoadingPopular(true);
      try {
        const res = await axios.get(`${BASE_URL}/courses/popular/`);
        // normalizeResponse로 DRF 페이징/배열 모두 처리
        setPopularCourses(normalizeResponse(res.data));
      } catch (err) {
        // 개발 중엔 콘솔로 에러 확인하고 사용자에게 간단히 알림
        console.error("fetchPopular error:", err);
        Alert.alert("인기 강의 로드 실패", "서버에 연결할 수 없습니다.");
      } finally {
        setLoadingPopular(false);
      }
    };
    fetchPopular();
  }, []);

  // ---------------------------
  // 최신 강의 호출
  // ---------------------------
  useEffect(() => {
    const fetchNew = async () => {
      setLoadingNew(true);
      try {
        const res = await axios.get(`${BASE_URL}/courses/new/`);
        setNewCourses(normalizeResponse(res.data));
      } catch (err) {
        console.error("fetchNew error:", err);
        Alert.alert("최신 강의 로드 실패", "서버에 연결할 수 없습니다.");
      } finally {
        setLoadingNew(false);
      }
    };
    fetchNew();
  }, []);

  // ---------------------------------------
  // 내 찜/수강 데이터 호출 (accounts/data/)
  // - 현재 백엔드가 개발용으로 id=1 더미를 조회하면 토큰 없이도 응답을 줍니다.
  // - 운영 환경에서는 로그인 후 저장한 토큰을 Authorization 헤더로 전송해야 합니다.
  // - 이 코드: "토큰이 있으면 헤더 추가, 없으면 헤더 없이 요청" 형태로 유연하게 처리합니다.
  // ---------------------------------------
  useEffect(() => {
    const fetchMyData = async () => {
      setLoadingMyData(true);
      try {
        // 토큰 없이 호출: 토큰 전송 제거
        const res = await axios.get(`${BASE_URL}/my/data/`);

        // 안전하게 응답을 정규화해서 상태에 반영
        setWishlist(normalizeResponse(res.data?.my_wishlist ?? []));
        setAttending(normalizeResponse(res.data?.my_attending_courses ?? []));
      } catch (err) {
        console.error("fetchMyData error:", err);
      } finally {
        setLoadingMyData(false);
      }
    };
    fetchMyData();
  }, []);

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
        onPress={() => navigation.navigate("LessonDetail", { course: item, courseId: item.id ?? item.pk })}
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