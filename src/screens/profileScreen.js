import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { styles } from './Style/authstyle';
import supabase from './config/supabaseClient';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
// If you have icons, import them. For now using text placeholder or simple views for icons if needed.
export default function ProfileScreen({ session, onNavigateToCatProfile }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [email, setEmail] = useState(''); 

    useEffect(() => {
        if (session) {
            setEmail(session.user.email);
             getProfile();
        }
    }, [session]);

    const getProfile = async () => {
        try {
            setLoading(true);
            if (!session?.user) throw new Error('No user on the session!');

            const { data, error, status } = await supabase
                .from('profiles')
                .select(`name, gender, phone_number, dob`)
                .eq('id', session.user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.name || '');
                setGender(data.gender || '');
                setPhone(data.phone_number || '');
                setBirthDate(data.dob || ''); // Changed dob to date_of_birth
            }
        } catch (error) {
            if (error instanceof Error) {
                // If table doesn't exist or other error, we might just ignore for new users
                 console.log('Error downloading profile: ', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        setSaving(true);

        try {
            // 1. เช็คว่าล็อกอินอยู่ไหม
            if (!session?.user) throw new Error('No user on the session!');

            // 2. ตรวจรูปแบบวันที่
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (birthDate && !dateRegex.test(birthDate)) {
                throw new Error("Invalid date format. Please use YYYY-MM-DD (e.g., 1999-01-31).");
            }

            if (!username || !phone || !gender || !birthDate) {
                throw new Error("Please fill in all required fields.");
            }

            // 3. เตรียมข้อมูล (สร้างตัวแปร updates ตรงนี้ก่อน!)
            const updates = {
                id: session.user.id,
                name: username,
                email: session.user.email, // Add email to the update payload
                gender: gender,
                phone_number: phone,      // เช็คว่าใน DB ชื่อ phone_number แน่นอนนะ
                dob: birthDate || null, // เช็คว่าใน DB ชื่อ date_of_birth หรือ dob (เอาให้ตรง)
                created_at: new Date(),
            };

            // 4. ส่งข้อมูลเข้า Supabase (ใช้ Upsert ทีเดียวจบ)
            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) {
                throw error; // ถ้ามี error ให้เด้งไปที่ catch
            }

            // 5. ถ้าสำเร็จ ให้แจ้งเตือนและเปลี่ยนหน้า
            Alert.alert("Success", "Profile saved successfully!", [
                { 
                    text: "OK", 
                    onPress: () => {
                        // สั่งเปลี่ยนหน้า
                        if (onNavigateToCatProfile) {
                            onNavigateToCatProfile(); 
                        }
                    }
                }
            ]);

        } catch (error) {
            // 6. ถ้าพัง ให้แจ้งเตือน
            Alert.alert("Error Saving Profile", error.message);
        } finally {
            // 7. หยุดหมุน
            setSaving(false);
        }
    };
    
    // ฟังก์ชันจัดรูปแบบวันที่อัตโนมัติขณะพิมพ์
    const handleDateChange = (text) => {
        // 1. ลบทุกตัวอักษรที่ไม่ใช่ตัวเลขออกก่อน
        const cleaned = text.replace(/[^0-9]/g, '');
        
        // 2. จัดรูปแบบ YYYY-MM-DD
        let formatted = cleaned;
        if (cleaned.length > 4) {
            formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
        }
        if (cleaned.length > 6) {
            formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
        }

        // 3. จำกัดความยาวไม่ให้เกิน 10 ตัวอักษร (YYYY-MM-DD)
        if (cleaned.length > 8) {
            formatted = formatted.slice(0, 10); 
        }

        setBirthDate(formatted);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
             <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <StatusBar style="auto" />

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageContainer}>
                         {/* Placeholder for camera icon or user image */}
                         <Image 
                            source={require('../../assets/cioncat.jpg')} // Using existing asset as placeholder or separate image if user has one
                            style={[styles.profileImage, { opacity: 0.8 }]} 
                         />
                    </View>
                    <Text style={styles.profileName}>{username || 'User Name'}</Text>
                    
                    <View style={styles.caregiverBadge}>
                        <Text style={styles.caregiverText}>TOP CAREGIVER</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>GENERAL INFO</Text>

                <View style={styles.contentContainer}>
                    
                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Your Name"
                        />
                    </View>

                    {/* Email Input (Read Only) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#e0e0e0' }]}
                            value={email}
                            editable={false}
                        />
                    </View>

                    {/* Gender Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Gender</Text>
                        <View style={[styles.input, { paddingHorizontal: 0, justifyContent: 'center' }]}>
                            <Picker
                                selectedValue={gender}
                                onValueChange={(itemValue) => setGender(itemValue)}
                                style={{ width: '100%', height: 50 }}
                                dropdownIconColor="#2F6A62"
                            >
                                <Picker.Item label="Select Gender" value="" color="#999" />
                                <Picker.Item label="Male" value="Male" />
                                <Picker.Item label="Female" value="Female" />
                                <Picker.Item label="Other" value="Other" />
                            </Picker>
                        </View>
                    </View>

                     {/* Phone Number */}
                     <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Phone Number</Text>
                         <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Date of Birth */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Date of birth (YYYY-MM-DD)</Text>
                         <TextInput
                            style={styles.input}
                            value={birthDate}
                            onChangeText={handleDateChange} // เปลี่ยนมาใช้ฟังก์ชันใหม่ที่นี่
                            placeholder="YYYY-MM-DD"        // เปลี่ยน Placeholder ให้ชัดเจน
                            placeholderTextColor="#999"
                            keyboardType="numeric"          // บังคับขึ้นแป้นตัวเลข
                            maxLength={10}                  // ห้ามพิมพ์เกิน
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={updateProfile}
                        disabled={saving}
                    >
                        {saving ? (
                             <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Save Profile</Text>
                        )}
                    </TouchableOpacity>

                    {/* Sign Out Button (Optional but useful for testing) */}
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: '#FF6B6B', marginTop: 10 }]} 
                        onPress={() => supabase.auth.signOut()}
                    >
                        <Text style={styles.buttonText}>Sign Out</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
