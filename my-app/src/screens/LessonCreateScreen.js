import React, { useLayoutEffect, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

export default function LessonCreateScreen({ navigation, route }) {
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tutorIntro, setTutorIntro] = useState("");
  const [intro, setIntro] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState("2");
  
  const categories = [
    { id: 2, name: "음악" },
    { id: 3, name: "운동" },
    { id: 4, name: "예술" },
    { id: 5, name: "프로그래밍" },
    { id: 6, name: "금융/재테크" },
    { id: 7, name: "외국어" },
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "강의 생성",
      headerTitleAlign: "center",
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 6 }}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("권한 필요", "사진을 업로드하려면 미디어 라이브러리 접근 권한이 필요합니다.");
        }
      }
    })();
  }, []);

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert("오류", "제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL =
        Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
      const endpoint = `${API_BASE_URL}/api/courses/create/`;

      const form = new FormData();
      form.append("tutor", "1");
      form.append("category", String(categoryId));
      form.append("title", title);
      form.append("description", intro || "");
      form.append("curriculum", curriculum || "");
      form.append("max_tutees", String(parseInt(capacity, 10) || 1));

      if (thumbnail) {
        form.append("thumbnail_image_url", "https://i.imgur.com/C9Z9Z3O.png");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });

      const json = await res.json();

      if (!res.ok) {
        Alert.alert("업로드 실패", JSON.stringify(json));
        return;
      }

      Alert.alert("업로드 완료", "과외가 생성되었습니다!", [
        { text: "확인", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (e) {
      Alert.alert("오류", "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onPressThumbnail = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (req.status !== "granted") {
            Alert.alert("권한 거부", "사진 접근 권한이 필요합니다.");
            return;
          }
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      const canceled = result.canceled ?? result.cancelled ?? false;
      if (canceled) return;

      const uri =
        result.assets && result.assets.length > 0
          ? result.assets[0].uri
          : result.uri;

      if (uri) {
        setThumbnail(uri);
      }
    } catch (e) {
      Alert.alert("오류", "이미지 선택 중 오류가 발생했습니다.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <TouchableOpacity style={styles.thumbnailBox} onPress={onPressThumbnail} activeOpacity={0.8}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} resizeMode="cover" />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="image" size={28} color="#bbb" />
              <Text style={styles.thumbnailText}>썸네일 업로드</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>카테고리를 선택해주세요</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={categoryId}
            onValueChange={(itemValue) => setCategoryId(itemValue)}
            style={styles.picker}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>어떤 제목으로 올릴까요?</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder="제목을 입력해주세요."
          placeholderTextColor="#9e9e9e"
          value={title}
          onChangeText={setTitle}
          multiline
        />

        <Text style={styles.label}>몇 명까지 받을 건가요?</Text>
        <TextInput
          style={styles.input}
          placeholder="수강 인원을 입력해주세요. (숫자만)"
          placeholderTextColor="#9e9e9e"
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
        />

        <Text style={styles.label}>자신을 소개해 주세요!</Text>
        <TextInput
          style={[styles.input, { height: 150 }]}
          placeholder="본인에 대한 소개글을 작성해주세요. (전공/전문 분야 등)"
          placeholderTextColor="#9e9e9e"
          value={tutorIntro}
          onChangeText={setTutorIntro}
          multiline
        />

        <Text style={styles.label}>어떤 강의인지 소개해주세요!</Text>
        <TextInput
          style={[styles.input, { height: 200 }]}
          placeholder="강의에 대해서 작성해주세요."
          placeholderTextColor="#9e9e9e"
          value={intro}
          onChangeText={setIntro}
          multiline
        />

        <Text style={styles.label}>주차별 또는 강의별 진행 계획을 적어주세요!</Text>
        <TextInput
          style={[styles.input, { height: 160 }]}
          placeholder="강의 커리큘럼을 작성해주세요."
          placeholderTextColor="#9e9e9e"
          value={curriculum}
          onChangeText={setCurriculum}
          multiline
        />

        <View style={{ marginTop: 20 }}>
          <Button title={loading ? "업로드 중..." : "과외 업로드"} onPress={handleUpload} disabled={loading} />
          {loading && (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator size="small" color="tomato" />
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AIChatbot")}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  label: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
  },
  thumbnailBox: {
    alignSelf: "center",
    width: 170,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailText: {
    marginTop: 6,
    color: "#999",
    fontSize: 12,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "tomato",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    zIndex: 100,
  },
});
