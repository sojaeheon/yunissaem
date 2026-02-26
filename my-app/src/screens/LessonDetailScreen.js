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

import React, { useLayoutEffect } from "react";
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
import api from "../utils/axiosInstance";
import { BASE_URL, SERVER_BASE } from "../config/config";
import { useFocusEffect } from "@react-navigation/native";

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

  const STATUS_LABELS = {
    recruiting: "모집중",
    in_progress: "진행중",
    finished: "종료",
  };

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

  useFocusEffect(
    React.useCallback(() => {
      if (courseId) {
        fetchLessonDetail();
      }
    }, [courseId])
  );

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

  const thumbnailUri =
    typeof data.thumbnail_image_url === "string" && data.thumbnail_image_url.startsWith("/")
      ? `${SERVER_BASE}${data.thumbnail_image_url}`
      : data.thumbnail_image_url;

  const statusLabel = STATUS_LABELS[data.status] || data.status;

  // ===========================================================
  // 8. 실제 렌더링 영역
  // ===========================================================
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroCard}>
        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
        <View style={styles.heroTopRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{statusLabel}</Text>
          </View>
          <TouchableOpacity onPress={toggleWish} style={styles.wishBtn}>
            <Ionicons
              name={isWished ? "heart" : "heart-outline"}
              size={22}
              color={isWished ? "#ef4444" : "#64748b"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {data.is_owner && (
        <View style={styles.ownerActionRow}>
          {/* 1) 과외 수정 버튼 */}
          <TouchableOpacity
            style={[styles.ownerActionBtn, { backgroundColor: "#f59e0b" }]}
            onPress={() =>
              navigation.navigate("LessonCreateEdit", {
                editMode: true, // LessonCreateScreen에서 편집 모드로 인식하게 할 플래그
                lessonData: data, // 기존 과외 데이터를 그대로 넘겨줌
                returnToLessonId: data.id,
              })
            }
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.ownerActionText}>수정</Text>
          </TouchableOpacity>

          {/* 2) 상태 토글 버튼 (recruiting ↔ in_progress) */}
          <TouchableOpacity
            style={[styles.ownerActionBtn, { backgroundColor: "#2563eb" }]}
            onPress={async () => {
              try {
                // 현재 상태에 따라 다음 상태 계산
                let nextStatus = "recruiting";
                if (data.status === "recruiting") nextStatus = "in_progress";
                else if (data.status === "in_progress") nextStatus = "recruiting";

                // 서버에 상태 변경 PATCH 요청
                const res = await api.patch(
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
            <Ionicons name="sync-outline" size={16} color="#fff" />
            <Text style={styles.ownerActionText}>
              {/* 버튼 라벨은 현재 상태에 따라 반대로 표시 (진행중 → 모집중, 모집중 → 진행중) */}
              {data.status === "in_progress" ? "모집중" : "진행중"}
            </Text>
          </TouchableOpacity>

          {/* 3) 과외 종료 버튼 */}
          <TouchableOpacity
            style={[styles.ownerActionBtn, { backgroundColor: "#ef4444" }]}
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
                const res = await api.patch(
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
            <Ionicons name="stop-circle-outline" size={16} color="#fff" />
            <Text style={styles.ownerActionText}>종료</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.tutor}>튜터: {data.tutor?.username || data.tutor?.name}</Text>
        <View style={styles.metaChipRow}>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={14} color="#475569" />
            <Text style={styles.metaChipText}>
              {data.current_tutees_count}/{data.max_tutees}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="eye-outline" size={14} color="#475569" />
            <Text style={styles.metaChipText}>{data.view_count ?? 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>소개</Text>
        <Text style={styles.text}>{data.description || "소개글이 없습니다."}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>커리큘럼</Text>
        <Text style={styles.text}>{data.curriculum || "커리큘럼 정보가 없습니다."}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>리뷰 ({data.reviews?.length || 0})</Text>

        {data.reviews && data.reviews.length > 0 ? (
          data.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <Text style={styles.reviewUser}>
                {review.user_name || "익명"} ({"⭐".repeat(review.rating)})
              </Text>
              <Text style={styles.reviewText}>{review.comment}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyReview}>아직 리뷰가 없습니다.</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "#2563eb" }]}
          onPress={() => navigation.navigate("ReviewWrite", { lessonId: data.id, courseId: data.id })}
        >
          <Ionicons name="star" size={18} color="#fff" />
          <Text style={styles.footerText}>리뷰 작성</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "#6b7280" }]}
          onPress={() =>
            Alert.alert("준비 중", "수강 신청 기능은 나중에 구현됩니다.")
          }
        >
          <Ionicons name="school" size={18} color="#fff" />
          <Text style={styles.footerText}>수강 신청</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "#ef4444" }]}
          onPress={async () => {
            try {
              // 채팅방 생성 또는 기존 채팅방 반환
              const response = await api.post("/chat/rooms/", {
                course_id: data.id,
                tutor_id: data.tutor?.id,
              });

              const { room_id, created } = response.data;

              // 채팅 화면으로 이동
              navigation.navigate("Chat", {
                roomId: room_id,
                courseTitle: data.title,
                otherUserName: data.tutor?.name || data.tutor?.username,
                otherUserId: data.tutor?.id,
              });

              if (created) {
                console.log("✅ 새 채팅방이 생성되었습니다:", room_id);
              }
            } catch (error) {
              console.error("❌ 채팅방 생성 실패:", error.response?.data || error);
              if (error.response?.status === 401) {
                Alert.alert("로그인 필요", "채팅을 시작하려면 로그인이 필요합니다.");
              } else if (error.response?.status === 400) {
                Alert.alert("오류", error.response?.data?.error || "채팅방을 만들 수 없습니다.");
              } else {
                Alert.alert("오류", "채팅방을 만드는 중 문제가 발생했습니다.");
              }
            }
          }}
        >
          <Ionicons name="chatbubbles" size={18} color="#fff" />
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
  container: { flex: 1, backgroundColor: "#f3f6fb" },
  contentContainer: { padding: 14, paddingBottom: 28 },
  heroCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#dbe3ef",
    marginBottom: 10,
  },
  thumbnail: {
    width: "100%",
    height: 214,
  },
  heroTopRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
  },
  wishBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerActionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  ownerActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  ownerActionText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e3eaf4",
    padding: 14,
    marginBottom: 10,
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "800", color: "#111827", marginBottom: 4 },
  tutor: { fontSize: 15, color: "#475569", marginBottom: 10 },
  metaChipRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#eef2f7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  metaChipText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e3eaf4",
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  text: { fontSize: 14, lineHeight: 22, color: "#334155" },
  reviewCard: {
    backgroundColor: "#f8fafc",
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
  },
  reviewUser: { fontWeight: "700", marginBottom: 3, color: "#0f172a" },
  reviewText: { color: "#334155", lineHeight: 20, fontSize: 13.5 },
  emptyReview: { color: "#64748b", fontSize: 13.5 },
  footer: {
    marginTop: 4,
    gap: 8,
  },
  footerBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 7,
  },
  footerText: { color: "#fff", fontWeight: "700", fontSize: 14.5 },
});
