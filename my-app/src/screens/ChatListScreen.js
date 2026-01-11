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
import api from "../utils/axiosInstance";
import { SERVER_BASE } from "../config/config";

export default function ChatListScreen({ navigation }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // 채팅방 목록 가져오기
  const fetchChatRooms = async () => {
    try {
      setError(null);
      const response = await api.get("/chat/rooms/");
      setChatRooms(response.data);
    } catch (err) {
      console.error("채팅방 목록 조회 실패:", err);
      if (err.response?.status === 401) {
        setError("로그인이 필요합니다.");
      } else {
        setError("채팅방 목록을 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 화면에 포커스될 때마다 새로고침
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchChatRooms();
    }, [])
  );

  // 당겨서 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  // 시간 포맷팅 (마지막 메시지 시간)
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // 오늘이면 시간만 표시
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // 채팅방 클릭 시 읽음 처리 후 이동
  const handleChatRoomPress = async (room) => {
    try {
      // 읽음 처리 API 호출
      await api.post(`/chat/rooms/${room.room_id}/`);
    } catch (err) {
      console.error("읽음 처리 실패:", err);
    }

    // 채팅 화면으로 이동
    navigation.navigate("Chat", {
      roomId: room.room_id,
      courseTitle: room.course_title,
      otherUserName: room.other_user_name,
      otherUserId: room.other_user_id,
    });
  };

  // 로딩 화면
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="tomato" />
        <Text style={styles.loadingText}>채팅방 목록 불러오는 중...</Text>
      </View>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchChatRooms}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 빈 목록 화면
  if (chatRooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>아직 채팅방이 없습니다</Text>
        <Text style={styles.emptySubText}>
          과외를 신청하면 튜터와 채팅할 수 있어요!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.room_id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["tomato"]}
            tintColor="tomato"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => handleChatRoomPress(item)}
            activeOpacity={0.7}
          >
            {/* 프로필 이미지 */}
            <View style={styles.profileContainer}>
              {item.other_user_profile_image ? (
                <Image
                  source={{
                    uri: item.other_user_profile_image.startsWith("http")
                      ? item.other_user_profile_image
                      : `${SERVER_BASE}${item.other_user_profile_image}`,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfile}>
                  <Text style={styles.defaultProfileText}>
                    {item.other_user_name?.charAt(0) || "?"}
                  </Text>
                </View>
              )}
            </View>

            {/* 채팅 정보 */}
            <View style={styles.chatInfo}>
              <View style={styles.topRow}>
                <Text style={styles.partnerName} numberOfLines={1}>
                  {item.other_user_name}
                </Text>
                <Text style={styles.time}>
                  {formatTime(item.last_message_time)}
                </Text>
              </View>
              <Text style={styles.courseTitle} numberOfLines={1}>
                {item.course_title}
              </Text>
              <View style={styles.bottomRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message || "메시지가 없습니다"}
                </Text>
                {item.unread_message_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {item.unread_message_count > 99
                        ? "99+"
                        : item.unread_message_count}
                    </Text>
                  </View>
                )}
              </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "tomato",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  chatItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  defaultProfile: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#ff6347",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultProfileText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  courseTitle: {
    fontSize: 13,
    color: "tomato",
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: "tomato",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
