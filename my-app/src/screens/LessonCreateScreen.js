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
import { BASE_URL } from "../config/config";
import { getAccessToken } from "../utils/tokenStorage";

export default function LessonCreateScreen({ navigation, route }) {
  const editMode = !!route?.params?.editMode;
  const lessonData = route?.params?.lessonData || null;
  const returnToLessonId = route?.params?.returnToLessonId ?? lessonData?.id ?? null;

  // ===== State 관리 =====
  const [title, setTitle] = useState(""); // 과외 제목
  const [capacity, setCapacity] = useState(""); // 수강 인원
  const [tutorIntro, setTutorIntro] = useState(""); // 강사 소개
  const [intro, setIntro] = useState(""); // 강의 소개
  const [curriculum, setCurriculum] = useState(""); // 커리큘럼
  const [thumbnail, setThumbnail] = useState(null); // 썸네일 이미지 URI
  const [loading, setLoading] = useState(false); // 업로드 중 로딩 상태
  const [categoryId, setCategoryId] = useState("2"); // 선택된 카테고리 ID (기본값: 음악)
  
  // ===== 카테고리 목록 (고정 데이터) =====
  const categories = [
    { id: 1, name: "음악" },
    { id: 2, name: "운동" },
    { id: 3, name: "예술" },
    { id: 4, name: "프로그래밍" },
    { id: 5, name: "금융/재테크" },
    { id: 6, name: "외국어" },
    { id: 7, name: "기타" },
  ];

  // ===== 플랫폼별 Alert 처리 함수 =====
  // 웹에서는 window.alert, 네이티브에서는 Alert.alert 사용
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const moveToLessonDetail = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (returnToLessonId) {
      navigation.navigate("LessonDetail", { lessonId: returnToLessonId });
      return;
    }

    navigation.navigate("Home");
  };

  // ===== 헤더 설정 =====
  // 화면 상단에 "강의 생성" 제목과 뒤로가기 버튼 표시
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: editMode ? "강의 수정" : "강의 생성",
      headerTitleAlign: "center",
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => (editMode ? moveToLessonDetail() : navigation.goBack())}
          style={{ padding: 8, marginLeft: 6 }}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, editMode, returnToLessonId]);

  // ===== 수정 모드 초기값 세팅 =====
  useEffect(() => {
    if (!editMode || !lessonData) return;

    setTitle(lessonData.title || "");
    setCapacity(String(lessonData.max_tutees ?? ""));
    setIntro(lessonData.description || "");
    setCurriculum(lessonData.curriculum || "");
    setTutorIntro("");

    // lessonData.thumbnail_image_url 또는 thumbnail 둘 다 허용
    setThumbnail(lessonData.thumbnail_image_url || lessonData.thumbnail || null);
  }, [editMode, lessonData]);

  // ===== 이미지 권한 요청 (앱 실행 시 1회) =====
  // 웹에서는 스킵, 네이티브 앱에서만 갤러리 접근 권한 요청
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showAlert("권한 필요", "사진을 업로드하려면 미디어 라이브러리 접근 권한이 필요합니다.");
        }
      }
    })();
  }, []);

  // ===== 과외 업로드 함수 =====
  const handleUpload = async () => {
    // 1. 필수 입력 필드 검증
    if (!title.trim()) {
      showAlert("입력 오류", "제목을 입력해주세요.");
      return;
    }

    if (!capacity.trim() || parseInt(capacity, 10) <= 0) {
      showAlert("입력 오류", "수강 인원을 올바르게 입력해주세요.");
      return;
    }

    if (!editMode && !tutorIntro.trim()) {
      showAlert("입력 오류", "강사 소개를 입력해주세요.");
      return;
    }

    if (!intro.trim()) {
      showAlert("입력 오류", "강의 소개를 입력해주세요.");
      return;
    }

    if (!curriculum.trim()) {
      showAlert("입력 오류", "커리큘럼을 입력해주세요.");
      return;
    }

    setLoading(true); // 로딩 시작
    
    try {
      // 2. 플랫폼별 API URL 설정
      // Android 에뮬레이터: 10.0.2.2 (로컬호스트 주소)
      // 그 외: localhost
      const apiBase = Platform.OS === "android" ? "http://10.0.2.2:80" : BASE_URL;
      const endpoint =
        editMode && lessonData?.id
          ? `${apiBase}/courses/${lessonData.id}/`
          : `${apiBase}/courses/create/`;

      // Auth 토큰 가져오기
      const access = await getAccessToken();
      if (!access) {
        setLoading(false);
        showAlert("인증 필요", "로그인 후 시도하세요.");
        return;
      }

      // JWT 페이로드에서 사용자 id 파싱 (프론트 전용 해결)
      const parseJwt = (token) => {
        try {
          const base64Url = token.split('.')[1];
          if (!base64Url) return null;
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          let jsonPayload = '';
          if (typeof atob === 'function') {
            jsonPayload = decodeURIComponent(Array.prototype.map.call(atob(padded), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          } else if (typeof Buffer !== 'undefined') {
            jsonPayload = Buffer.from(padded, 'base64').toString('utf8');
          } else {
            return null;
          }
          return JSON.parse(jsonPayload);
        } catch (e) {
          return null;
        }
      };

      let tutorId = null;
      if (!editMode) {
        const payload = parseJwt(access);
        if (!payload || (!payload.user_id && !payload.id && !payload.sub)) {
          setLoading(false);
          showAlert("오류", "토큰에서 사용자 정보를 추출할 수 없습니다.");
          return;
        }
        // Simple fallback: try common claim names
        tutorId = payload.user_id ?? payload.id ?? payload.sub;
      }

      const headers = { Accept: "application/json" };
      headers.Authorization = `Bearer ${access}`;

      // FormData 생성
      const form = new FormData();
      form.append("title", title);
      form.append("description", intro || "");
      form.append("curriculum", curriculum || "");
      form.append("max_tutees", String(parseInt(capacity, 10) || 1)); // 최대 인원

      if (!editMode) {
        form.append("tutor", String(tutorId));
        form.append("category", String(categoryId));
      }

      const isLocalImageUri =
        typeof thumbnail === "string" &&
        (thumbnail.startsWith("file:") || thumbnail.startsWith("content:") || thumbnail.startsWith("blob:"));

      // 썸네일 이미지 파일 추가
      // 수정 모드에서는 기존 원격 URL을 다시 업로드하지 않고, 새로 선택한 로컬 이미지만 전송한다.
      if (thumbnail && (!editMode || isLocalImageUri)) {
        const uriParts = thumbnail.split('/');
        const fileName = uriParts[uriParts.length - 1].split('?')[0] || 'photo.jpg';
        const match = /\.(\w+)$/.exec(fileName);
        const fileType = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

        if (Platform.OS === 'web') {
          const resp = await fetch(thumbnail);
          const blob = await resp.blob();

          // blob.type 예: "image/jpeg" → ext = "jpeg" 또는 "jpg"으로 변환
          let ext = (blob.type || '').split('/')[1] || '';
          if (ext === 'jpeg') ext = 'jpg';
          if (!ext) ext = 'jpg';

          // 기존 fileName에 확장자가 없으면 붙임
          let fileNameWithExt = fileName;
          if (!/\.\w+$/.test(fileName)) {
            fileNameWithExt = `photo.${ext}`;
          }

          form.append('thumbnail_image_url', blob, fileNameWithExt);
        } else {
          form.append('thumbnail_image_url', {
            uri: Platform.OS === 'android' ? thumbnail : thumbnail.replace('file://', ''),
            name: fileName,
            type: fileType,
          });
        }
      }

      // 4. 백엔드 API 호출
      // multipart/form-data 전송 시 Content-Type 헤더를 직접 설정하지 않음
      const res = await fetch(endpoint, {
        method: editMode ? "PATCH" : "POST",
        body: form,
        headers,
      });

      const json = await res.json();

      // 5. 응답 처리
      if (!res.ok) {
        showAlert("업로드 실패", JSON.stringify(json));
        return;
      }

      // 6. 성공 시 폼 초기화/이동
      setTitle("");
      setCapacity("");
      setTutorIntro("");
      setIntro("");
      setCurriculum("");
      setThumbnail(null);
      setCategoryId("2");

      if (editMode && lessonData?.id) {
        moveToLessonDetail();
      } else {
        navigation.navigate("Home");
      }
      
    } catch (e) {
      // 7. 네트워크 에러 등 예외 처리
      showAlert("오류", "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // ===== 썸네일 이미지 선택 함수 =====
  const onPressThumbnail = async () => {
    try {
      // 1. 권한 확인 (앱에서만)
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (req.status !== "granted") {
            showAlert("권한 거부", "사진 접근 권한이 필요합니다.");
            return;
          }
        }
      }

      // 2. 이미지 선택 다이얼로그 열기
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // 이미지만 선택
        allowsEditing: true, // 편집 기능 활성화
        quality: 0.8, // 이미지 품질 (0.0~1.0)
        aspect: [16, 9], // 가로세로 비율
      });

      // 3. 취소 여부 확인
      const canceled = result.canceled ?? result.cancelled ?? false;
      if (canceled) return;

      // 4. 선택된 이미지 URI 저장
      const uri =
        result.assets && result.assets.length > 0
          ? result.assets[0].uri
          : result.uri;

      if (uri) {
        setThumbnail(uri); // 썸네일 상태 업데이트
      }
    } catch (e) {
      showAlert("오류", "이미지 선택 중 오류가 발생했습니다.");
    }
  };

  // ===== UI 렌더링 =====
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 썸네일 업로드 버튼 */}
        <TouchableOpacity style={styles.thumbnailBox} onPress={onPressThumbnail} activeOpacity={0.8}>
          {thumbnail ? (
            // 썸네일이 선택된 경우: 이미지 표시
            <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} resizeMode="cover" />
          ) : (
            // 썸네일이 없는 경우: 플레이스홀더 표시
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="image" size={28} color="#bbb" />
              <Text style={styles.thumbnailText}>썸네일 업로드</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 카테고리 선택: 생성 모드에서만 표시 */}
        {!editMode && (
          <>
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
          </>
        )}

        {/* 제목 입력 */}
        <Text style={styles.label}>어떤 제목으로 올릴까요?</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder="제목을 입력해주세요."
          placeholderTextColor="#9e9e9e"
          value={title}
          onChangeText={setTitle}
          multiline
        />

        {/* 수강 인원 입력 */}
        <Text style={styles.label}>몇 명까지 받을 건가요?</Text>
        <TextInput
          style={styles.input}
          placeholder="수강 인원을 입력해주세요. (숫자만)"
          placeholderTextColor="#9e9e9e"
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
        />

        {/* 강사 소개 입력: 생성 모드에서만 필수/표시 */}
        {!editMode && (
          <>
            <Text style={styles.label}>자신을 소개해 주세요!</Text>
            <TextInput
              style={[styles.input, { height: 150 }]}
              placeholder="본인에 대한 소개글을 작성해주세요. (전공/전문 분야 등)"
              placeholderTextColor="#9e9e9e"
              value={tutorIntro}
              onChangeText={setTutorIntro}
              multiline
            />
          </>
        )}

        {/* 강의 소개 입력 */}
        <Text style={styles.label}>어떤 강의인지 소개해주세요!</Text>
        <TextInput
          style={[styles.input, { height: 200 }]}
          placeholder="강의에 대해서 작성해주세요."
          placeholderTextColor="#9e9e9e"
          value={intro}
          onChangeText={setIntro}
          multiline
        />

        {/* 커리큘럼 입력 */}
        <Text style={styles.label}>주차별 또는 강의별 진행 계획을 적어주세요!</Text>
        <TextInput
          style={[styles.input, { height: 160 }]}
          placeholder="강의 커리큘럼을 작성해주세요."
          placeholderTextColor="#9e9e9e"
          value={curriculum}
          onChangeText={setCurriculum}
          multiline
        />

        {/* 업로드 버튼 */}
        <View style={{ marginTop: 20 }}>
          <Button
            title={loading ? (editMode ? "수정 중..." : "업로드 중...") : (editMode ? "수정 저장" : "과외 업로드")}
            onPress={handleUpload}
            disabled={loading}
          />
          {/* 로딩 중일 때 스피너 표시 */}
          {loading && (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator size="small" color="tomato" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* AI 챗봇 FAB (Floating Action Button) */}
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

// ===== 스타일 정의 =====
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
    position: "absolute", // 화면에 고정
    bottom: 24,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 26, // 원형
    backgroundColor: "tomato",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6, // 그림자 효과 (Android)
    zIndex: 100, // 최상단 배치
  },
});
