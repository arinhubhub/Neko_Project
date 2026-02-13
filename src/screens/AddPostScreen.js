import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currentUser } from "../utils/auth";

import * as ImagePicker from 'expo-image-picker';

export default function AddPostScreen({ onClose, onSubmit, initialPost, userProfile }) {
  const [text, setText] = useState(initialPost ? initialPost.content : "");
  const [image, setImage] = useState(initialPost ? initialPost.image : "");

  const isEditing = !!initialPost;

  // Resolve User Data (Priority: InitialPost > UserProfile > CurrentUser)
  const displayUser = {
    name: initialPost?.user?.name || userProfile?.name || currentUser.name,
    avatar: initialPost?.user?.avatar || userProfile?.avatar_url || currentUser.avatar || "https://placekitten.com/50/50"
  };

  const handlePost = () => {
    if (!text.trim()) return;

    const newPost = {
      id: initialPost ? initialPost.id : Date.now().toString(), // Keep old ID if editing
      user: {
        id: currentUser.id,
        name: displayUser.name,
        avatar: displayUser.avatar,
      },
      content: text,
      image: image || null,
      likes: initialPost ? initialPost.likes : [],
      comments: initialPost ? initialPost.comments : [],
      createdAt: initialPost ? initialPost.createdAt : Date.now(),
    };

    onSubmit(newPost);
    onClose();
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed Top */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#546E7A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? "Edit Post" : "Create Post"}</Text>
        <TouchableOpacity onPress={handlePost} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>{isEditing ? "Update" : "Post"}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info (Mock) */}
          <View style={styles.userInfo}>
            <Image source={{ uri: displayUser.avatar }} style={styles.avatar} />
            <Text style={styles.userName}>{displayUser.name}</Text>
          </View>

          {/* Text Input */}
          <TextInput
            placeholder="What's making you happy today?"
            placeholderTextColor="#B0BEC5"
            value={text}
            onChangeText={setText}
            multiline
            scrollEnabled={false} // Let parent ScrollView handle scrolling
            style={styles.textInput}
          />

          {/* Image Preview Area */}
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage("")}>
                <Ionicons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Added spacer for bottom toolbar visibility when scrolling */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Toolbar (Bottom) */}
        <TouchableOpacity style={styles.toolbar} onPress={pickImage} activeOpacity={0.8}>
          <View style={styles.imagePickerBtn}>
            <Ionicons name="images" size={24} color="#26A69A" />
            <Text style={styles.imagePickerText}>Add Photo from Gallery</Text>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAF9", // NekoCare Signature Soft Mint
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16, // Reduced from 20
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,105,92,0.05)",
    backgroundColor: "#F4FAF9",
    zIndex: 10,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  headerTitle: {
    fontSize: 16, // Reduced from 18
    fontFamily: "Inter-SemiBold",
    color: "#37474F",
    letterSpacing: 0.5,
  },
  submitBtn: {
    backgroundColor: "#26A69A",
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 16, // Reduced from 20
    borderRadius: 20, // Reduced from 24
    shadowColor: "#00695C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
    fontSize: 13, // Reduced from 14
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16, // Reduced from 24
    paddingTop: 16, // Reduced from 24
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16, // Reduced from 20
  },
  avatar: {
    width: 40, // Reduced from 48
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#B2DFDB",
  },
  userName: {
    fontSize: 15, // Reduced from 16
    fontFamily: "Inter-Bold",
    color: "#455A64",
  },

  textInput: {
    fontSize: 16, // Reduced from 20
    fontFamily: "Inter-Regular",
    color: "#37474F",
    textAlignVertical: "top",
    minHeight: 100, // Reduced from 120
    lineHeight: 24,
  },

  // Image Preview
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: '100%',
    height: 220, // Reduced from 280
    borderRadius: 16,
    backgroundColor: "#E0F2F1",
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 2,
  },

  // Bottom Toolbar
  toolbar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12, // Reduced from 16
    paddingHorizontal: 16, // Reduced from 24
    borderTopLeftRadius: 24, // Reduced from 32
    borderTopRightRadius: 24,
    shadowColor: "#004D40",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  imagePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4FAF9",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B2DFDB",
    borderStyle: "dashed",
  },
  imagePickerText: {
    fontSize: 14, // Reduced from 16
    fontFamily: "Inter-SemiBold",
    color: "#26A69A",
    marginLeft: 8,
  },
});
