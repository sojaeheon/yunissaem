import { FlatList, View, Text, TouchableOpacity, StyleSheet } from "react-native";

const dummyChats = [
  { id: "1", lesson: "React Native 과외", partner: "김튜터", unread: 2 },
  { id: "2", lesson: "피아노 과외", partner: "이선생", unread: 0 },
];

export default function ChatListScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={dummyChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate("Chat", { chatId: item.id })}
          >
            <Text style={styles.lesson}>{item.lesson}</Text>
            <Text style={styles.partner}>상대: {item.partner}</Text>
            {item.unread > 0 && <Text style={styles.unread}>읽지 않음: {item.unread}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  lesson: { fontSize: 16, fontWeight: "bold" },
  partner: { fontSize: 14, color: "gray" },
  unread: { fontSize: 14, color: "tomato" },
});
