import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MyPageScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* 프로필 */}
      <View style={styles.profile}>
        <Image
          source={{ uri: "https://placekitten.com/100/100" }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name}>홍길동</Text>
          <TouchableOpacity onPress={() => alert("소개글 작성/수정")}>
            <Text style={styles.introBtn}>소개글 작성</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => alert("프로필 이미지 변경")}>
          <Ionicons name="settings" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* 메뉴 아이콘 영역 */}
      <View style={styles.menuRow}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("MyLessonsOngoing")}
        >
          <Ionicons name="book" size={32} color="tomato" />
          <Text>수강중</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("MyLessonsCompleted")}
        >
          <Ionicons name="checkmark-done" size={32} color="tomato" />
          <Text>수강했던</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("MyLessonsFavorite")}
        >
          <Ionicons name="heart" size={32} color="tomato" />
          <Text>찜</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuRow}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("MyLessonsCreated")}
        >
          <Ionicons name="create" size={32} color="tomato" />
          <Text>개설한</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("MyLessonsPastCreated")}
        >
          <Ionicons name="time" size={32} color="tomato" />
          <Text>개설했던</Text>
        </TouchableOpacity>
      </View>

      {/* 로그아웃 */}
      <View style={{ marginTop: 30 }}>
        <Button title="로그아웃" onPress={() => navigation.replace("Login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    justifyContent: "space-between",
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 10 },
  name: { fontSize: 20, fontWeight: "bold" },
  introBtn: { color: "blue", marginTop: 4 },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  menuItem: { alignItems: "center" },
});
