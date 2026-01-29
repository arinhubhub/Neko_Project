import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import supabase from './config/supabaseClient';
import { Ionicons } from "@expo/vector-icons";

export default function UserInfoScreen({ session, catId, onLogout, onMissingProfile, onBack }) { // Accept onBack
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [catData, setCatData] = useState(null);
    const [catWeight, setCatWeight] = useState(null);

    useEffect(() => {
        fetchData();
    }, [catId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (!session?.user?.id) return;

            // Fetch User Profile
            const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (userError) {
                 console.log('User profile fetch error', userError);
                 if (onMissingProfile) onMissingProfile(); // Trigger if totally missing
                 return;
            } else {
                // Check if profile is 'incomplete' (e.g. no name)
                if (!userProfile.name) {
                    if (onMissingProfile) onMissingProfile();
                    return;
                }
                setUserData(userProfile);
            }

            // Fetch Cat Data
            let targetCatId = catId;

            // If no catId provided, try to find the first cat for this user
            if (!targetCatId) {
                 const { data: firstCat, error: firstCatError } = await supabase
                    .from('cats')
                    .select('id')
                    .eq('owner_id', session.user.id)
                    .limit(1)
                    .single();
                
                if (firstCat) {
                    targetCatId = firstCat.id;
                }
            }

            if (targetCatId) {
                const { data: cat, error: catError } = await supabase
                    .from('cats')
                    .select('*')
                    .eq('id', targetCatId)
                    .single();
                
                if (catError) throw catError;
                setCatData(cat);

                // Fetch latest Cat Weight
                const { data: weight, error: weightError } = await supabase
                    .from('cat_weights')
                    .select('*')
                    .eq('cat_id', targetCatId)
                    .order('measured_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!weightError) {
                   setCatWeight(weight);
                }
            }

        } catch (error) {
            console.log('Error fetching data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2F6A62" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />
             {/* Header with Back Button */}
            <View style={styles.header}>
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#2F6A62" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>{onBack ? "Profile Settings" : "Details Summary"}</Text>
                <View style={{width: 28}} /> 
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* User Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>User Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{userData?.name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{session?.user?.email || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Phone:</Text>
                        <Text style={styles.value}>{userData?.phone_number || 'N/A'}</Text>
                    </View>
                </View>

                {/* Cat Section */}
                {catData && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Cat Information</Text>
                         <View style={styles.infoRow}>
                            <Text style={styles.label}>Name:</Text>
                            <Text style={styles.value}>{catData.name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Breed:</Text>
                            <Text style={styles.value}>{catData.breed}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Gender:</Text>
                            <Text style={styles.value}>{catData.gender}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Birthdate:</Text>
                            <Text style={styles.value}>{catData.birthdate}</Text>
                        </View>
                         {catWeight && (
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Weight:</Text>
                                <Text style={styles.value}>{catWeight.weight_kg} kg</Text>
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={onLogout}>
                    <Text style={styles.buttonText}>Logout / Start Over</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#F5F5F5',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F6A62',
    },
    backButton: {
        padding: 5,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 5,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    label: {
        fontWeight: '600',
        color: '#666',
        width: 100,
    },
    value: {
        flex: 1,
        color: '#333',
    },
    button: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
