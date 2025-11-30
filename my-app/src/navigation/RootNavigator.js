import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { useEffect } from "react";

// 🔥 토큰 유틸
import { getAccessToken, getRefreshToken } from "../utils/tokenStorage";

// Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import LessonCreateScreen from "../screens/LessonCreateScreen";
import ChatListScreen from "../screens/ChatListScreen";
import MyPageScreen from "../screens/MyPageScreen";
import CategoryLessonScreen from "../screens/CategoryLessonScreen";
import LessonDetailScreen from "../screens/LessonDetailScreen";
import FindIdScreen from "../screens/FindIdScreen";
import FindPasswordScreen from "../screens/FindPasswordScreen";
import AIChatbotScreen from "../screens/AIChatbotScreen";
import ChatScreen from "../screens/ChatScreen";
import IntroScreen from "../screens/IntroScreen";
import ReviewWriteScreen from "../screens/ReviewWriteScreen";
import SearchScreen from "../screens/SearchScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* -------------------------------
   하단 탭 네비게이터(MainTabs)
-------------------------------- */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // 아이콘 설정
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "LessonCreate") iconName = "add-circle";
          else if (route.name === "ChatList") iconName = "chatbubbles";
          else if (route.name === "MyPage") iconName = "person";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
        headerShown: true, // 탭 내부 화면 헤더 표시
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "홈",
          // 홈 화면 우측 상단 버튼 영역
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Search")}
                style={{ marginRight: 10 }}
              >
                <Ionicons name="search" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.setParams({ openMenu: true })}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="menu" size={24} color="black" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />

      <Tab.Screen
        name="LessonCreate"
        component={LessonCreateScreen}
        options={{ title: "과외 생성" }}
      />

      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: "채팅" }}
      />

      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{ title: "마이페이지" }}
      />
    </Tab.Navigator>
  );
}

/* -------------------------------
   Root Navigator
-------------------------------- */
export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* 로그인 화면 (헤더 표시) */}
        <Stack.Screen
          name="Login"
          component={LoginScreenWrapper}
          options={{ title: "로그인" }}
        />

        {/* Auth */}
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "회원가입" }}
        />
        <Stack.Screen
          name="FindId"
          component={FindIdScreen}
          options={{ title: "아이디 찾기" }}
        />
        <Stack.Screen
          name="FindPassword"
          component={FindPasswordScreen}
          options={{ title: "비밀번호 찾기" }}
        />

        {/* 메인 탭 (헤더 숨김) */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Extra Screens */}
        <Stack.Screen
          name="CategoryLesson"
          component={CategoryLessonScreen}
          options={{ title: "카테고리" }}
        />
        <Stack.Screen
          name="LessonDetail"
          component={LessonDetailScreen}
          options={{ title: "과외 상세" }}
        />
        <Stack.Screen
          name="AIChatbot"
          component={AIChatbotScreen}
          options={{
            presentation: "transparentModal",
            headerShown: false,
          }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "채팅" }} />
        <Stack.Screen name="ReviewWrite" component={ReviewWriteScreen} options={{ title: "리뷰 작성" }} />
        <Stack.Screen name="Intro" component={IntroScreen} options={{ title: "소개" }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "검색" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* 
  LoginScreen을 감싸서 토큰 체크 → 자동 로그인 처리하는 래퍼
  - 앱 처음 실행할 때 refresh 토큰이 있으면 바로 MainTabs로 이동
  - 토큰이 없으면 LoginScreen 그대로 보여줌
*/
function LoginScreenWrapper(props) {
  const { navigation } = props;

  useEffect(() => {
    const check = async () => {
      const refresh = await getRefreshToken();
      if (refresh) {
        // 자동 로그인 → 메인 탭으로
        navigation.replace("MainTabs");
      }
    };
    check();
  }, [navigation]);

  return <LoginScreen {...props} />;
}
