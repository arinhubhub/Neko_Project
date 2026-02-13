// screens/CommunityScreen.js
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { FEED_DATA } from "../mock/feedData";
import { currentUser } from "../utils/auth";
import supabase from './config/supabaseClient';

import FeedHeader from "../components/FeedHeader";
import PostCard from "../components/PostCard";
import PostDetailScreen from "./PostDetailScreen";
import AddPostScreen from "./AddPostScreen";

export default function CommunityScreen({ onBack, session, onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAddPost, setShowAddPost] = useState(false);
  const [activeTab, setActiveTab] = useState("feed"); // feed | fav

  const [userProfile, setUserProfile] = useState(null);

  // Fetch User Profile & Posts
  useEffect(() => {
    if (session?.user?.id) {
      loadAll();
    }
  }, [session]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchPosts()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) setUserProfile(data);
    } catch (e) {
      console.log("Error fetching profile:", e);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!user_id(id, name),
          likes:post_likes(user_id),
          comments:comments(
            *,
            user:profiles!user_id(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert("Feed Error", "Could not load posts: " + error.message);
        throw error;
      }

      if (data) {
        console.log("Fetched posts:", data.length);
        if (data.length === 0) {
          console.log("No posts found in database.");
        }
        // Format data to match our component expectation
        const formatted = data.map(post => ({
          ...post,
          image: post.image_url,
          createdAt: post.created_at,
          user: {
            id: post.user?.id || post.user_id,
            name: post.user?.name || (post.user_id === session?.user?.id ? userProfile?.name : null) || 'Neko Lover',
            avatar: post.user?.avatar_url || (post.user_id === session?.user?.id ? userProfile?.avatar_url : null) || "https://placekitten.com/50/50"
          },
          likes: Array.isArray(post.likes) ? post.likes.map(l => l.user_id) : [],
          comments: (post.comments || []).map(comment => ({
            ...comment,
            createdAt: comment.created_at,
            user: comment.user?.name || 'User',
            avatar: comment.user?.avatar_url || "https://placekitten.com/40/40"
          })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        }));
        setPosts(formatted);
      }
    } catch (e) {
      console.log("Error fetching posts:", e);
      Alert.alert("Render Error", "App crashed while displaying feed: " + e.message);
    }
  };

  const [optionPost, setOptionPost] = useState(null); // Post ที่กำลังกดปุ่ม 3 จุด
  const [editingPost, setEditingPost] = useState(null); // Post ที่กำลังจะแก้ไข

  const uploadImage = async (uri) => {
    if (!uri || uri.startsWith('http')) return uri; // Already uploaded or empty

    try {
      const fileName = `${session.user.id}_${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, blob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;
      if (!data) throw new Error("Storage upload failed - no data returned");

      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (e) {
      console.log("Upload error:", e);
      Alert.alert("Upload Error", e.message || "Failed to upload image. Please check your internet or bucket settings.");
      return null;
    }
  };

  // ➕ Save Post to Database
  const handleSavePost = async (postData) => {
    try {
      setLoading(true);
      const uploadedImageUrl = await uploadImage(postData.image);

      const payload = {
        user_id: session.user.id,
        content: postData.content,
        image_url: uploadedImageUrl,
      };

      let result;
      if (editingPost) {
        result = await supabase
          .from('posts')
          .update(payload)
          .eq('id', editingPost.id);
      } else {
        result = await supabase
          .from('posts')
          .insert(payload);
      }

      if (result.error) throw result.error;

      await fetchPosts(); // Refresh feed
      setActiveTab("feed");
      setEditingPost(null);
      Alert.alert("Success", "Post shared successfully! 🎉");
    } catch (e) {
      console.log("Save post error:", e);
      Alert.alert("Post Error", e.message || "Could not save post. Please check your data or permissions.");
    } finally {
      setLoading(false);
    }
  };

  // ❤️ Like / Unlike
  // ❤️ Like / Unlike Sync
  const toggleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(session.user.id);

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: postId, user_id: session.user.id });
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: session.user.id });
      }

      // Optimistic Update or Refresh
      await fetchPosts();
    } catch (e) {
      console.log("Like error:", e);
    }
  };

  // 💬 Comment
  // 💬 Comment Sync
  const addComment = async (postId, text) => {
    if (!text.trim()) return;
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          content: text
        });

      if (error) throw error;
      await fetchPosts();
    } catch (e) {
      console.log("Comment error:", e);
    }
  };

  // 🗑️ Delete Comment (sync จาก PostDetailScreen)
  const deleteCommentFromPost = (postId, commentId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
            ...post,
            comments: post.comments.filter((c) => c.id !== commentId),
          }
          : post
      )
    );
  };

  // --- Actions ---
  // 🗑️ Delete Post Sync
  const handleDelete = (postId) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('posts')
              .delete()
              .eq('id', postId);

            if (error) throw error;
            setPosts(prev => prev.filter(p => p.id !== postId));
            setOptionPost(null);
          } catch (e) {
            console.log("Delete error:", e);
          }
        }
      }
    ]);
  };

  const handleHide = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setOptionPost(null);
  };

  const handleBlock = (userId) => {
    Alert.alert("Block User", "Are you sure you want to block this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () => {
          setPosts(prev => prev.filter(p => p.user.id !== userId));
          setOptionPost(null);
        }
      }
    ]);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setOptionPost(null);
    setShowAddPost(true);
  };

  // ⭐ fav posts (Client side filter for now)
  const favPosts = useMemo(
    () => posts.filter((p) => p.likes.includes(session?.user?.id)),
    [posts, session]
  );

  const displayPosts = activeTab === "feed" ? posts : favPosts;

  // ➕ หน้าเพิ่มโพสต์
  if (showAddPost) {
    return (
      <AddPostScreen
        onClose={() => {
          setShowAddPost(false);
          setEditingPost(null); // Clear editing state on close
        }}
        onSubmit={(newPost) => {
          handleSavePost(newPost);
          setShowAddPost(false);
        }}
        initialPost={editingPost}
        userProfile={userProfile}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background */}
      <View style={styles.bgDecor} />

      <FeedHeader
        title="Community"
        onBack={onBack}
        onProfile={() => onNavigate && onNavigate("UserInfo")}
      />

      {/* 🔀 Pill Tab Bar */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            onPress={() => setActiveTab("feed")}
            style={[styles.tabBtn, activeTab === "feed" && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === "feed" && styles.tabTextActive]}>Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("fav")}
            style={[styles.tabBtn, activeTab === "fav" && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === "fav" && styles.tabTextActive]}>Favorites</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchPosts}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#26A69A" style={{ marginTop: 40 }} />
          ) : activeTab === "fav" ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No favorite posts yet 🐾</Text>
              <Text style={styles.emptySub}>Like posts to see them here.</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet 🐾</Text>
              <Text style={styles.emptySub}>Be the first to share something!</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={session?.user?.id}
            onLike={toggleLike}
            onOpen={() => setSelectedPost(item)}
            onMore={(post) => setOptionPost(post)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* ➕ FAB: Floating Action Button for Add Post */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowAddPost(true)}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 🔍 Post Detail */}
      {selectedPost && (
        <PostDetailScreen
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onAddComment={addComment}
          onDeleteComment={deleteCommentFromPost}
          userProfile={userProfile}
        />
      )}

      {/* ⚙️ Options Modal (Bottom Sheet Style) */}
      <Modal
        visible={!!optionPost}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionPost(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionPost(null)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.dragHandle} />

            {optionPost && optionPost.user.id === currentUser.id ? (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={() => handleEdit(optionPost)}>
                  <Ionicons name="pencil-outline" size={24} color="#37474F" />
                  <Text style={styles.optionText}>Edit Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => handleDelete(optionPost.id)}>
                  <Ionicons name="trash-outline" size={24} color="#E57373" />
                  <Text style={[styles.optionText, { color: "#E57373" }]}>Delete Post</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={() => handleHide(optionPost?.id)}>
                  <Ionicons name="eye-off-outline" size={24} color="#37474F" />
                  <Text style={styles.optionText}>Hide Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => handleBlock(optionPost?.user.id)}>
                  <Ionicons name="ban-outline" size={24} color="#E57373" />
                  <Text style={[styles.optionText, { color: "#E57373" }]}>Block User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAF9", // NekoCare Soft Mint Background
  },
  bgDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "#E0F2F1", // Teal 50
    opacity: 0.6,
  },

  // Tab Bar
  tabContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: "#B2DFDB", // Teal 100
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#90A4AE",
  },
  tabTextActive: {
    color: "#00695C", // Teal 800
    fontFamily: "Inter-SemiBold",
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#546E7A",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#90A4AE",
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#26A69A", // Teal 400 (Neko brand color)
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: "#004D40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#37474F",
    marginLeft: 16,
  },
});
