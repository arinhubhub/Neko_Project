import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currentUser } from "../utils/auth";

export default function AddPostScreen({ onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");

  const handlePost = () => {
    if (!text.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      user: currentUser,
      content: text,
      image: image || null,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    };

    onSubmit(newPost);
    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} />
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity onPress={handlePost}>
          <Text style={styles.postBtn}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <TextInput
        placeholder="What's going on with your cat?"
        value={text}
        onChangeText={setText}
        multiline
        style={styles.input}
      />

      {/* Image URL (แทนเลือกภาพจริงก่อน) */}
      <TextInput
        placeholder="Image URL (optional)"
        value={image}
        onChangeText={setImage}
        style={styles.imageInput}
      />

      {image ? (
        <Image source={{ uri: image }} style={styles.preview} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAF9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  postBtn: {
    color: "#1BAA9A",
    fontWeight: "600",
  },
  input: {
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  imageInput: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  preview: {
    margin: 16,
    height: 220,
    borderRadius: 16,
  },
});
