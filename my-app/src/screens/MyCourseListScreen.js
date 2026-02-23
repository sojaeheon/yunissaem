import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/axiosInstance";
import { SERVER_BASE } from "../config/config";

const LIST_CONFIG = {
  MyLessonsOngoing: {
    title: "수강중 강의",
    endpoint: "/courses/enrolled/",
  },
  MyLessonsCompleted: {
    title: "수강했던 강의",
    endpoint: "/courses/completed/",
  },
  MyLessonsFavorite: {
    title: "찜한 강의",
    endpoint: "/courses/wished/",
  },
  MyLessonsCreated: {
    title: "개설한 강의",
    endpoint: "/courses/tutor/current/",
  },
  MyLessonsPastCreated: {
    title: "개설했던 강의",
    endpoint: "/courses/tutor/past/",
  },
};

function normalizeItem(item, index) {
  const courseId = item.course_id ?? item.id ?? null;
  const thumbnailRaw = item.thumbnail_image_url ?? "";
  const thumbnail =
    typeof thumbnailRaw === "string" && thumbnailRaw.startsWith("/")
      ? SERVER_BASE + thumbnailRaw
      : thumbnailRaw;

  return {
    key: String(item.enrollment_id ?? item.wish_id ?? courseId ?? `row-${index}`),
    courseId,
    title: item.title ?? "제목 없음",
    tutorName: item.tutor_name ?? "",
    categoryName: item.category_name ?? "",
    thumbnail,
  };
}

export default function MyCourseListScreen({ navigation, route }) {
  const config = useMemo(
    () => LIST_CONFIG[route.name] ?? { title: "강의 목록", endpoint: null },
    [route.name]
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const fetchItems = useCallback(
    async (isRefresh = false) => {
      if (!config.endpoint) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorText("");

      try {
        const res = await api.get(config.endpoint);
        const payload = Array.isArray(res.data) ? res.data : [];
        setItems(payload.map((item, index) => normalizeItem(item, index)));
      } catch (error) {
        console.error("my course list fetch error:", error.response?.data || error);
        setErrorText("목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [config.endpoint]
  );

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: config.title });
      fetchItems();
    }, [config.title, fetchItems, navigation])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchItems(true)} />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.listWrap}
        ListEmptyComponent={<Text style={styles.emptyText}>표시할 강의가 없습니다.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("LessonDetail", {
                lessonId: item.courseId,
                lesson: {
                  id: item.courseId,
                  title: item.title,
                  tutor_name: item.tutorName,
                  category_name: item.categoryName,
                  thumbnail: item.thumbnail,
                },
              })
            }
          >
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                <Text style={styles.thumbnailFallbackText}>No Image</Text>
              </View>
            )}

            <View style={styles.metaWrap}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.tutorName || "튜터 정보 없음"}
              </Text>
              {item.categoryName ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.categoryName}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listWrap: {
    padding: 14,
    paddingBottom: 24,
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "#777",
  },
  errorText: {
    color: "#b00020",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
    padding: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: 82,
    height: 82,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  thumbnailFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailFallbackText: {
    fontSize: 11,
    color: "#666",
  },
  metaWrap: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
});
