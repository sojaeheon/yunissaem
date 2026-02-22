import { View, Text, Button, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { removeTokens } from "../utils/tokenStorage";

export default function MyPageScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <Image source={{ uri: "https://placekitten.com/100/100" }} style={styles.avatar} />

        <View style={styles.profileInfo}>
          <Text style={styles.name}>내 프로필</Text>
          <TouchableOpacity onPress={() => Alert.alert("안내", "소개글 작성/수정 기능은 준비 중입니다.")}>
            <Text style={styles.introBtn}>소개글 작성/수정</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => Alert.alert("안내", "프로필 이미지 변경 기능은 준비 중입니다.")}>
          <Ionicons name="settings" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuRow}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyLessonsOngoing")}>
          <Ionicons name="book" size={32} color="tomato" />
          <Text>수강중</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyLessonsCompleted")}>
          <Ionicons name="checkmark-done" size={32} color="tomato" />
          <Text>수강했던</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyLessonsFavorite")}>
          <Ionicons name="heart" size={32} color="tomato" />
          <Text>찜</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuRow}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyLessonsCreated")}>
          <Ionicons name="create" size={32} color="tomato" />
          <Text>개설한</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyLessonsPastCreated")}>
          <Ionicons name="time" size={32} color="tomato" />
          <Text>개설했던</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 30 }}>
        <Button
          title="로그아웃"
          onPress={async () => {
            await removeTokens();
            navigation.replace("Login");
          }}
        />
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
  profileInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  name: { fontSize: 20, fontWeight: "bold" },
  introBtn: { color: "blue", marginTop: 4 },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  menuItem: { alignItems: "center" },
});
