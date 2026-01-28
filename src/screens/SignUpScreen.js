import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { styles } from './Style/authstyle';
import supabase from './config/supabaseClient'; 
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native'; 

export default function SignUpScreen({ onNavigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        // 1. เช็คความถูกต้อง
        if(!agree) {
            Alert.alert("ข้อผิดพลาด", "กรุณายอมรับเงื่อนไข (Terms & Privacy)");
            return;
        }
        if (!email || !password) {
            Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        setLoading(true); // เริ่มหมุน

        try {
            // 2. ส่งข้อมูลไป Supabase (ต้องอยู่ภายในฟังก์ชัน async นี้)
            const cleanEmail = email.trim();
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password: password,
            });

            if (error) {
                Alert.alert("ERROR", error.message);
                return;
            }

            if (data?.user) {
                // 2.1 สร้าง record ในตาราง profiles
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        { 
                            id: data.user.id,
                            email: cleanEmail,
                            // other fields will be null/default strictly based on DB schema defaults 
                            // or we can add empty strings if needed, but null is usually better for "not set"
                        }
                    ]);

                if (profileError) {
                    console.log('Error creating profile:', profileError);
                    // เราอาจจะไม่ block user ตรงนี้ แต่เเจ้งเตือนหรือ log ไว้
                }

                Alert.alert("SUCCESS", "Registration Success! Please login.");
            }
        } catch (err) {
            Alert.alert("ERROR", "Something went wrong.");
        } finally {
            setLoading(false); // หยุดหมุนไม่ว่าจะสำเร็จหรือล้มเหลว
        }
    };








    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <StatusBar style="auto" />

                <View style={styles.headerContainer}>
                    <Image
                        source={require('../../assets/cioncat.jpg')}
                        style={styles.logoimage} />
                    <Image
                        source={require('../../assets/taxticoncat.jpg')}
                        style={styles.textimage} />
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Create an account</Text>
                    <Text style={styles.subtitle}>Enter your personal data to create your account</Text>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.required}> *</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Password</Text>
                            <Text style={styles.required}> *</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                        />
                    </View>

                    {/* Terms Checkbox */}
                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={[styles.checkbox, agree && styles.checkboxChecked]}
                            onPress={() => setAgree(!agree)}
                        >
                            {agree && <View style={styles.checkboxInner} />}
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel}>
                            I agree to the <Text style={styles.linkText}>Terms</Text> and <Text style={styles.linkText}>Privacy policy</Text>
                        </Text>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleSignUp}
                        disabled={loading} // ป้องกันการกดซ้ำ
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign up</Text>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={onNavigate}>
                            <Text style={styles.linkText}>Login</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </SafeAreaView>
    );
}

