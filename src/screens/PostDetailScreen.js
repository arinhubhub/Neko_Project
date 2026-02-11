import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const formatTime = (time) => {
  if (!time || isNaN(time)) return "now";
  const diff = Math.floor((Date.now() - time) / 60000);
  if (diff < 1) return "now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

export default function PostDetailScreen({
  post,
  onClose,
  onAddComment,
}) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    setComments(
      (post.comments || []).map((c) => ({
        ...c,
        likes: c.likes || [],
        createdAt: c.createdAt || Date.now(),
      }))
    );
  }, [post]);

  const handleSend = () => {
    if (!text.trim()) return;

    onAddComment(post.id, text);

    setComments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: "You",
        avatar: "https://placekitten.com/80/80",
        text,
        createdAt: Date.now(),
        likes: [],
      },
    ]);

    setText("");
  };

  const toggleLikeComment = (id) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              likes: c.likes.includes("me")
                ? c.likes.filter((l) => l !== "me")
                : [...c.likes, "me"],
            }
          : c
      )
    );
  };

  const deleteComment = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Modal visible animationType="slide">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="chevron-down" size={28} />
              </TouchableOpacity>
              <Text style={styles.title}>Post</Text>
            </View>

            {/* Post */}
            <View style={styles.postCard}>
              <Text style={styles.user}>{post.user.name}</Text>
              <Text style={styles.content}>{post.content}</Text>
              {post.image && (
                <Image source={{ uri: post.image }} style={styles.image} />
              )}
            </View>

            {/* Comments */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentList}
              renderItem={({ item }) => {
                const liked = item.likes.includes("me");

                return (
                  <View style={styles.comment}>
                    <Image
                      source={{ uri: item.avatar }}
                      style={styles.avatar}
                    />

                    <View style={styles.commentBody}>
                      <View style={styles.row}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.time}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>

                      <Text style={styles.commentText}>{item.text}</Text>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() => toggleLikeComment(item.id)}
                        >
                          <Ionicons
                            name={liked ? "heart" : "heart-outline"}
                            size={16}
                            color={liked ? "#1BAA9A" : "#999"}
                          />
                        </TouchableOpacity>

                        <Text style={styles.likeCount}>
                          {item.likes.length}
                        </Text>

                        {item.user === "You" && (
                          <TouchableOpacity
                            onPress={() => deleteComment(item.id)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#999"
                              style={{ marginLeft: 12 }}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Add a comment..."
                style={styles.input}
              />
              <TouchableOpacity onPress={handleSend}>
                <Ionicons name="send" size={22} color="#1BAA9A" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAF9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },

  postCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 14,
    borderRadius: 16,
  },
  user: {
    fontWeight: "600",
    color: "#1BAA9A",
    marginBottom: 6,
  },
  content: {
    color: "#333",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },

  commentList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  comment: {
    flexDirection: "row",
    marginBottom: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentUser: {
    fontWeight: "600",
    color: "#1BAA9A",
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    color: "#333",
    marginVertical: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  likeCount: {
    marginLeft: 6,
    color: "#999",
    fontSize: 12,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    marginRight: 8,
    padding: 10,
    backgroundColor: "#F1F1F1",
    borderRadius: 20,
  },
});
