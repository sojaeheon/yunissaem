import { useState, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import api from "../utils/axiosInstance";
import { SERVER_BASE } from "../config/config";

export default function ChatListScreen({ navigation }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchChatRooms = async () => {
    try {
      setError(null);
      const response = await api.get("/chat/rooms/list/");
      setChatRooms(response.data);
    } catch (err) {
      console.error("Failed to fetch chat rooms:", err);
      if (err.response?.status === 401) {
        setError("로그인이 필요합니다.");
      } else {
        setError("채팅 목록을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchChatRooms();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  const handleChatRoomPress = async (room) => {
    try {
      await api.post(`/chat/rooms/${room.room_id}/read/`);
    } catch (err) {
      console.error("Failed to mark room as read:", err);
    }

    navigation.navigate("Chat", {
      roomId: room.room_id,
      courseTitle: room.course_title,
      otherUserName: room.other_user_name,
      otherUserId: room.other_user_id,
    });
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <View>
        <Text style={styles.headerEyebrow}>채팅함</Text>
        <Text style={styles.headerTitle}>메시지</Text>
        <Text style={styles.headerSubtitle}>{chatRooms.length}개의 대화</Text>
      </View>
    </View>
  );

  const renderRoomItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      activeOpacity={0.88}
      onPress={() => handleChatRoomPress(item)}
    >
      <View style={styles.avatarWrap}>
        {item.other_user_profile_image ? (
          <Image
            source={{
              uri: item.other_user_profile_image.startsWith("http")
                ? item.other_user_profile_image
                : `${SERVER_BASE}${item.other_user_profile_image}`,
            }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {item.other_user_name?.charAt(0) || "?"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chatMain}>
        <View style={styles.topRow}>
          <Text style={styles.partnerName} numberOfLines={1}>
            {item.other_user_name}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.last_message_time)}</Text>
        </View>

        <View style={styles.courseChip}>
          <Text style={styles.courseChipText} numberOfLines={1}>
            {item.course_title}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || "메시지가 없습니다."}
          </Text>
          {item.unread_message_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unread_message_count > 99 ? "99+" : item.unread_message_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#f25f4c" />
          <Text style={styles.statusText}>채팅 목록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.centerContent}>
          <Ionicons name="warning-outline" size={26} color="#f25f4c" />
          <Text style={styles.statusText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChatRooms}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.centerContent}>
          <Ionicons name="chatbox-ellipses-outline" size={34} color="#9ca3af" />
          <Text style={styles.emptyTitle}>아직 채팅방이 없습니다</Text>
          <Text style={styles.emptySubtitle}>과외 상세에서 채팅하기를 누르면 시작할 수 있어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.room_id.toString()}
        renderItem={renderRoomItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#f25f4c"]}
            tintColor="#f25f4c"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fc",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  headerCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerEyebrow: {
    color: "#d1d5db",
    fontSize: 12,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 4,
  },
  chatCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#111827",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f25f4c",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  chatMain: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  partnerName: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  timeText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "500",
  },
  courseChip: {
    alignSelf: "flex-start",
    backgroundColor: "#fff3ef",
    borderColor: "#ffd7cd",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
    maxWidth: "88%",
  },
  courseChipText: {
    color: "#d94832",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    color: "#4b5563",
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f25f4c",
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  statusText: {
    color: "#4b5563",
    fontSize: 15,
    marginTop: 10,
  },
  emptyTitle: {
    marginTop: 10,
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 14,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: "#f25f4c",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
