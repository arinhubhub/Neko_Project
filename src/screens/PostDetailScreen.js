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
  StatusBar,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currentUser } from "../utils/auth";

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
  onDeleteComment,
  userProfile
}) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);
  const [friendAdded, setFriendAdded] = useState(false);

  // Resolve current user profile
  const myProfile = {
    name: userProfile?.name || currentUser.name,
    avatar: userProfile?.avatar_url || currentUser.avatar || "https://placekitten.com/80/80"
  };

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

    // Optimistic Update
    const newComment = {
      id: Date.now().toString(),
      user: myProfile.name,
      avatar: myProfile.avatar,
      text,
      createdAt: Date.now(),
      likes: [],
    };

    setComments((prev) => [...prev, newComment]);
    onAddComment(post.id, text);
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
    // Sync กลับไปที่ parent (CommunityScreen)
    if (onDeleteComment) onDeleteComment(post.id, id);
  };

  const handleAddFriend = () => {
    if (friendAdded) return;
    setFriendAdded(true);
    Alert.alert(
      "ส่งคำขอเป็นเพื่อนแล้ว! 🎉",
      `ส่งคำขอไปยัง ${post.user.name} เรียบร้อย`,
      [{ text: "ตกลง" }]
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={28} color="#546E7A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          {/* Feed-Style Post Card */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentList}
            ListHeaderComponent={
              <>
                <View style={styles.cardContainer}>
                  {/* Post Header: Avatar + Name + Add Friend */}
                  <View style={styles.postHeader}>
                    <Image
                      source={{ uri: post.user.avatar || "https://placekitten.com/50/50" }}
                      style={styles.avatar}
                    />
                    <View style={styles.headerText}>
                      <Text style={styles.userName}>{post.user.name}</Text>
                      <Text style={styles.timeAgo}>{formatTime(post.createdAt)}</Text>
                    </View>

                    {/* ปุ่ม Add Friend */}
                    {post.user.id !== currentUser.id && (
                      <TouchableOpacity
                        onPress={handleAddFriend}
                        style={[styles.addFriendBtn, friendAdded && styles.addFriendBtnDone]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={friendAdded ? "checkmark" : "person-add"}
                          size={16}
                          color={friendAdded ? "#FFFFFF" : "#00897B"}
                        />
                        <Text style={[styles.addFriendText, friendAdded && styles.addFriendTextDone]}>
                          {friendAdded ? "Sent" : "Add Friend"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Content: Text + Image */}
                  <View style={styles.contentBody}>
                    <Text style={styles.contentText}>{post.content}</Text>
                    {post.image && (
                      <Image
                        source={{ uri: post.image }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </View>

                {/* Section Divider */}
                <View style={styles.commentDivider}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#90A4AE" />
                  <Text style={styles.commentDividerText}>
                    Comments ({comments.length})
                  </Text>
                </View>
              </>
            }
            renderItem={({ item }) => {
              const liked = item.likes.includes("me");
              const isMe = item.user === myProfile.name;

              return (
                <View style={styles.commentItem}>
                  <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />

                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentUser}>{item.user}</Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>

                    <View style={styles.commentActions}>
                      <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                      <TouchableOpacity onPress={() => toggleLikeComment(item.id)} style={styles.actionLink}>
                        <Text style={[styles.commentActionText, liked && styles.activeLike]}>Like</Text>
                      </TouchableOpacity>
                      {isMe && (
                        <TouchableOpacity onPress={() => deleteComment(item.id)} style={styles.actionLink}>
                          <Text style={styles.commentActionText}>Delete</Text>
                        </TouchableOpacity>
                      )}
                      {item.likes.length > 0 && (
                        <View style={styles.likeBadge}>
                          <Ionicons name="heart" size={10} color="#FFF" />
                          <Text style={styles.likeCount}>{item.likes.length}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => toggleLikeComment(item.id)} style={styles.heartBtn}>
                    <Ionicons name={liked ? "heart" : "heart-outline"} size={16} color={liked ? "#26A69A" : "#CFD8DC"} />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CFD8DC" />
                <Text style={styles.emptyText}>No comments yet.</Text>
                <Text style={styles.emptySub}>Be the first to say something nice!</Text>
              </View>
            }
          />

          {/* Beautiful Input Area */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <Image source={{ uri: myProfile.avatar }} style={styles.inputAvatar} />
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={`Reply as ${myProfile.name}...`}
                placeholderTextColor="#B0BEC5"
                style={styles.textInput}
                multiline
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                disabled={!text.trim()}
              >
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAF9",
  },

  // ─── Header ───
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#37474F",
  },
  closeBtn: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
  },

  // ─── Feed-Style Card (เหมือน PostCard) ───
  cardContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#90A4AE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E0F2F1",
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    color: "#263238",
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#90A4AE",
    marginTop: 2,
  },

  // ─── Add Friend Button ───
  addFriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#B2DFDB",
    backgroundColor: "#F1F9F8",
  },
  addFriendBtnDone: {
    backgroundColor: "#E0F2F1",
    borderColor: "#80CBC4",
  },
  addFriendText: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    color: "#4DB6AC",
  },
  addFriendTextDone: {
    color: "#26A69A",
  },

  contentBody: {
    marginBottom: 12,
  },
  contentText: {
    fontSize: 15,
    fontFamily: "Inter-Regular",
    color: "#37474F",
    lineHeight: 24,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F7FA",
  },
  actionsLeft: {
    flexDirection: "row",
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    color: "#546E7A",
  },

  // ─── Comment Divider ───
  commentDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  commentDividerText: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
    color: "#90A4AE",
  },

  // ─── Comments ───
  commentList: {
    paddingBottom: 20,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  commentContent: {
    flex: 1,
    paddingRight: 8,
  },
  commentBubble: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    borderTopLeftRadius: 2,
    padding: 10,
    alignSelf: 'flex-start',
  },
  commentUser: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
    color: "#263238",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#37474F",
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 11,
    color: "#90A4AE",
    marginRight: 12,
  },
  actionLink: {
    marginRight: 12,
  },
  commentActionText: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    color: "#78909C",
  },
  activeLike: {
    color: "#26A69A",
  },
  heartBtn: {
    paddingTop: 10,
    paddingLeft: 4,
  },
  likeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#26A69A",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  likeCount: {
    color: "#FFF",
    fontSize: 10,
    marginLeft: 2,
    fontFamily: "Inter-Bold",
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#546E7A",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: "#90A4AE",
    marginTop: 4,
  },

  // ─── Input Area ───
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: "#ECEFF1",
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F4FAF9",
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E0F2F1",
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: "Inter-Regular",
    color: "#37474F",
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#26A69A",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
    marginRight: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "#CFD8DC",
  },
});
