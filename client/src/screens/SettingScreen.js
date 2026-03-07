import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Switch, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './config/supabaseClient'; // Adjusted path to existing client

export default function SettingScreen({ session, onNavigate, onLogout }) {
    const [userData, setUserData] = useState(null);
    const [userCats, setUserCats] = useState([]);

    // Switch states
    const [notificationEnabled, setNotificationEnabled] = useState(true);
    const [webcamEnabled, setWebcamEnabled] = useState(true);
    const [privacyEnabled, setPrivacyEnabled] = useState(true);
    const [phoneCameraEnabled, setPhoneCameraEnabled] = useState(true);

    // Load phone camera toggle from storage
    useEffect(() => {
        AsyncStorage.getItem('phone_camera_enabled').then(val => {
            if (val !== null) setPhoneCameraEnabled(val === 'true');
        });
    }, []);

    const handlePhoneCameraToggle = async (value) => {
        setPhoneCameraEnabled(value);
        await AsyncStorage.setItem('phone_camera_enabled', String(value));
    };

    useEffect(() => {
        if (session) {
            fetchUserData();
        }
    }, [session]);

    const fetchUserData = async () => {
        try {
            // Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setUserData(profile);

            // Fetch Cats
            const { data: cats } = await supabase
                .from('cats')
                .select('*')
                .eq('owner_id', session.user.id);
            setUserCats(cats || []);

        } catch (error) {
            console.log("Error fetching settings data", error);
        }
    };

    const handleDeleteCat = async (cat) => {
        Alert.alert(
            "Delete Cat",
            `Are you sure you want to remove ${cat.name}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('cats')
                                .delete()
                                .eq('id', cat.id);

                            if (error) throw error;

                            // Update local state
                            setUserCats(prev => prev.filter(c => c.id !== cat.id));
                            Alert.alert("Success", `${cat.name} has been removed.`);
                        } catch (e) {
                            console.error("Error deleting cat:", e.message);
                            Alert.alert("Error", "Could not delete cat. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onNavigate('Home')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                {/* Decorative Paw Prints could go here absolutely positioned if using images */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={userData?.avatar_url ? { uri: userData.avatar_url } : require('../../assets/cioncat.jpg')}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.profileName}>{userData?.name || 'Loading...'}</Text>
                    <View style={styles.badge}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                        <Text style={styles.badgeText}>TOP CAREGIVER</Text>
                    </View>
                </View>

                {/* My Cats Section */}
                <View style={styles.catsSection}>
                    <View style={styles.catsHeaderRow}>
                        <Text style={styles.sectionTitle}>My cats</Text>
                        <TouchableOpacity onPress={() => onNavigate('CatProfile')}>
                            <Text style={styles.addNewText}>Add new</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catsList}>
                        {userCats.map((cat, index) => (
                            <TouchableOpacity
                                key={cat.id || index}
                                style={styles.catItem}
                                onPress={() => onNavigate('CatProfile', { catId: cat.id })}
                                onLongPress={() => handleDeleteCat(cat)}
                                delayLongPress={800}
                            >
                                <Image
                                    source={{ uri: cat.image_url || 'https://placekitten.com/100/100' }}
                                    style={styles.catAvatar}
                                />
                                <Text style={styles.catName}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}

                        {/* Add Button Placeholder in list if needed, or matched design which has a big plus button */}
                        <TouchableOpacity style={styles.addCatButton} onPress={() => onNavigate('CatProfile')}>
                            <Ionicons name="add" size={30} color="#8FBAB4" />
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Settings Menu */}
                <View style={styles.menuContainer}>

                    {/* Account Settings */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('EditProfile')}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="user" size={24} color="#004D40" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Account Settings</Text>
                            <Text style={styles.menuSubtitle}>Edit Profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Notification Preferences */}
                    <View style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="bell" size={24} color="#004D40" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Notification Preferences</Text>
                            <Text style={styles.menuSubtitle}>Health alert and daily digests</Text>
                        </View>
                        <Switch
                            value={notificationEnabled}
                            onValueChange={setNotificationEnabled}
                            trackColor={{ false: "#767577", true: "#004D40" }}
                            thumbColor={notificationEnabled ? "#f4f3f4" : "#f4f3f4"}
                        />
                    </View>

                    {/* Phone Camera */}
                    <View style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="camera" size={24} color="#004D40" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Phone Camera</Text>
                            <Text style={styles.menuSubtitle}>{phoneCameraEnabled ? 'Camera is on — can take photos' : 'Camera is off — cannot take photos'}</Text>
                        </View>
                        <Switch
                            value={phoneCameraEnabled}
                            onValueChange={handlePhoneCameraToggle}
                            trackColor={{ false: "#767577", true: "#004D40" }}
                            thumbColor={phoneCameraEnabled ? "#f4f3f4" : "#f4f3f4"}
                        />
                    </View>

                    {/* Data Export & Privacy */}
                    <View style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="pie-chart" size={24} color="#004D40" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Data Export & Privacy</Text>
                            <Text style={styles.menuSubtitle}>Health logs and privacy controls</Text>
                        </View>
                        <Switch
                            value={privacyEnabled}
                            onValueChange={setPrivacyEnabled}
                            trackColor={{ false: "#767577", true: "#004D40" }}
                            thumbColor={privacyEnabled ? "#f4f3f4" : "#f4f3f4"}
                        />
                    </View>

                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Text style={styles.logoutText}>Log out</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EDF7F6', // Very light mint/white
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    backButton: {
        padding: 5,
    },
    scrollContent: {
        padding: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 6,
        borderColor: '#5B9A92',
        overflow: 'hidden',
        marginBottom: 10,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    badge: {
        backgroundColor: '#A8D1CD',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    catsSection: {
        marginBottom: 20,
    },
    catsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    addNewText: {
        fontSize: 14,
        color: '#004D40',
        fontWeight: '600',
    },
    catsList: {
        flexDirection: 'row',
    },
    catItem: {
        alignItems: 'center',
        marginRight: 15,
    },
    catAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 5,
    },
    catName: {
        fontSize: 12,
        color: '#333',
    },
    addCatButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#D1EFE9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#8FBAB4',
    },
    menuContainer: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 16,
        overflow: 'hidden',
        paddingVertical: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#D1EFE9',
        marginBottom: 10,
        borderRadius: 12,
        marginHorizontal: 0, // Design shows them as separate cards
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#004D40', // Optional: if icon needs bg
        marginRight: 15,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#004D40',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#666',
    },
    logoutButton: {
        marginTop: 20,
        backgroundColor: '#D1EFE9',
        borderWidth: 2,
        borderColor: '#004D40',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#004D40',
    },
});
