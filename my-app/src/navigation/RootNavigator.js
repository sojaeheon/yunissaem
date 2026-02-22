import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { useEffect } from "react";

import { getRefreshToken } from "../utils/tokenStorage";

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
import MyCourseListScreen from "../screens/MyCourseListScreen";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MyPageStack = createNativeStackNavigator();

function MyPageNavigator() {
  return (
    <MyPageStack.Navigator>
      <MyPageStack.Screen name="MyPageHome" component={MyPageScreen} options={{ title: "My Page" }} />
      <MyPageStack.Screen
        name="MyLessonsOngoing"
        component={MyCourseListScreen}
        options={{ title: "My Enrolled Courses" }}
      />
      <MyPageStack.Screen
        name="MyLessonsCompleted"
        component={MyCourseListScreen}
        options={{ title: "My Completed Courses" }}
      />
      <MyPageStack.Screen
        name="MyLessonsFavorite"
        component={MyCourseListScreen}
        options={{ title: "My Wished Courses" }}
      />
      <MyPageStack.Screen
        name="MyLessonsCreated"
        component={MyCourseListScreen}
        options={{ title: "My Created Courses" }}
      />
      <MyPageStack.Screen
        name="MyLessonsPastCreated"
        component={MyCourseListScreen}
        options={{ title: "My Past Created Courses" }}
      />
    </MyPageStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = "ellipse";
          if (route.name === "Home") iconName = "home";
          else if (route.name === "LessonCreate") iconName = "add-circle";
          else if (route.name === "ChatList") iconName = "chatbubbles";
          else if (route.name === "MyPage") iconName = "person";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "Home",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => navigation.navigate("Search")} style={{ marginRight: 10 }}>
                <Ionicons name="search" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.setParams({ openMenu: true })} style={{ marginRight: 15 }}>
                <Ionicons name="menu" size={24} color="black" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />

      <Tab.Screen name="LessonCreate" component={LessonCreateScreen} options={{ title: "Create Lesson" }} />
      <Tab.Screen name="ChatList" component={ChatListScreen} options={{ title: "Chat" }} />
      <Tab.Screen
        name="MyPage"
        component={MyPageNavigator}
        options={{ headerShown: false, title: "My Page" }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Login">
        <RootStack.Screen name="Login" component={LoginScreenWrapper} options={{ title: "Login" }} />
        <RootStack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
        <RootStack.Screen name="FindId" component={FindIdScreen} options={{ title: "Find ID" }} />
        <RootStack.Screen
          name="FindPassword"
          component={FindPasswordScreen}
          options={{ title: "Find Password" }}
        />

        <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

        <RootStack.Screen name="CategoryLesson" component={CategoryLessonScreen} options={{ title: "Category" }} />
        <RootStack.Screen name="LessonDetail" component={LessonDetailScreen} options={{ title: "Lesson Detail" }} />
        <RootStack.Screen
          name="AIChatbot"
          component={AIChatbotScreen}
          options={{ presentation: "transparentModal", headerShown: false }}
        />
        <RootStack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
        <RootStack.Screen name="ReviewWrite" component={ReviewWriteScreen} options={{ title: "Write Review" }} />
        <RootStack.Screen name="Intro" component={IntroScreen} options={{ title: "Intro" }} />
        <RootStack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function LoginScreenWrapper(props) {
  const { navigation } = props;

  useEffect(() => {
    const check = async () => {
      const refresh = await getRefreshToken();
      if (refresh) {
        navigation.replace("MainTabs");
      }
    };
    check();
  }, [navigation]);

  return <LoginScreen {...props} />;
}
