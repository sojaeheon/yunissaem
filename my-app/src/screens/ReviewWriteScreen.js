import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ReviewWriteScreen({ navigation }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReview = () => {
    Alert.alert("완료", "리뷰가 작성되었습니다!", [
      { text: "확인", onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>수강 후기 작성</Text>

      {/* 별점 선택 */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={32}
            color="tomato"
            onPress={() => setRating(star)}
          />
        ))}
      </View>

      {/* 리뷰 입력 */}
      <TextInput
        style={styles.input}
        placeholder="후기를 작성해주세요"
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <Button title="작성 완료" onPress={submitReview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  ratingRow: { flexDirection: "row", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
});
