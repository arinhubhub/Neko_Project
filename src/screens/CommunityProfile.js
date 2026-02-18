import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    ActivityIndicator,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { decode } from 'base64-arraybuffer';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import supabase from './config/supabaseClient';
import PostCard from "../components/PostCard";

const { width } = Dimensions.get("window");

export default function CommunityProfile({ session, onBack, onNavigate }) {
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [friendsCount, setFriendsCount] = useState(0);

    // Bio & Cover Editing
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState("");
    const [savingBio, setSavingBio] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            loadProfileData();
        }
    }, [session]);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchProfile(),
                fetchUserPosts(),
                fetchFriendsCount()
            ]);
        } catch (e) {
            console.log("Error loading profile data:", e);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchProfile(),
                fetchUserPosts(),
                fetchFriendsCount()
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.log("Fetch Profile Error:", error);
                return;
            }

            console.log("Profile Data Fetched:", data); // Debug logging

            if (data) {
                setUserProfile(data);
                setNewBio(data.bio || "");

                // Diagnostics: Check if fields exist
                if (data.cover_url === undefined) {
                    console.log("Warning: 'cover_url' field is missing from profile data.");
                }
                if (data.avatar_url === undefined) {
                    console.log("Warning: 'avatar_url' field is missing from profile data.");
                }
            }
        } catch (e) {
            console.log("Profile Fetch Exception:", e);
        }
    };

    const fetchUserPosts = async () => {
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
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (data) {
            const formatted = data.map(post => ({
                ...post,
                image: post.image_url,
                createdAt: post.created_at,
                user: {
                    id: post.user?.id || post.user_id,
                    name: post.user?.name || userProfile?.name || 'Neko Lover',
                    avatar: post.user?.avatar_url || userProfile?.avatar_url || "https://placekitten.com/100/100"
                },
                likes: Array.isArray(post.likes) ? post.likes.map(l => l.user_id) : [],
                comments: (post.comments || []).map(comment => ({
                    ...comment,
                    createdAt: comment.created_at,
                    user: comment.user?.name || 'User',
                    avatar: comment.user?.avatar_url || "https://placekitten.com/40/40"
                })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            }));
            setUserPosts(formatted);
        }
    };

    const fetchFriendsCount = async () => {
        const { count, error } = await supabase
            .from('friends')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('status', 'accepted');
        if (count !== null) setFriendsCount(count);
    };

    const uploadImage = async (uri, bucket) => {
        if (!uri || uri.startsWith('http')) return uri;

        try {
            console.log("Preparing to upload:", uri);
            const fileName = `${session.user.id}_${Date.now()}.jpg`;

            // เพิ่มความชัวร์ในการดึงข้อมูลไฟล์
            const response = await fetch(uri);
            if (!response.ok) throw new Error("Could not fetch local image file");

            const arrayBuffer = await response.arrayBuffer();
            console.log("Actual file size to upload:", arrayBuffer.byteLength, "bytes");

            if (arrayBuffer.byteLength === 0) {
                throw new Error("File is empty (0 bytes). Please try a different photo.");
            }

            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            console.log("Successfully uploaded. Public URL:", urlData.publicUrl);
            return urlData.publicUrl;
        } catch (e) {
            console.log("Detailed Upload Error:", e);
            throw e;
        }
    };

    const pickCoverImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
                base64: true, // เพิ่มตัวนี้!!
            });

            if (!result.canceled) {
                // ส่งทั้ง URI และ Base64 ไปประมวลผล
                handleSaveImage(result.assets[0].uri, 'cover_url', result.assets[0].base64);
            }
        } catch (e) {
            console.log("Error picking cover:", e);
            Alert.alert("Error", "Could not access image library.");
        }
    };

    const pickAvatarImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true, // เพิ่มตัวนี้!!
            });

            if (!result.canceled) {
                handleSaveImage(result.assets[0].uri, 'avatar_url', result.assets[0].base64);
            }
        } catch (e) {
            console.log("Error picking avatar:", e);
            Alert.alert("Error", "Could not access image library.");
        }
    };

    const handleSaveImage = async (uri, field, base64) => {
        if (!session?.user?.id) return;

        if (field === 'cover_url') setUploadingCover(true);
        else setUploadingAvatar(true);

        try {
            let uploadedUrl = "";
            const fileName = `${session.user.id}_${Date.now()}.jpg`;

            if (base64) {
                console.log(`Uploading ${field} via Base64...`);
                // แปลง Base64 เป็น ArrayBuffer โดยตรง (ชัวร์ที่สุดเพื่อเลี่ยง 0 bytes)
                const arrayBuffer = decode(base64);

                const { data, error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(fileName, arrayBuffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('posts')
                    .getPublicUrl(fileName);

                uploadedUrl = urlData.publicUrl;
            } else {
                console.log(`Uploading ${field} via URI fallback...`);
                uploadedUrl = await uploadImage(uri, 'posts');
            }

            const { error } = await supabase
                .from('profiles')
                .update({ [field]: uploadedUrl })
                .eq('id', session.user.id);

            if (error) {
                console.log(`Database update error for ${field}:`, error);
                throw error;
            } else {
                console.log(`DB Update Success! ${field} is now:`, uploadedUrl);
                const finalUrl = `${uploadedUrl}?t=${Date.now()}`;

                setUserProfile(prev => ({
                    ...(prev || {}),
                    [field]: finalUrl
                }));

                Alert.alert("Success", "Photo updated successfully! ✨");
            }
        } catch (e) {
            console.log(`Detailed Save Error for ${field}:`, e);
            Alert.alert("Error", `Failed to save image. ${e.message}`);
        } finally {
            setUploadingCover(false);
            setUploadingAvatar(false);
        }
    };

    const handleSaveBio = async () => {
        if (!session?.user?.id) return;
        setSavingBio(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ bio: newBio })
                .eq('id', session.user.id);

            if (error) {
                if (error.code === '42703') {
                    Alert.alert(
                        "Database Column Missing",
                        "The 'bio' column is missing in your profiles table. Please check database_setup.md and run the SQL under '1.3 เพิ่มคอลัมน์ Bio'"
                    );
                } else if (error.code === '42501') {
                    Alert.alert(
                        "Permission Denied (RLS)",
                        "You don't have permission to update your profile. Please check database_setup.md and run the SQL under '1.2 สิทธิ์การแก้ไข (UPDATE Policy)'"
                    );
                } else {
                    throw error;
                }
            } else {
                setUserProfile(prev => ({ ...prev, bio: newBio }));
                setIsEditingBio(false);
            }
        } catch (e) {
            console.log("Error saving bio:", e);
            Alert.alert("Error", "Failed to update bio. Please try again.");
        } finally {
            setSavingBio(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContent}>
            {/* Cover Image */}
            <TouchableOpacity
                style={styles.coverImageContainer}
                onPress={pickCoverImage}
                disabled={uploadingCover}
                activeOpacity={0.9}
            >
                {userProfile?.cover_url && userProfile.cover_url.trim() !== "" ? (
                    <>
                        <Image
                            source={{ uri: userProfile.cover_url }}
                            style={styles.coverImage}
                            key={`img-${userProfile.cover_url}`}
                            resizeMode="cover"
                            onLoad={() => console.log("UI: Cover Image loaded successfully")}
                            onError={(e) => {
                                console.log("UI: Cover Load Error for URL:", userProfile.cover_url);
                                Alert.alert(
                                    "Image Load Error",
                                    "รูปโหลดไม่ขึ้นครับ! อาจเป็นเพราะ Bucket ไม่เป็น Public หรือ RLS บล็อกอยู่ครับ"
                                );
                            }}
                        />
                        {/* 🛠 Diagnostic Label */}
                        <View style={styles.debugLabel}>
                            <Text style={styles.debugText}>URL Status: {userProfile.cover_url.includes('supabase') ? '✅ URL Link OK' : '❌ Wrong URL'}</Text>
                        </View>
                    </>
                ) : (
                    <LinearGradient
                        colors={["#B2DFDB", "#4DB6AC"]}
                        style={styles.coverImage}
                    />
                )}

                <View style={[styles.coverOverlay, { zIndex: 10 }]}>
                    {uploadingCover ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Ionicons name="camera-outline" size={20} color="#FFF" />
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.profileInfoContainer}>
                {/* Avatar & Stats Row */}
                <View style={styles.avatarStatsRow}>
                    <TouchableOpacity
                        style={[styles.avatarWrapper, { zIndex: 5 }]}
                        onPress={pickAvatarImage}
                        disabled={uploadingAvatar}
                    >
                        <Image
                            source={{ uri: userProfile?.avatar_url || "https://placekitten.com/100/100" }}
                            style={styles.profileAvatar}
                            key={`avatar-${userProfile?.avatar_url}`} // Force re-render
                        />
                        <View style={styles.avatarEditOverlay}>
                            {uploadingAvatar ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Ionicons name="camera" size={16} color="#FFF" />
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{userPosts.length}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{friendsCount}</Text>
                            <Text style={styles.statLabel}>Friends</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{userProfile?.score || 0}</Text>
                            <Text style={styles.statLabel}>Score</Text>
                        </View>
                    </View>
                </View>

                {/* Name & Bio Area */}
                <View style={styles.nameContainer}>
                    <Text style={styles.profileName}>{userProfile?.name || "Neko User"}</Text>
                    <Text style={styles.profileHandle}>@{session?.user?.email?.split('@')[0] || "neko_lover"}</Text>

                    <TouchableOpacity
                        style={styles.bioContainer}
                        onPress={() => setIsEditingBio(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.profileBio}>
                            {userProfile?.bio || "Tap to add a bio... 🐾"}
                        </Text>
                        <Ionicons name="pencil-outline" size={14} color="#26A69A" style={styles.bioIcon} />
                    </TouchableOpacity>
                </View>

                {/* Full Width Edit Button */}
                <TouchableOpacity
                    style={styles.editBtnFull}
                    onPress={() => onNavigate && onNavigate("Profile")}
                >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.feedDivider}>
                <View style={styles.feedTitleRow}>
                    <Ionicons name="grid-outline" size={20} color="#26A69A" />
                    <Text style={styles.feedTitle}>My Collection</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Top Nav */}
            <View style={styles.topNav}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#37474F" />
                </TouchableOpacity>
                <Text style={styles.topNavTitle}>My Profile</Text>
                <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={() => onNavigate && onNavigate("UserInfo")}
                >
                    <Ionicons name="settings-outline" size={24} color="#37474F" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#26A69A" />
                </View>
            ) : (
                <FlatList
                    data={userPosts}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderHeader}
                    extraData={userProfile}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            currentUserId={session?.user?.id}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="images-outline" size={48} color="#CFD8DC" />
                            <Text style={styles.emptyText}>No posts yet. Start sharing!</Text>
                        </View>
                    }
                />
            )}

            {/* 📝 Edit Bio Modal */}
            <Modal
                visible={isEditingBio}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsEditingBio(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.bioModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Bio</Text>
                            <TouchableOpacity onPress={() => setIsEditingBio(false)}>
                                <Ionicons name="close" size={24} color="#546E7A" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.bioInput}
                            placeholder="Tell the world about you and your cats..."
                            multiline
                            maxLength={150}
                            value={newBio}
                            onChangeText={setNewBio}
                            autoFocus
                        />

                        <Text style={styles.charCount}>{newBio?.length || 0}/150</Text>

                        <TouchableOpacity
                            style={[styles.saveBioBtn, savingBio && { opacity: 0.7 }]}
                            onPress={handleSaveBio}
                            disabled={savingBio}
                        >
                            {savingBio ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.saveBioText}>Save Bio 🐾</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4FAF9", // Soft Mint Background
    },
    topNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E0F2F1",
    },
    topNavTitle: {
        fontSize: 18,
        fontFamily: "Inter-Bold",
        color: "#26A69A",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4FAF9",
    },
    headerContent: {
        backgroundColor: "#FFF",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: "hidden",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    coverImageContainer: {
        width: "100%",
        height: 140,
        backgroundColor: "#B2DFDB",
        position: 'relative',
    },
    coverImage: {
        width: width,
        height: 140,
    },
    coverOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    profileInfoContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    avatarStatsRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginTop: -45,
    },
    avatarWrapper: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: "#FFF",
        backgroundColor: "#F1F8F7",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    profileAvatar: {
        width: "100%",
        height: "100%",
        borderRadius: 41,
    },
    avatarEditOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#26A69A',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    debugLabel: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4,
        borderRadius: 4,
        zIndex: 100,
    },
    debugText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Inter-Regular'
    },
    statsContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-around",
        paddingBottom: 5,
        marginLeft: 10,
    },
    statItem: {
        alignItems: "center",
    },
    statNumber: {
        fontSize: 18,
        fontFamily: "Inter-Bold",
        color: "#263238",
    },
    statLabel: {
        fontSize: 12,
        fontFamily: "Inter-Medium",
        color: "#90A4AE",
        marginTop: 2,
    },
    nameContainer: {
        marginTop: 15,
    },
    profileName: {
        fontSize: 22,
        fontFamily: "Inter-Bold",
        color: "#263238",
    },
    profileHandle: {
        fontSize: 14,
        fontFamily: "Inter-Medium",
        color: "#26A69A",
        marginTop: 2,
        opacity: 0.8,
    },
    bioContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        paddingRight: 10,
    },
    profileBio: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        color: "#546E7A",
        lineHeight: 20,
        flex: 1,
    },
    bioIcon: {
        marginLeft: 5,
        opacity: 0.5,
    },
    editBtnFull: {
        marginTop: 20,
        backgroundColor: "#F1F8F7",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#B2DFDB",
    },
    editBtnText: {
        fontSize: 14,
        fontFamily: "Inter-SemiBold",
        color: "#26A69A",
    },
    feedDivider: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: "#F4FAF9",
    },
    feedTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    feedTitle: {
        fontSize: 16,
        fontFamily: "Inter-Bold",
        color: "#263238",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 80,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        fontFamily: "Inter-Medium",
        color: "#90A4AE",
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    bioModal: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: "Inter-Bold",
        color: "#263238",
    },
    bioInput: {
        backgroundColor: "#F5F7FA",
        borderRadius: 12,
        padding: 16,
        height: 120,
        textAlignVertical: "top",
        fontSize: 16,
        fontFamily: "Inter-Regular",
        color: "#37474F",
    },
    charCount: {
        alignSelf: "flex-end",
        marginTop: 8,
        fontSize: 12,
        fontFamily: "Inter-Medium",
        color: "#90A4AE",
    },
    saveBioBtn: {
        marginTop: 20,
        backgroundColor: "#26A69A",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    saveBioText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: "Inter-Bold",
    },
});
