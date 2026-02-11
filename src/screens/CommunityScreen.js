// screens/CommunityScreen.js
import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
} from "react-native";

import { FEED_DATA } from "../mock/feedData";
import { currentUser } from "../utils/auth";

import FeedHeader from "../components/FeedHeader";
import PostCard from "../components/PostCard";
import PostDetailScreen from "./PostDetailScreen";
import AddPostScreen from "./AddPostScreen";

export default function CommunityScreen({ onBack }) {
  const [posts, setPosts] = useState(FEED_DATA);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAddPost, setShowAddPost] = useState(false);
  const [activeTab, setActiveTab] = useState("feed"); // feed | fav

  // ➕ เพิ่มโพสต์
  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab("feed");
  };

  // ❤️ Like / Unlike
  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;

        const isLiked = post.likes.includes(currentUser.id);

        return {
          ...post,
          likes: isLiked
            ? post.likes.filter((id) => id !== currentUser.id)
            : [...post.likes, currentUser.id],
        };
      })
    );
  };

  // 💬 Comment
  const addComment = (postId, text) => {
    if (!text.trim()) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: Date.now().toString(),
                  user: currentUser.name,
                  avatar:
                    currentUser.avatar ||
                    "https://placekitten.com/80/80",
                  text,
                  createdAt: Date.now(),
                  likes: [],
                },
              ],
            }
          : post
      )
    );
  };

  // ⭐ fav posts
  const favPosts = useMemo(
    () => posts.filter((p) => p.likes.includes(currentUser.id)),
    [posts]
  );

  const displayPosts = activeTab === "feed" ? posts : favPosts;

  // ➕ หน้าเพิ่มโพสต์
  if (showAddPost) {
    return (
      <AddPostScreen
        onClose={() => setShowAddPost(false)}
        onSubmit={(newPost) => {
          addPost(newPost);
          setShowAddPost(false);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FeedHeader
          title="Community"
          onBack={onBack}
          onAddPost={() => setShowAddPost(true)}
        />

        {/* 🔀 TOP TAB */}
        <View style={styles.tabBar}>
          <TabButton
            title="Feed"
            active={activeTab === "feed"}
            onPress={() => setActiveTab("feed")}
          />
          <TabButton
            title="Favorites"
            active={activeTab === "fav"}
            onPress={() => setActiveTab("fav")}
          />
        </View>

        <FlatList
          data={displayPosts}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            activeTab === "fav" ? (
              <Text style={styles.emptyText}>
                ยังไม่มีโพสต์ที่ถูกใจ 🐾
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={toggleLike}
              onOpen={() => setSelectedPost(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />

        {/* 🔍 Post Detail */}
        {selectedPost && (
          <PostDetailScreen
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onAddComment={addComment}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* 🔘 Tab Button */
function TabButton({ title, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4FAF9",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F4FAF9",
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#EAF6F3",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#2FB7A6",
  },
  tabText: {
    fontSize: 14,
    color: "#6B7C7A",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#8FA8A4",
  },
});
