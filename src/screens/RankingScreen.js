import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import supabase from "./config/supabaseClient";

const { width } = Dimensions.get("window");
const FRIENDS_KEY = "neko_friends_list";

export default function RankingScreen({ session, onBack }) {
  const [myProfile, setMyProfile] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [friends, setFriends] = useState([]); // { id, name, score }
  const [loading, setLoading] = useState(true);

  // Add Friend Modal
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // ─── Load Data ───
  useEffect(() => {
    loadAll();
  }, [session]);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadMyProfile(), loadFriends()]);
    } catch (e) {
      console.log("loadAll error:", e);
    }
    setLoading(false);
  };

  const loadMyProfile = async () => {
    try {
      // ถ้ามี session → ดึงจาก Supabase
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        console.log("Profile data:", data, "Error:", error);

        if (data) {
          setMyProfile({
            id: data.id,
            name: data.name || session.user.email?.split("@")[0] || "Me",
          });
          const score = await calcScore(data.id);
          setMyScore(score);
          return;
        }
      }

      // Fallback: ใช้ข้อมูลจาก session โดยตรง
      if (session?.user) {
        setMyProfile({
          id: session.user.id,
          name: session.user.email?.split("@")[0] || "Me",
          avatar_url: null,
        });
        const score = await calcScore(session.user.id);
        setMyScore(score);
      }
    } catch (e) {
      console.log("Error loading profile:", e);
      // Fallback สุดท้าย
      if (session?.user) {
        setMyProfile({
          id: session.user.id,
          name: session.user.email?.split("@")[0] || "Me",
        });
      }
    }
  };

  const [pendingRequests, setPendingRequests] = useState([]);

  const loadFriends = async () => {
    try {
      if (!session?.user?.id) return;

      // 1. Get friend IDs (only accepted)
      const { data: friendRows, error: friendError } = await supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", session.user.id)
        .eq("status", "accepted");

      if (friendError) throw friendError;

      const friendIds = friendRows ? friendRows.map((f) => f.friend_id) : [];

      // 2. Fetch profiles and calculate scores for accepted friends
      if (friendIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", friendIds);

        if (profileError) throw profileError;

        if (profiles) {
          const withScores = await Promise.all(
            profiles.map(async (f) => ({
              ...f,
              score: await calcScore(f.id),
              status: 'accepted'
            }))
          );
          setFriends(withScores);
        }
      } else {
        setFriends([]);
      }

      // 3. Fetch Pending Requests (where current user is the friend_id)
      const { data: incoming, error: incomingError } = await supabase
        .from("friends")
        .select(`
          user_id,
          profiles:user_id (id, name)
        `)
        .eq("friend_id", session.user.id)
        .eq("status", "pending");

      if (incomingError) throw incomingError;

      if (incoming) {
        const pending = incoming
          .filter(req => req.profiles) // Safety check: ensure profile exists
          .map(req => ({
            id: req.profiles.id,
            name: req.profiles.name || "Neko User",
          }));
        setPendingRequests(pending);
      }

    } catch (e) {
      console.log("Error loading friends:", e);
    }
  };

  // ─── Score Calculation ───
  // Log Daily = 1pt, Assessment = 2pt, Upload Photo = 3pt
  const calcScore = async (userId) => {
    let score = 0;
    try {
      // 1) Get cats owned by this user
      const { data: cats } = await supabase
        .from("cats")
        .select("id")
        .eq("owner_id", userId);

      const catIds = cats ? cats.map((c) => c.id) : [];

      // 2) Count daily_logs (1pt each)
      if (catIds.length > 0) {
        const { count: logCount } = await supabase
          .from("daily_logs")
          .select("id", { count: "exact", head: true })
          .in("cat_id", catIds);
        score += (logCount || 0) * 1;
      }

      // 3) Count assessments (2pt each) — ถ้ามี table
      try {
        const { count: assessCount } = await supabase
          .from("assessments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        score += (assessCount || 0) * 2;
      } catch { }

      // 4) Count assessments with image (3pt each) — ถ้ามี table
      try {
        const { count: photoCount } = await supabase
          .from("assessments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .not("image_url", "is", null);
        score += (photoCount || 0) * 3;
      } catch { }
    } catch (e) {
      console.log("Score calc error:", e);
    }
    return score;
  };

  // ─── Combined Ranking ───
  const getRanking = () => {
    const all = [];
    if (myProfile) {
      all.push({ ...myProfile, score: myScore, isMe: true });
    } else if (session?.user) {
      // Emergency fallback if profile hasn't loaded yet
      all.push({
        id: session.user.id,
        name: session.user.email?.split("@")[0] || "You",
        score: myScore,
        isMe: true
      });
    }

    friends.forEach((f) => {
      // Avoid duplicates if friend happens to be the same ID
      if (myProfile && f.id === myProfile.id) return;
      all.push({ ...f, isMe: false });
    });
    return all.sort((a, b) => b.score - a.score);
  };

  const getMyRank = () => {
    const ranking = getRanking();
    const idx = ranking.findIndex((r) => r.isMe);
    return idx >= 0 ? idx + 1 : "-";
  };

  // ─── Add Friend ───
  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchResults([]); // Clear old results
    try {
      const query = searchText.trim();
      console.log("Searching for:", query);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq("id", session?.user?.id) // Exclude myself
        .limit(10);

      if (error) {
        console.log("Search Query Error:", error);
        Alert.alert("Search Error", "Database Error: " + error.message);
      } else {
        console.log("Search Result Data:", data);
        if (data && data.length > 0) {
          setSearchResults(data);
        } else {
          Alert.alert(
            "Not Found",
            `No user found with the name or email: "${query}"\n\nTips:\n1. Check if you typed it correctly.\n2. Try searching for their FULL email address.\n3. Make sure your friend has already signed up.`
          );
        }
      }
    } catch (e) {
      console.log("Search Exception:", e);
      Alert.alert("Search App Error", e.message);
    }
    setSearching(false);
  };

  const acceptFriend = async (requestorId) => {
    try {
      // 1. Update the incoming request to 'accepted'
      const { error: updateError } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .match({ user_id: requestorId, friend_id: session.user.id });

      if (updateError) throw updateError;

      // 2. Create the reciprocal friendship record (Self -> Requestor)
      // Use upsert to handle case where user might have already sent a request back
      const { error: insertError } = await supabase
        .from("friends")
        .upsert({
          user_id: session.user.id,
          friend_id: requestorId,
          status: "accepted"
        });

      if (insertError) throw insertError;

      Alert.alert("Success! 🎉", "You are now friends!");
      loadFriends(); // Refresh lists
    } catch (e) {
      console.log("Accept error:", e);
      Alert.alert("Error", "Could not accept request.");
    }
  };

  const rejectFriend = async (requestorId) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .match({ user_id: requestorId, friend_id: session.user.id });

      if (error) throw error;
      setPendingRequests(prev => prev.filter(r => r.id !== requestorId));
    } catch (e) {
      console.log("Reject error:", e);
    }
  };

  const addFriend = async (profile) => {
    try {
      if (!session?.user?.id) return;

      // Send Friend Request (User -> Friend, status: pending)
      const { error } = await supabase
        .from("friends")
        .insert({
          user_id: session.user.id,
          friend_id: profile.id,
          status: "pending"
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Already Sent", `You have already sent a request to ${profile.name}.`);
        } else {
          throw error;
        }
        return;
      }

      Alert.alert("Request Sent! 🐾", `Wait for ${profile.name} to approve.`);
      setShowAddFriend(false);
      setSearchText("");
      setSearchResults([]);
    } catch (e) {
      console.log("Add friend error:", e);
      Alert.alert("Error", "Could not send request.");
    }
  };

  // ─── Rank Badge ───
  const RankBadge = ({ rank }) => {
    if (rank === 1) return <Text style={styles.rankMedal}>🥇</Text>;
    if (rank === 2) return <Text style={styles.rankMedal}>🥈</Text>;
    if (rank === 3) return <Text style={styles.rankMedal}>🥉</Text>;
    return <Text style={styles.rankNumber}>#{rank}</Text>;
  };

  const ranking = getRanking();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#E0F2F1", "#F4FAF9", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#37474F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ranking</Text>
          <TouchableOpacity
            onPress={() => setShowAddFriend(true)}
            style={styles.addBtn}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4DB6AC" />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : (
            <View style={styles.listContent}>
              {/* My Profile Card */}
              {myProfile && (
                <LinearGradient
                  colors={["#80CBC4", "#4DB6AC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.myCard}
                >
                  <View style={styles.myCardContent}>
                    <Image
                      source={{
                        uri: "https://placekitten.com/80/80",
                      }}
                      style={styles.myAvatar}
                    />
                    <View style={styles.myInfo}>
                      <Text style={styles.myName}>{myProfile.name}</Text>
                      <Text style={styles.myLabel}>My Score</Text>
                    </View>
                    <View style={styles.myScoreBox}>
                      <Text style={styles.myScoreNumber}>{myScore}</Text>
                      <Text style={styles.myScoreLabel}>pts</Text>
                    </View>
                  </View>
                  <View style={styles.myRankStrip}>
                    <Ionicons name="trophy" size={14} color="#FFD54F" />
                    <Text style={styles.myRankText}>
                      Rank #{getMyRank()} of {ranking.length} users
                    </Text>
                  </View>
                </LinearGradient>
              )}

              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <View style={styles.sectionDivider}>
                    <Ionicons name="notifications" size={16} color="#FF7043" />
                    <Text style={[styles.sectionTitle, { color: "#FF7043" }]}>
                      Incoming Requests ({pendingRequests.length})
                    </Text>
                  </View>
                  {pendingRequests.map((req) => (
                    <View key={req.id} style={styles.rankCard}>
                      <Image
                        source={{ uri: "https://placekitten.com/40/40" }}
                        style={styles.rankAvatar}
                      />
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName}>{req.name}</Text>
                        <Text style={{ color: "#666", fontSize: 12 }}>want to be friends</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          onPress={() => acceptFriend(req.id)}
                          style={[styles.actionBtn, { backgroundColor: '#4DB6AC', marginRight: 8, padding: 6, borderRadius: 6 }]}
                        >
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => rejectFriend(req.id)}
                          style={[styles.actionBtn, { backgroundColor: '#FF8A65', padding: 6, borderRadius: 6 }]}
                        >
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Leaderboard Section */}
              <View style={styles.sectionDivider}>
                <Ionicons name="people" size={16} color="#90A4AE" />
                <Text style={styles.sectionTitle}>
                  Leaderboard ({ranking.length})
                </Text>
              </View>

              {ranking.map((item, index) => {
                const rank = index + 1;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.rankCard,
                      item.isMe && styles.rankCardMe,
                      rank <= 3 && styles.rankCardTop,
                    ]}
                  >
                    <RankBadge rank={rank} />
                    <Image
                      source={{
                        uri: "https://placekitten.com/50/50",
                      }}
                      style={[
                        styles.rankAvatar,
                        rank <= 3 && styles.rankAvatarTop,
                      ]}
                    />
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName}>
                        {item.isMe ? "You" : item.name}
                      </Text>
                      <View style={styles.scoreRow}>
                        <Ionicons name="star" size={12} color="#FFB74D" />
                        <Text style={styles.rankScore}>{item.score} pts</Text>
                      </View>
                    </View>
                    {rank <= 3 && (
                      <View
                        style={[
                          styles.topBadge,
                          rank === 1 && { backgroundColor: "#FFD54F" },
                          rank === 2 && { backgroundColor: "#B0BEC5" },
                          rank === 3 && { backgroundColor: "#FFAB91" },
                        ]}
                      >
                        <Text style={styles.topBadgeText}>TOP {rank}</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Small Empty State - Only show if no friends were found */}
              {friends.length === 0 && (
                <View style={styles.emptyStateMini}>
                  <Text style={styles.emptySubMini}>
                    Tap + to add friends and compare rankings
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ─── Add Friend Modal ─── */}
        <Modal
          visible={showAddFriend}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddFriend(false);
                  setSearchText("");
                  setSearchResults([]);
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#90A4AE" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#90A4AE" />
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Type friend's name to search..."
                  placeholderTextColor="#B0BEC5"
                  style={styles.searchInput}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText("");
                      setSearchResults([]);
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color="#CFD8DC"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={handleSearch}
                style={styles.searchBtn}
              >
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searching ? (
              <ActivityIndicator
                size="large"
                color="#4DB6AC"
                style={{ marginTop: 40 }}
              />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                  searchText.length > 0 && searchResults.length === 0 ? (
                    <View style={styles.noResult}>
                      <Ionicons
                        name="search-outline"
                        size={40}
                        color="#CFD8DC"
                      />
                      <Text style={styles.noResultText}>
                        No user found for "{searchText}"
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.noResult}>
                      <Ionicons
                        name="people-outline"
                        size={48}
                        color="#E0E0E0"
                      />
                      <Text style={styles.noResultText}>
                        Search for friends by name
                      </Text>
                    </View>
                  )
                }
                renderItem={({ item }) => {
                  const isAlready = friends.some((f) => f.id === item.id);
                  return (
                    <View style={styles.resultCard}>
                      <Image
                        source={{
                          uri: "https://placekitten.com/50/50",
                        }}
                        style={styles.resultAvatar}
                      />
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{item.name}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => addFriend(item)}
                        style={[
                          styles.resultAddBtn,
                          isAlready && styles.resultAddBtnDone,
                        ]}
                        disabled={isAlready}
                      >
                        <Ionicons
                          name={isAlready ? "checkmark" : "person-add"}
                          size={16}
                          color={isAlready ? "#4DB6AC" : "#FFFFFF"}
                        />
                        <Text
                          style={[
                            styles.resultAddText,
                            isAlready && styles.resultAddTextDone,
                          ]}
                        >
                          {isAlready ? "Added" : "Add"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
    color: "#37474F",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#4DB6AC",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#00796B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // ─── Loading ───
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#90A4AE",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // ─── My Profile Card ───
  myCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    elevation: 5,
    shadowColor: "#004D40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  myCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  myAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  myInfo: {
    flex: 1,
    marginLeft: 14,
  },
  myName: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
  myLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  myScoreBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myScoreNumber: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
  myScoreLabel: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    color: "rgba(255,255,255,0.7)",
  },
  myRankStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    gap: 6,
  },
  myRankText: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
    color: "rgba(255,255,255,0.9)",
  },

  // ─── Section Divider ───
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#90A4AE",
  },

  // ─── Empty State ───
  emptyStateMini: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(144, 164, 174, 0.05)",
    borderRadius: 12,
    marginBottom: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CFD8DC",
  },
  emptySubMini: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#90A4AE",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#546E7A",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    color: "#90A4AE",
    marginTop: 4,
    textAlign: "center",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4DB6AC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
    elevation: 3,
    shadowColor: "#00796B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },

  // ─── Rank Cards ───
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#90A4AE",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  rankCardMe: {
    borderWidth: 1.5,
    borderColor: "#B2DFDB",
    backgroundColor: "#F1F9F8",
  },
  rankCardTop: {
    elevation: 3,
    shadowOpacity: 0.12,
  },
  rankMedal: {
    fontSize: 24,
    width: 36,
    textAlign: "center",
  },
  rankNumber: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    color: "#90A4AE",
    width: 36,
    textAlign: "center",
  },
  rankAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 4,
    borderWidth: 2,
    borderColor: "#F0F0F0",
  },
  rankAvatarTop: {
    borderColor: "#E0F2F1",
    borderWidth: 2.5,
  },
  rankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rankName: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    color: "#263238",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rankScore: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    color: "#78909C",
  },
  topBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  topBadgeText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },

  // ─── Add Friend Modal ───
  modalContainer: {
    flex: 1,
    backgroundColor: "#F4FAF9",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter-SemiBold",
    color: "#37474F",
  },

  // ─── Search ───
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E0F2F1",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter-Regular",
    color: "#37474F",
  },
  searchBtn: {
    backgroundColor: "#4DB6AC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  searchBtnText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },

  // ─── Search Results ───
  noResult: {
    alignItems: "center",
    paddingTop: 60,
    opacity: 0.6,
  },
  noResultText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#90A4AE",
    marginTop: 12,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#90A4AE",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E0F2F1",
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    color: "#263238",
  },
  resultAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4DB6AC",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  resultAddBtnDone: {
    backgroundColor: "#E0F2F1",
    borderWidth: 1,
    borderColor: "#B2DFDB",
  },
  resultAddText: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  resultAddTextDone: {
    color: "#4DB6AC",
  },
});
