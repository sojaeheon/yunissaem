/*
  LessonDetailScreen 전체 설명 (요약)
  - 단일 과외(course)의 상세 정보를 보여주는 화면입니다.

  - 진입 시 route.params로부터 lessonId 혹은 lesson 객체를 받아 courseId를 결정한 뒤
    /courses/{courseId}/ 엔드포인트를 호출해 최신 상세 정보를 서버에서 가져옵니다.

  - 응답 데이터에는 썸네일(thumbnail_image_url), 튜터 정보(tutor), 정원/현재 인원,
    상태(status: recruiting / in_progress / finished), 리뷰 목록(reviews),
    찜 여부(is_wished), 과외 소유자 여부(is_owner) 등이 포함됩니다.
    → 이 값을 local state(data, isWished)에 저장하고 화면 전체에서 사용합니다.

  - 상단 우측 하트 아이콘은 /courses/{id}/wish/ POST를 호출해 찜/찜 해제를 토글합니다.
    서버에서 is_wished와 message를 내려주면 isWished 상태를 갱신하고 Alert로 피드백을 보여줍니다.

  - 썸네일 바로 아래에는 "튜터 본인(data.is_owner)"만 볼 수 있는 관리용 플로팅 버튼 3개가 있습니다.
    · 수정: LessonCreateScreen으로 이동해 기존 데이터를 lessonData로 넘겨주는 edit 모드
    · 상태 토글: /courses/{id}/status/ PATCH로 recruiting ↔ in_progress 상태를 변경
    · 종료: 현재 수강 중인 튜티(current_tutees_count)가 0명일 때 finished 상태로 변경

  - 하단 버튼 영역에서는
    · 리뷰 작성: ReviewWriteScreen으로 이동 (현재는 과외 정보 없이 단순 이동)
    · 수강 신청: 아직 미구현이므로 Alert로 "준비 중" 안내만 표시
    · 채팅하기: ChatScreen으로 이동하며 lessonId(data.id)를 함께 전달합니다.

  - useLayoutEffect를 사용해 data.title이 로딩되면 네비게이션 헤더 제목을 과외 제목으로 동기화합니다.
*/

import { useLayoutEffect } from "react";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import api from "../utils/axiosInstance";
import { BASE_URL } from "../config/config";

export default function LessonDetailScreen({ navigation, route }) {
  // 🔹 Home / Category / Intro 등에서 넘어온 param
  // - lesson: 리스트에서 전달한 간단한 과외 정보 (id만 있을 수도 있음)
  // - lessonId: id만 단독으로 넘겨주는 경우를 대비한 값
  const { lesson, lessonId } = route.params || {};
  // 최종적으로 사용할 과외 ID (lessonId 우선, 없으면 lesson.id 사용)
  const courseId = lessonId ?? lesson?.id;

  // 🔹 백엔드에서 가져온 실제 과외 상세 데이터
  const [data, setData] = useState(null);
  // 로딩 스피너 제어용 상태
  const [loading, setLoading] = useState(true);
  // 찜 여부 (백엔드 응답의 is_wished와 동기화)
  const [isWished, setIsWished] = useState(false);

  // ===========================================================
  // 1. 과외 상세 조회
  // ===========================================================
  const fetchLessonDetail = async () => {
    try {
      // /courses/{id}/ 에 GET 요청 보내기
      const response = await api.get(`${BASE_URL}/courses/${courseId}/`);
      const detail = response.data;

      // 화면에서 사용할 전체 데이터 저장
      setData(detail);
      // 응답에 포함된 찜 여부를 별도 state로도 보관
      setIsWished(detail.is_wished);
    } catch (error) {
      console.error("❌ 과외 상세 조회 실패:", error);
      Alert.alert("오류", "과외 정보를 불러오지 못했습니다.");
    } finally {
      // 요청 성공/실패와 관계없이 로딩 스피너는 종료
      setLoading(false);
    }
  };

  // ===========================================================
  // 2. 찜/찜해제 토글
  // ===========================================================
  const toggleWish = async () => {
    try {
      // /courses/{id}/wish/ 엔드포인트에 POST로 토글 요청
      const res = await api.post(`${BASE_URL}/courses/${courseId}/wish/`);
      // 서버에서 내려준 최신 is_wished 값을 그대로 반영
      setIsWished(res.data.is_wished);
      // 사용자에게 결과 메시지 보여주기
      Alert.alert("알림", res.data.message);
    } catch (error) {
      console.error("❌ 찜 토글 실패:", error.response?.data || error);
      Alert.alert("오류", "찜 기능 실행 중 문제가 발생했습니다.");
    }
  };

  // ===========================================================
  // 3. 상태 토글 (recruiting ↔ in_progress)
  //    * 아래 toggleStatus 함수는 현재 사용하지 않지만,
  //      재사용 가능한 유틸 함수 형태로 남겨둠.
  // ===========================================================
  const toggleStatus = async () => {
    if (!data) return;

    // 현재 상태에 따라 다음 상태 결정
    const nextStatus = data.status === "recruiting" ? "in_progress" : "recruiting";

    try {
      const res = await api.patch(`${BASE_URL}/courses/${courseId}/status/`, {
        status: nextStatus,
      });

      Alert.alert("상태 변경", res.data.message || "상태가 변경되었습니다.");
      // 응답에서 내려준 status를 화면 state에 반영
      setData({ ...data, status: res.data.status ?? nextStatus });
    } catch (error) {
      console.error("❌ 상태 변경 실패:", error.response?.data || error);
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    }
  };

  // ===========================================================
  // 4. 종료하기 (finished)
  //    * 현재 코드에서는 썸네일 하단 버튼 onPress에서 직접 호출하지 않고,
  //      인라인으로 PATCH를 하고 있어 참고용으로 남겨둠.
  // ===========================================================
  const endCourse = async () => {
    if (!data) return;

    try {
      const res = await api.patch(`${BASE_URL}/courses/${courseId}/status/`, {
        status: "finished",
      });

      Alert.alert("과외 종료", res.data.message || "과외가 종료되었습니다.");
      setData({ ...data, status: res.data.status ?? "finished" });
    } catch (error) {
      console.error("❌ 종료 실패:", error.response?.data || error);
      Alert.alert(
        "오류",
        "과외를 종료할 수 없습니다. 수강생이 존재할 수도 있습니다."
      );
    }
  };

  // ===========================================================
  // 5. 마운트/ID 변경 시 과외 상세 재조회
  // ===========================================================
  useEffect(() => {
    if (!courseId) {
      // 만약 courseId가 없는 상태로 들어온 경우 방어로직
      Alert.alert("오류", "과외 정보가 올바르지 않습니다.");
      setLoading(false);
      return;
    }
    fetchLessonDetail();
  }, [courseId]);

  // ===========================================================
  // 6. 헤더 타이틀 동기화
  //    데이터가 로딩되어 title이 존재하면 네비게이션 헤더 제목 변경
  // ===========================================================
  useLayoutEffect(() => {
    if (data?.title) {
      navigation.setOptions({ title: data.title });
    }
  }, [navigation, data?.title]);

  // ===========================================================
  // 7. 로딩/에러 상태 처리
  // ===========================================================
  if (loading) {
    // 로딩 중에는 스피너만 보여줌
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  if (!data) {
    // 데이터가 없을 때(요청 실패 등) 간단한 에러 메시지 표시
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>데이터를 불러오지 못했습니다.</Text>
      </View>
    );
  }

  // ===========================================================
  // 8. 실제 렌더링 영역
  // ===========================================================
  return (
    <ScrollView style={styles.container}>
      {/* ====================== 썸네일 이미지 ====================== */}
      <Image
        source={{ uri: data.thumbnail_image_url }}
        style={styles.thumbnail}
      />

      {/* ================= 썸네일 하단 튜터용 관리 버튼 =================
          ※ 현재는 (data.is_owner || true) 로 항상 노출되도록 되어 있으며,
            추후 로그인/권한이 붙으면 data.is_owner만 체크하도록 수정 예정. */}
      {(data.is_owner || true) && (
        <View style={styles.thumbnailButtons}>
          {/* 1) 과외 수정 버튼 */}
          <TouchableOpacity
            style={[styles.thumbBtn, { backgroundColor: "#ffa502" }]}
            onPress={() =>
              navigation.navigate("LessonCreate", {
                editMode: true, // LessonCreateScreen에서 편집 모드로 인식하게 할 플래그
                lessonData: data, // 기존 과외 데이터를 그대로 넘겨줌
              })
            }
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.thumbLabel}>수정</Text>
          </TouchableOpacity>

          {/* 2) 상태 토글 버튼 (recruiting ↔ in_progress) */}
          <TouchableOpacity
            style={[styles.thumbBtn, { backgroundColor: "#1e90ff" }]}
            onPress={async () => {
              try {
                // 현재 상태에 따라 다음 상태 계산
                let nextStatus = "recruiting";
                if (data.status === "recruiting") nextStatus = "in_progress";
                else if (data.status === "in_progress") nextStatus = "recruiting";

                // 서버에 상태 변경 PATCH 요청
                const res = await axios.patch(
                  `${BASE_URL}/courses/${courseId}/status/`,
                  { status: nextStatus }
                );

                Alert.alert("상태 변경", res.data.message || "변경 완료");
                // 응답 결과를 화면 data에 반영
                setData({ ...data, status: nextStatus });
              } catch (err) {
                console.error("status change error:", err.response?.data || err);
                Alert.alert("오류", "상태 변경에 실패했습니다.");
              }
            }}
          >
            <Ionicons name="sync-outline" size={20} color="#fff" />
            <Text style={styles.thumbLabel}>
              {/* 버튼 라벨은 현재 상태에 따라 반대로 표시 (진행중 → 모집중, 모집중 → 진행중) */}
              {data.status === "in_progress" ? "모집중" : "진행중"}
            </Text>
          </TouchableOpacity>

          {/* 3) 과외 종료 버튼 */}
          <TouchableOpacity
            style={[styles.thumbBtn, { backgroundColor: "tomato" }]}
            onPress={async () => {
              // 수강생이 한 명이라도 있으면 종료 불가
              if (data.current_tutees_count > 0) {
                Alert.alert(
                  "종료 불가",
                  "현재 수강 중인 튜티가 있어 종료할 수 없습니다."
                );
                return;
              }

              try {
                const res = await axios.patch(
                  `${BASE_URL}/courses/${courseId}/status/`,
                  { status: "finished" }
                );
                Alert.alert("과외 종료", res.data.message || "종료되었습니다.");
                setData({ ...data, status: "finished" });
              } catch (err) {
                console.error("end course error:", err.response?.data || err);
                Alert.alert(
                  "오류",
                  "종료할 수 없습니다. 수강생이 존재할 수도 있습니다."
                );
              }
            }}
          >
            <Ionicons name="stop-circle-outline" size={20} color="#fff" />
            <Text style={styles.thumbLabel}>종료</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================== 제목 + 찜(하트) 버튼 영역 ================== */}
      <View style={styles.row}>
        <Text style={styles.title}>{data.title}</Text>

        {/* 찜 토글 아이콘 */}
        <TouchableOpacity onPress={toggleWish}>
          <Ionicons
            name={isWished ? "heart" : "heart-outline"}
            size={28}
            color={isWished ? "tomato" : "#aaa"}
            style={{ marginLeft: 8, marginBottom: 2 }}
          />
        </TouchableOpacity>
      </View>

      {/* ================== 튜터 / 인원 / 상태 정보 ================== */}
      <Text style={styles.tutor}>
        튜터: {data.tutor?.username || data.tutor?.name}
      </Text>
      <Text style={styles.capacity}>
        수강 가능 인원: {data.current_tutees_count}/{data.max_tutees}
      </Text>
      <Text style={styles.status}>상태: {data.status}</Text>

      {/* ====================== 소개 섹션 ====================== */}
      <Text style={styles.sectionTitle}>소개</Text>
      <Text style={styles.text}>
        {data.description || "소개글이 없습니다."}
      </Text>

      {/* ===================== 커리큘럼 섹션 ===================== */}
      <Text style={styles.sectionTitle}>커리큘럼</Text>
      <Text style={styles.text}>
        {data.curriculum || "커리큘럼 정보가 없습니다."}
      </Text>

      {/* ====================== 리뷰 섹션 ======================= */}
      <Text style={styles.sectionTitle}>
        리뷰 ⭐ ({data.reviews?.length || 0})
      </Text>

      {data.reviews && data.reviews.length > 0 ? (
        // 리뷰가 하나 이상 있을 때
        data.reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <Text style={styles.reviewUser}>
              {/* user_name이 없을 경우 익명으로 표시 */}
              {review.user_name || "익명"} ({"⭐".repeat(review.rating)})
            </Text>
            <Text>{review.comment}</Text>
          </View>
        ))
      ) : (
        // 리뷰가 없을 때
        <Text style={{ color: "gray" }}>아직 리뷰가 없습니다.</Text>
      )}

      {/* ===================== 하단 액션 버튼들 ===================== */}
      <View style={styles.footer}>
        {/* 리뷰 작성 버튼 */}
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "blue" }]}
          onPress={() => navigation.navigate("ReviewWrite")}
        >
          <Ionicons name="star" size={20} color="#fff" />
          <Text style={styles.footerText}>리뷰 작성</Text>
        </TouchableOpacity>

        {/* 수강 신청 버튼 (아직 미구현) */}
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "gray" }]}
          onPress={() =>
            Alert.alert("준비 중", "수강 신청 기능은 나중에 구현됩니다.")
          }
        >
          <Ionicons name="school" size={20} color="#fff" />
          <Text style={styles.footerText}>수강 신청</Text>
        </TouchableOpacity>

        {/* 채팅하기 버튼 */}
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "tomato" }]}
          onPress={() => navigation.navigate("Chat", { lessonId: data.id })}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.footerText}>채팅하기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// -----------------------------------------------------------
// 스타일 정의
// -----------------------------------------------------------
const styles = StyleSheet.create({
  // 화면 전체 컨테이너
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  // 상단 썸네일 이미지
  thumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },

  // 제목 + 찜 아이콘을 가로로 배치
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // 과외 제목
  title: { fontSize: 22, fontWeight: "bold", flex: 1 },

  // 튜터 이름
  tutor: { fontSize: 16, marginTop: 8 },

  // 수강 인원 표시
  capacity: { fontSize: 14, color: "gray", marginTop: 4 },

  // 과외 상태 텍스트
  status: { fontSize: 15, fontWeight: "600", marginTop: 6, color: "#444" },

  // 섹션 타이틀 (소개, 커리큘럼, 리뷰 등)
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 6,
  },

  // 본문 텍스트 스타일
  text: { fontSize: 15, lineHeight: 22 },

  // 리뷰 카드 박스
  reviewCard: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 6,
    marginVertical: 5,
  },

  // 리뷰 작성자 이름 + 별점
  reviewUser: { fontWeight: "bold", marginBottom: 4 },

  // 튜터 전용 관리 버튼 래퍼 (썸네일 아래)
  thumbnailButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
    gap: 10, // 버튼 간격
  },

  // 개별 원형 관리 버튼
  thumbBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  // 관리 버튼 라벨 텍스트
  thumbLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  // 하단 액션 버튼 컨테이너 (리뷰작성 / 수강신청 / 채팅)
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 50,
  },

  // 개별 하단 버튼 스타일
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },

  // 하단 버튼 텍스트
  footerText: { color: "#fff", marginLeft: 6, fontWeight: "bold" },
});
