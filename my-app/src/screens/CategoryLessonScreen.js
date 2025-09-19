import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch } from "react-native";

const dummyLessons = [
  { id: "1", title: "피아노 기초", category: "음악", available: true },
  { id: "2", title: "헬스 PT", category: "운동", available: false },
  { id: "3", title: "주식 투자", category: "금융", available: true },
  { id: "4", title: "React Native 입문", category: "프로그래밍", available: true },
];

export default function CategoryLessonScreen({ navigation, route }) {
  const { category } = route.params || { category: "전체" };
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [sortOption, setSortOption] = useState("인기순");

  // 필터 + 정렬 적용
  let filteredLessons = dummyLessons.filter(
    (l) =>
      (category === "전체" || l.category === category) &&
      (showUnavailable || l.available)
  );

  if (sortOption === "최신순") {
    filteredLessons = [...filteredLessons].reverse(); // 임시: 뒤집기
  } else if (sortOption === "리뷰 많은 순") {
    filteredLessons = [...filteredLessons]; // 나중에 리뷰 기준 정렬
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{category} 과외 목록</Text>

      {/* 정렬 옵션 */}
      <View style={styles.sortRow}>
        <Text>정렬: {sortOption}</Text>
        <TouchableOpacity onPress={() => setSortOption("인기순")}>
          <Text style={styles.sortBtn}>인기순</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortOption("최신순")}>
          <Text style={styles.sortBtn}>최신순</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortOption("리뷰 많은 순")}>
          <Text style={styles.sortBtn}>리뷰 많은 순</Text>
        </TouchableOpacity>
      </View>

      {/* 토글 */}
      <View style={styles.switchRow}>
        <Text>신청 불가 항목 보기</Text>
        <Switch value={showUnavailable} onValueChange={setShowUnavailable} />
      </View>

      {/* 과외 목록 */}
      <FlatList
        data={filteredLessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.lessonItem,
              !item.available && { backgroundColor: "#eee" },
            ]}
            onPress={() => navigation.navigate("LessonDetail", { lesson: item })}
          >
            <Text>{item.title}</Text>
            {!item.available && <Text style={{ color: "red" }}>신청 불가</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  sortRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sortBtn: { marginLeft: 10, color: "blue" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  lessonItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 10,
  },
});
