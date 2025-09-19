import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from "react-native";

const dummyTutor = {
  name: "김튜터",
  bio: "10년 경력의 React Native 개발자입니다. 다양한 스타트업과 프로젝트 경험이 있습니다.",
  profileImg: "https://placekitten.com/200/200",
  lessons: [
    { id: "1", title: "React Native 기초 마스터" },
    { id: "2", title: "모바일 앱 배포 전략" },
  ],
};

export default function IntroScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* 프로필 */}
      <Image source={{ uri: dummyTutor.profileImg }} style={styles.profileImg} />
      <Text style={styles.name}>{dummyTutor.name}</Text>
      <Text style={styles.bio}>{dummyTutor.bio}</Text>

      {/* 개설한 과외 */}
      <Text style={styles.sectionTitle}>📖 개설한 과외</Text>
      <FlatList
        data={dummyTutor.lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.lessonItem}
            onPress={() => navigation.navigate("LessonDetail", { lesson: item })}
          >
            <Text>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  profileImg: { width: 120, height: 120, borderRadius: 60, alignSelf: "center", marginBottom: 20 },
  name: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  bio: { fontSize: 14, textAlign: "center", color: "gray", marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 10 },
  lessonItem: {
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 10,
  },
});
