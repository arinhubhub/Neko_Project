import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currentUser } from "../utils/auth";

export default function PostCard({ post, onLike, onOpen }) {
  const isLiked = post.likes.includes(currentUser.id);

  return (
    <View style={styles.card}>
      <Text style={styles.user}>{post.user.name}</Text>

      <Text style={styles.content}>{post.content}</Text>

      {post.image && (
        <Image source={{ uri: post.image }} style={styles.image} />
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onLike(post.id)}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#1BAA9A" : "#777"}
          />
        </TouchableOpacity>

        {/* 💬 กดเข้า comment */}
        <TouchableOpacity onPress={onOpen}>
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color="#777"
          />
        </TouchableOpacity>

        <Text style={styles.count}>
          {post.likes.length} likes · {post.comments.length} comments
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
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
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  count: {
    marginLeft: 8,
    color: "#777",
    fontSize: 12,
  },
});
