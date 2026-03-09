import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import api from "../utils/axiosInstance";
import { BASE_URL } from "../config/config";
import { getAccessToken } from "../utils/tokenStorage";

function buildWebSocketUrl(roomId, token) {
  const protocol = BASE_URL.startsWith("https://") ? "wss://" : "ws://";
  const host = BASE_URL.replace(/^https?:\/\//, "");
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${protocol}${host}/ws/chat/${roomId}/${query}`;
}

function parseSocketData(raw) {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return { content: raw };
  }
}

function extractMessagePayload(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  if (parsed.content || parsed.sender || parsed.sender_id || parsed.id) {
    return parsed;
  }

  if (typeof parsed.message === "object" && parsed.message) {
    return parsed.message;
  }

  if (typeof parsed.message === "string") {
    return { ...parsed, content: parsed.message };
  }

  if (parsed.data && typeof parsed.data === "object") {
    if (typeof parsed.data.message === "string" && !parsed.data.content) {
      return { ...parsed.data, content: parsed.data.message };
    }
    if (
      parsed.data.content ||
      parsed.data.sender ||
      parsed.data.sender_id ||
      parsed.data.id
    ) {
      return parsed.data;
    }
  }

  return null;
}

function normalizeMessage(item, otherUserId) {
  if (!item) return null;

  const senderObj = typeof item.sender === "object" && item.sender ? item.sender : null;
  const senderRaw = senderObj?.id ?? item.sender_id ?? item.sender ?? null;
  const senderId = senderRaw != null && !Number.isNaN(Number(senderRaw)) ? Number(senderRaw) : null;
  const otherId =
    otherUserId != null && !Number.isNaN(Number(otherUserId)) ? Number(otherUserId) : null;

  const text = item.content ?? (typeof item.message === "string" ? item.message : "");
  if (!text) return null;

  const createdAt = item.created_at ?? item.createdAt ?? item.timestamp ?? new Date().toISOString();
  const idSeed = item.id ?? `${senderId ?? "unknown"}-${createdAt}-${text}`;

  let isMine = false;
  if (senderId != null && otherId != null) {
    isMine = senderId !== otherId;
  } else if (typeof item.is_mine === "boolean") {
    isMine = item.is_mine;
  } else if (typeof item.isMine === "boolean") {
    isMine = item.isMine;
  }

  return {
    id: String(idSeed),
    text,
    senderId,
    senderName: senderObj?.name ?? item.sender_name ?? "",
    createdAt,
    isMine,
    isPending: false,
  };
}

function upsertIncomingMessage(prev, incoming) {
  if (prev.some((message) => message.id === incoming.id)) {
    return prev;
  }

  if (incoming.isMine) {
    const pendingIndex = prev.findIndex(
      (message) => message.isPending && message.text === incoming.text
    );
    if (pendingIndex !== -1) {
      const next = [...prev];
      next[pendingIndex] = incoming;
      return next;
    }
  }

  return [...prev, incoming];
}

function formatMessageTime(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatScreen({ navigation, route }) {
  const { roomId, courseTitle, otherUserName, otherUserId } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);

  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    if (courseTitle) {
      navigation.setOptions({ title: courseTitle });
      return;
    }
    if (otherUserName) {
      navigation.setOptions({ title: otherUserName });
    }
  }, [navigation, courseTitle, otherUserName]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 60);
  };

  const closeSocket = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
    socketRef.current = null;
    setWsConnected(false);
  };

  useEffect(() => {
    const keyboardListener = Keyboard.addListener("keyboardDidShow", scrollToBottom);
    return () => keyboardListener.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      const response = await api.get(`/chat/rooms/${roomId}/messages/`);
      const normalized = Array.isArray(response.data)
        ? response.data
            .map((item) => normalizeMessage(item, otherUserId))
            .filter((item) => item !== null)
        : [];
      if (cancelled) return;
      setMessages(normalized);
      scrollToBottom();
    };

    const markAsRead = async () => {
      try {
        await api.post(`/chat/rooms/${roomId}/read/`);
      } catch (error) {
        console.error("Failed to mark chat room as read:", error);
      }
    };

    const connectWebSocket = async () => {
      try {
        const token = await getAccessToken();
        const url = buildWebSocketUrl(roomId, token);
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          if (cancelled) return;
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          if (cancelled) return;

          const parsed = parseSocketData(event.data);
          const payload = extractMessagePayload(parsed);
          const normalized = normalizeMessage(payload, otherUserId);
          if (!normalized) return;

          setMessages((prev) => upsertIncomingMessage(prev, normalized));
          scrollToBottom();
        };

        socket.onerror = (event) => {
          if (cancelled) return;
          console.error("WebSocket error:", event?.message || event);
        };

        socket.onclose = () => {
          if (cancelled) return;
          setWsConnected(false);
        };
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to connect WebSocket:", error);
        setWsConnected(false);
      }
    };

    const bootstrap = async () => {
      if (!roomId) {
        setLoadError("Room ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");
      closeSocket();

      try {
        await loadHistory();
        await markAsRead();
      } catch (error) {
        console.error("Failed to load chat history:", error);
        if (!cancelled) {
          setLoadError("Failed to load chat history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

      if (!cancelled) {
        await connectWebSocket();
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      closeSocket();
    };
  }, [roomId, otherUserId, reloadSeed]);

  const handleSendMessage = () => {
    const content = text.trim();
    if (!content) return;

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      Alert.alert("Connection error", "WebSocket is not connected.");
      return;
    }

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      text: content,
      senderId: null,
      senderName: "",
      createdAt: new Date().toISOString(),
      isMine: true,
      isPending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");
    scrollToBottom();

    try {
      socket.send(
        JSON.stringify({
          room_id: Number(roomId),
          message: content,
          content,
        })
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Send failed", "Could not send message.");
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!roomId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Room ID not found.</Text>
      </View>
    );
  }

  if (loadError && messages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setReloadSeed((value) => value + 1)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 + insets.bottom : 0}
      >
        <View style={styles.connectionBar}>
          <View
            style={[
              styles.connectionDot,
              wsConnected ? styles.connectionOnline : styles.connectionOffline,
            ]}
          />
          <Text style={styles.connectionText}>
            {wsConnected ? "Realtime connected" : "Realtime disconnected"}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.isMine ? styles.myMessage : styles.otherMessage,
              ]}
            >
              <Text style={item.isMine ? styles.myText : styles.otherText}>{item.text}</Text>
              <Text style={[styles.timeText, item.isMine ? styles.myTime : styles.otherTime]}>
                {formatMessageTime(item.createdAt)}
                {item.isPending ? "..." : ""}
              </Text>
            </View>
          )}
        />

        <View style={[styles.inputBar, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: "#444",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "tomato",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  connectionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionOnline: {
    backgroundColor: "#22c55e",
  },
  connectionOffline: {
    backgroundColor: "#ef4444",
  },
  connectionText: {
    fontSize: 12,
    color: "#666",
  },
  messageList: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "tomato",
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
    borderBottomLeftRadius: 0,
  },
  myText: {
    color: "#fff",
    fontSize: 15,
  },
  otherText: {
    color: "#111",
    fontSize: 15,
  },
  timeText: {
    marginTop: 4,
    fontSize: 11,
  },
  myTime: {
    color: "#ffe7e1",
    textAlign: "right",
  },
  otherTime: {
    color: "#888",
    textAlign: "left",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "tomato",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
