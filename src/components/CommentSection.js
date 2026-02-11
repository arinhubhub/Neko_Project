import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function CommentSection({
  postId,
  comments,
  onAddComment,
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onAddComment(postId, text);
    setText("");
  };

  return (
    <View style={styles.container}>
      {comments.map((c) => (
        <Text key={c.id} style={styles.comment}>
          <Text style={styles.commentUser}>{c.user}</Text> {c.text}
        </Text>
      ))}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity onPress={submit} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  comment: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: "600",
    color: "#111827",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 13,
  },
  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sendText: {
    color: "#10B981",
    fontWeight: "600",
  },
});
