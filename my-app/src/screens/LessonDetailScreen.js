import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const dummyLesson = {
  id: "1",
  title: "React Native 기초 마스터",
  tutor: "김튜터",
  capacity: 10,
  enrolled: 5,
  price: "₩50,000",
  description: "React Native를 처음 배우는 사람을 위한 입문 과외입니다.",
  curriculum: "1주차: 환경 설정\n2주차: 기본 컴포넌트\n3주차: 네비게이션\n4주차: 실습 프로젝트",
  thumbnail: "https://placekitten.com/400/200", // 임시 이미지
  reviews: [
    { id: 1, user: "홍길동", rating: 5, comment: "너무 유익했어요!" },
    { id: 2, user: "이몽룡", rating: 4, comment: "알찬 강의였습니다." },
  ],
};

export default function LessonDetailScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      {/* 썸네일 */}
      <Image source={{ uri: dummyLesson.thumbnail }} style={styles.thumbnail} />

      {/* 제목 + 찜 버튼 */}
      <View style={styles.row}>
        <Text style={styles.title}>{dummyLesson.title}</Text>
        <TouchableOpacity onPress={() => alert("찜하기 토글")}>
          <Ionicons name="bookmark-outline" size={28} color="tomato" />
        </TouchableOpacity>
      </View>

      {/* 튜터 + 인원 */}
      <Text style={styles.tutor}>튜터: {dummyLesson.tutor}</Text>
      <Text style={styles.capacity}>
        수강 가능 인원: {dummyLesson.enrolled}/{dummyLesson.capacity}
      </Text>
      <Text style={styles.price}>{dummyLesson.price}</Text>

      {/* 소개 */}
      <Text style={styles.sectionTitle}>소개</Text>
      <Text style={styles.text}>{dummyLesson.description}</Text>

      {/* 커리큘럼 */}
      <Text style={styles.sectionTitle}>커리큘럼</Text>
      <Text style={styles.text}>{dummyLesson.curriculum}</Text>

      {/* 리뷰 */}
      <Text style={styles.sectionTitle}>리뷰 ⭐</Text>
      {dummyLesson.reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <Text style={styles.reviewUser}>
            {review.user} ({"⭐".repeat(review.rating)})
          </Text>
          <Text>{review.comment}</Text>
        </View>
      ))}

      {/* 하단 버튼들 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "tomato" }]}
          onPress={() => navigation.navigate("Chat", { lessonId: dummyLesson.id })}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.footerText}>채팅하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "gray" }]}
          onPress={() => alert("수강 신청 기능은 나중에 구현")}
        >
          <Ionicons name="school" size={20} color="#fff" />
          <Text style={styles.footerText}>수강 신청</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: "blue" }]}
          onPress={() => navigation.navigate("ReviewWrite")}
        >
          <Ionicons name="star" size={20} color="#fff" />
          <Text style={styles.footerText}>리뷰 작성</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  thumbnail: { width: "100%", height: 200, borderRadius: 8, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", flex: 1 },
  tutor: { fontSize: 16, marginTop: 8 },
  capacity: { fontSize: 14, color: "gray", marginTop: 4 },
  price: { fontSize: 18, fontWeight: "bold", marginTop: 8, color: "tomato" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 6 },
  text: { fontSize: 15, lineHeight: 22 },
  reviewCard: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 6,
    marginVertical: 5,
  },
  reviewUser: { fontWeight: "bold", marginBottom: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 50,
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  footerText: { color: "#fff", marginLeft: 6, fontWeight: "bold" },
});
