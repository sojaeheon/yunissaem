import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import CategoryMenu from "../screens/CategoryMenu";

// 더미 데이터: 강사, 평점, 후기, 찜, 진행중 변수 포함
const dummyLessons = [
  {
    id: "1",
    title: "React Native 기초",
    category: "프로그래밍",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8JUVDJUJEJTk0JUVCJTk0JUE5fGVufDB8fDB8fHww",
    enrolled: 5,
    capacity: 8,
    tutor: "김개발",
    rating: 4.8,
    reviewCount: 23,
    liked: true, // 찜 여부
    ongoing: true, // 진행중 여부
  },
  {
    id: "2",
    title: "JavaScript ES6+",
    category: "프로그래밍",
    thumbnail: "https://plus.unsplash.com/premium_photo-1661877737564-3dfd7282efcb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    enrolled: 5,
    capacity: 8,
    tutor: "이자바",
    rating: 4.6,
    reviewCount: 17,
    liked: false,
    ongoing: false,
  },
  {
    id: "3",
    title: "Python 데이터 분석",
    category: "프로그래밍",
    thumbnail: "https://plus.unsplash.com/premium_photo-1720287601920-ee8c503af775?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    enrolled: 5,
    capacity: 8,
    tutor: "박파이썬",
    rating: 4.9,
    reviewCount: 30,
    liked: true,
    ongoing: false,
  },
  { id: "4", title: "Node.js 백엔드 개발", category: "프로그래밍", thumbnail: "https://source.unsplash.com/150x100/?nodejs", enrolled: 5, capacity: 8 },
  { id: "5", title: "코틀린으로 안드로이드 앱 만들기", category: "프로그래밍", thumbnail: "https://source.unsplash.com/150x100/?kotlin", enrolled: 5, capacity: 8 },
  { id: "6", title: "자료구조와 알고리즘", category: "프로그래밍", thumbnail: "https://source.unsplash.com/150x100/?algorithm", enrolled: 5, capacity: 8 },
  // 음악
  { id: "7", title: "피아노 입문", category: "음악", thumbnail: "https://source.unsplash.com/150x100/?piano", enrolled: 5, capacity: 8 },
  { id: "8", title: "통기타 코드 배우기", category: "음악", thumbnail: "https://source.unsplash.com/150x100/?guitar", enrolled: 5, capacity: 8 },
  { id: "9", title: "보컬 트레이닝 기초", category: "음악", thumbnail: "https://source.unsplash.com/150x100/?vocal", enrolled: 5, capacity: 8 },
  {
    id: "10",
    title: "작곡의 첫걸음",
    category: "음악",
    thumbnail: "https://plus.unsplash.com/premium_vector-1713810634629-f8c839434609?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fCVFQyU5NSU4NSVFQiVCMyVCNHxlbnwwfHwwfHx8MA%3D%3D",
    enrolled: 5, capacity: 8, tutor: "홍길동", rating: 4.5, reviewCount: 12, liked: true, ongoing: true
  },
  // 운동
  { id: "11", title: "헬스 PT", category: "운동", thumbnail: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308", enrolled: 5, capacity: 8 },
  { id: "12", title: "요가 & 필라테스", category: "운동", thumbnail: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308", enrolled: 5, capacity: 8 },
  { id: "13", title: "수영 영법 마스터", category: "운동", thumbnail: "https://source.unsplash.com/150x100/?swimming", enrolled: 5, capacity: 8 },
  { id: "14", title: "테니스 입문 클래스", category: "운동", thumbnail: "https://source.unsplash.com/150x100/?tennis", enrolled: 5, capacity: 8 },
  // 금융
  { id: "15", title: "주식 투자 전략", category: "금융", thumbnail: "https://source.unsplash.com/150x100/?stocks", enrolled: 5, capacity: 8 },
  { id: "16", title: "부동산 재테크", category: "금융", thumbnail: "https://source.unsplash.com/150x100/?realestate", enrolled: 5, capacity: 8 },
  { id: "17", title: "개인 자산 관리", category: "금융", thumbnail: "https://source.unsplash.com/150x100/?finance", enrolled: 5, capacity: 8 },
  // 미술
  { id: "18", title: "수채화 그리기", category: "미술", thumbnail: "https://source.unsplash.com/150x100/?watercolor", enrolled: 5, capacity: 8 },
  { id: "19", title: "아이패드 드로잉", category: "미술", thumbnail: "https://source.unsplash.com/150x100/?drawing", enrolled: 5, capacity: 8 },
  { id: "20", title: "인물 소묘 기초", category: "미술", thumbnail: "https://source.unsplash.com/150x100/?portrait", enrolled: 5, capacity: 8 },
  // 외국어
  { id: "21", title: "비즈니스 영어 회화", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?english", enrolled: 5, capacity: 8 },
  { id: "22", title: "일본어 JLPT N3 대비", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?japanese", enrolled: 5, capacity: 8 },
  { id: "23", title: "왕초보 스페인어", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?spanish", enrolled: 5, capacity: 8 },
  { id: "24", title: "HSK 4급 합격반", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?chinese", enrolled: 5, capacity: 8 },
  // 디자인
  { id: "25", title: "Figma UI/UX 디자인", category: "디자인", thumbnail: "https://source.unsplash.com/150x100/?figma", enrolled: 5, capacity: 8 },
  { id: "26", title: "포토샵 사진 보정", category: "디자인", thumbnail: "https://source.unsplash.com/150x100/?photoshop", enrolled: 5, capacity: 8 },
  { id: "27", title: "일러스트레이터 시작하기", category: "디자인", thumbnail: "https://source.unsplash.com/150x100/?illustrator", enrolled: 5, capacity: 8 },
];

export default function HomeScreen({ navigation, route }) {
  const [menuVisible, setMenuVisible] = useState(false);

  // RootNavigator에서 navigation.setParams({ openMenu: true }) 호출 시 메뉴 열기
  useEffect(() => {
    if (route.params?.openMenu) {
      setMenuVisible(true);
      navigation.setParams({ openMenu: false }); // 초기화
    }
  }, [route.params?.openMenu]);

  // 강의 카드 렌더링 함수
  const renderLesson = ({ item }) => (
    <TouchableOpacity
      style={styles.lessonCard}
      onPress={() => navigation.navigate("LessonDetail", { lesson: item })}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.lessonThumbnail}
        resizeMode="cover"
      />
      <Text
        style={styles.lessonTitle}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
      {/* 강사 이름 표시 (값이 있을 때만) */}
      {item.tutor && (
        <Text style={styles.lessonTutor}>{item.tutor}</Text>
      )}
      {/* 카테고리 숨김 */}
      {/* <Text style={styles.lessonCategory}>{item.category}</Text> */}
      {/* 수강 인원 */}
      <Text style={styles.lessonCapacity}>
        {`수강인원: ${item.enrolled ?? 0} / ${item.capacity ?? 0}`}
      </Text>
      {/* 평점 및 후기수 (값이 있을 때만) */}
      {(item.rating && item.reviewCount) && (
        <Text style={styles.lessonRating}>
          {`⭐ ${item.rating} (${item.reviewCount}개 후기)`}
        </Text>
      )}
    </TouchableOpacity>
  );

  // 섹션 렌더링 함수 (중복 제거)
  const renderSection = (title, data) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderLesson}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      />
    </>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 섹션: 인기 과외 */}
      {renderSection("🔥 인기 과외", dummyLessons)}
      {/* 섹션: 진행 중인 과외 (ongoing이 true인 것만) */}
      {renderSection("📚 진행 중인 과외", dummyLessons.filter(item => item.ongoing))}
      {/* 섹션: 찜한 과외 (liked가 true인 것만) */}
      {renderSection("❤️ 찜한 과외", dummyLessons.filter(item => item.liked))}
      {/* 카테고리 메뉴 */}
      <CategoryMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 20,
    marginVertical: 10,
  },
  lessonCard: {
    width: 170,
    height: 190,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginLeft: 10, // 카드 간격
    justifyContent: "flex-start",
    alignItems: "flex-start", // 왼쪽 정렬
    // 필요하다면 그림자 효과 추가 가능
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // elevation: 2,
  },
  lessonThumbnail: {
    width: 150,
    height: 80,
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: "#ddd",
  },
  lessonTitle: { fontSize: 16, fontWeight: "bold", alignSelf: "flex-start" },
  lessonTutor: {
    fontSize: 13,
    color: "#333",
    marginBottom: 2,
    alignSelf: "flex-start",
  },
  lessonCategory: { fontSize: 14, color: "#555" }, // 사용하지 않음
  lessonCapacity: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    alignSelf: "flex-start",
  },
  lessonRating: {
    fontSize: 13,
    color: "#f5a623",
    marginTop: 2,
    alignSelf: "flex-start",
  },
});