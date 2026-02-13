import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
const { width } = Dimensions.get('window');

export default function PostCard({ post, onLike, onOpen, onMore, currentUserId }) {
  const isLiked = post.likes.includes(currentUserId);
  const timeAgo = new Date(post.createdAt).toLocaleDateString(); // Simple date format

  return (
    <View style={styles.cardContainer}>
      {/* Header: Avatar + Name */}
      <View style={styles.header}>
        <Image
          source={{ uri: post.user.avatar || "https://placekitten.com/50/50" }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{post.user.name}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        <TouchableOpacity style={styles.moreBtn} onPress={() => onMore && onMore(post)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#B0BEC5" />
        </TouchableOpacity>
      </View>

      {/* Content: Text + Image */}
      <View style={styles.contentBody}>
        <Text style={styles.contentText}>{post.content}</Text>
        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
        )}
      </View>

      {/* Footer: Actions */}
      <View style={styles.footer}>

        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={() => onLike(post.id)} style={styles.actionBtn}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#E57373" : "#546E7A"}
            />
            <Text style={[styles.actionText, isLiked && { color: "#E57373" }]}>
              {post.likes.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpen} style={styles.actionBtn}>
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color="#546E7A"
            />
            <Text style={styles.actionText}>
              {post.comments.length}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    padding: 16,
    // Soft Shadow
    shadowColor: "#90A4AE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Header
  header: {
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
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold", // Make sure fonts are loaded
    color: "#263238",
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#90A4AE",
    marginTop: 2,
  },
  moreBtn: {
    padding: 4,
  },

  // Content
  contentBody: {
    marginBottom: 12,
  },
  contentText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#37474F",
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },

  // Footer
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
});
