import { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";

const popularSearches = ["React", "피아노", "헬스", "영어"];
const recentSearches = ["주식", "프로그래밍"];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    // 실제로는 API 호출, 지금은 더미
    setResults([{ id: "1", title: `${query} 과외 예시` }]);
  };

  return (
    <View style={styles.container}>
      {/* 검색창 */}
      <TextInput
        style={styles.input}
        placeholder="과외 검색하기"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
      />

      {/* 인기 검색어 */}
      <Text style={styles.sectionTitle}>🔥 인기 검색어</Text>
      <FlatList
        horizontal
        data={popularSearches}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tag}
            onPress={() => {
              setQuery(item);
              handleSearch();
            }}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* 최근 검색어 */}
      <Text style={styles.sectionTitle}>🕑 최근 검색어</Text>
      {recentSearches.map((item, idx) => (
        <Text key={idx} style={styles.recent}>
          {item}
        </Text>
      ))}

      {/* 검색 결과 */}
      <Text style={styles.sectionTitle}>검색 결과</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
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
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  tag: {
    backgroundColor: "#f1f1f1",
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  recent: { fontSize: 14, color: "gray", marginVertical: 2 },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
