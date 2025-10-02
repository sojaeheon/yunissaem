import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image, // 추가
} from "react-native";
import CategoryMenu from "../screens/CategoryMenu";

// 썸네일 이미지 URL 추가 예시
const dummyLessons = [
  { id: "1", title: "React Native 기초", category: "프로그래밍", thumbnail: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308" },
  { id: "2", title: "JavaScript ES6+", category: "프로그래밍", thumbnail: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg" },
  { id: "3", title: "Python 데이터 분석", category: "프로그래밍", thumbnail: "https://source.unsplash.com/150x100/?python" },
  { id: "4", title: "Node.js 백엔드 개발", category: "프로그래밍", thumbnail: "https://source.unsplash.com/150x100/?nodejs" },
  { id: "5", title: "코틀린으로 안드로이드 앱 만들기", category: "프로그래밍", thumbnail: "https://source.unsplash.com/150x100/?kotlin" },
  { id: "6", title: "자료구조와 알고리즘", category: "프로그래밍", thumbnail: "https://source.unsplash.com/150x100/?algorithm" },

  // 음악
  { id: "7", title: "피아노 입문", category: "음악", thumbnail: "https://source.unsplash.com/150x100/?piano" },
  { id: "8", title: "통기타 코드 배우기", category: "음악", thumbnail: "https://source.unsplash.com/150x100/?guitar" },
  { id: "9", title: "보컬 트레이닝 기초", category: "음악", thumbnail: "https://source.unsplash.com/150x100/?vocal" },
  { id: "10", title: "작곡의 첫걸음", category: "음악", thumbnail: "https://source.unsplash.com/150x100/?music" },

  // 운동
  { id: "11", title: "헬스 PT", category: "운동", thumbnail: "https://source.unsplash.com/150x100/?fitness" },
  { id: "12", title: "요가 & 필라테스", category: "운동", thumbnail: "https://source.unsplash.com/150x100/?yoga" },
  { id: "13", title: "수영 영법 마스터", category: "운동", thumbnail: "https://source.unsplash.com/150x100/?swimming" },
  { id: "14", title: "테니스 입문 클래스", category: "운동", thumbnail: "https://source.unsplash.com/150x100/?tennis" },

  // 금융
  { id: "15", title: "주식 투자 전략", category: "금융", thumbnail: "https://source.unsplash.com/150x100/?stocks" },
  { id: "16", title: "부동산 재테크", category: "금융", thumbnail: "https://source.unsplash.com/150x100/?realestate" },
  { id: "17", title: "개인 자산 관리", category: "금융", thumbnail: "https://source.unsplash.com/150x100/?finance" },

  // 미술
  { id: "18", title: "수채화 그리기", category: "미술", thumbnail: "https://source.unsplash.com/150x100/?watercolor" },
  { id: "19", title: "아이패드 드로잉", category: "미술", thumbnail: "https://source.unsplash.com/150x100/?drawing" },
  { id: "20", title: "인물 소묘 기초", category: "미술", thumbnail: "https://source.unsplash.com/150x100/?portrait" },

  // 외국어
  { id: "21", title: "비즈니스 영어 회화", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?english" },
  { id: "22", title: "일본어 JLPT N3 대비", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?japanese" },
  { id: "23", title: "왕초보 스페인어", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?spanish" },
  { id: "24", title: "HSK 4급 합격반", category: "외국어", thumbnail: "https://source.unsplash.com/150x100/?chinese" },

  // 디자인
  { id: "25", title: "Figma UI/UX 디자인", category: "디자인", thumbnail: "https://source.unsplash.com/150x100/?figma" },
  { id: "26", title: "포토샵 사진 보정", category: "디자인", thumbnail: "https://source.unsplash.com/150x100/?photoshop" },
  { id: "27", title: "일러스트레이터 시작하기", category: "디자인", thumbnail: "https://source.unsplash.com/150x100/?illustrator" },
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

  const renderLesson = ({ item }) => (
    <TouchableOpacity
      style={styles.lessonCard}
      onPress={() => navigation.navigate("LessonDetail", { lesson: item })}
    >
      {/* 썸네일 이미지 추가 */}
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.lessonThumbnail}
        resizeMode="cover"
      />
      <Text
        style={styles.lessonTitle}
        numberOfLines={1} // 최대 2줄까지 표시
        ellipsizeMode="tail" // 넘치면 ...으로 표시
      >
        {item.title}
      </Text>
      <Text style={styles.lessonCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 섹션: 인기 과외 */}
      <Text style={styles.sectionTitle}>🔥 인기 과외</Text>
      <FlatList
        horizontal
        data={dummyLessons}
        keyExtractor={(item) => item.id}
        renderItem={renderLesson}
        showsHorizontalScrollIndicator={false}
      />

      {/* 섹션: 진행 중인 과외 */}
      <Text style={styles.sectionTitle}>📚 진행 중인 과외</Text>
      <FlatList
        horizontal
        // 진행 중인 과외는 일부만 보여주도록 slice 활용
        data={dummyLessons.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={renderLesson}
        showsHorizontalScrollIndicator={false}
      />

      {/* 섹션: 찜한 과외 */}
      <Text style={styles.sectionTitle}>❤️ 찜한 과외</Text>
      <FlatList
        horizontal
        // 찜한 과외는 다른 일부를 보여주도록 slice 활용
        data={dummyLessons.slice(10, 15)}
        keyExtractor={(item) => item.id}
        renderItem={renderLesson}
        showsHorizontalScrollIndicator={false}
      />

      {/* 카테고리 메뉴 */}
      <CategoryMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </View>
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
    width: 150,
    height: 140, // 높이 늘림
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  lessonThumbnail: {
    width: 130,
    height: 70,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#ddd",
  },
  lessonTitle: { fontSize: 16, fontWeight: "bold" },
  lessonCategory: { fontSize: 14, color: "#555" },
});