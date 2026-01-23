import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Image, Alert, ActivityIndicator } from 'react-native';
// ตรวจสอบ path ของ supabaseClient ให้ถูกต้องด้วยนะครับ
import supabase from './config/supabaseClient'; 

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
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            // 3. ตรวจสอบผลลัพธ์
            if (error) {
                Alert.alert("ERROR", error.message);
            } else {
                Alert.alert("SUCCESS", "Registration Success! Please check your email.");
                // ถ้าปิด confirm email ใน supabase แล้ว ก็อาจจะสั่งให้ login หรือเปลี่ยนหน้าตรงนี้ได้เลย
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    logoimage: {
        width: 120,
        height: 120,
        marginBottom: 1,
        resizeMode: 'contain',
    },
    textimage: {
        width: 120,
        height: 12,
        marginTop: 1,
        marginBottom: 1,
        resizeMode: 'contain',
    },
    contentContainer: {},
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
        width: '80%',
        alignSelf: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 32,
        width: '80%',
        alignSelf: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        marginBottom: 8,
        width: '80%',
        alignSelf: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    required: {
        color: '#ff0000',
        fontSize: 14,
    },
    input: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#F9F9F9',
        color: '#333',
        alignSelf: 'center',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        width: '80%',
        alignSelf: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        borderColor: '#2D9CDB',
        backgroundColor: '#2D9CDB',
    },
    checkboxInner: {
        width: 10,
        height: 10,
        backgroundColor: '#fff',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#555',
    },
    linkText: {
        color: '#16A085',
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    button: {
        backgroundColor: '#1E1E1E',
        height: 56,
        borderRadius: 160,
        alignItems: 'center',
        width: 300,
        justifyContent: 'center',
        marginBottom: 24,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#555',
    },
});