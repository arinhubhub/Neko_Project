import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import supabase from './config/supabaseClient';

export default function SignInScreen({ onNavigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    setLoading(false);
    const handleSignIn = () => {
        // Just a visual check or simple handling
        Alert.alert('Sign In Pressed', `Email: ${email}, Password: ${password}`);
    };
    if (error) {
        Alert.alert("Error", error.message);
    } else {
      
    }
}

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <StatusBar style="auto" />

                {/* Header / Logo Placeholder */}
                <View style={styles.headerContainer}>

                    <Image
                        source={require('../../assets/cioncat.jpg')}
                        style={styles.logoimage} />
                    <Image
                        source={require('../../assets/taxticoncat.jpg')}
                        style={styles.textimage} />
                </View>

                {/* Content Card */}
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Login to your account</Text>

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

                    {/* Sign In Button */}
                    <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                        <Text style={styles.buttonText}>Sign in</Text>
                    </TouchableOpacity>

                    {/* SignUp Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={onNavigate}>
                            <Text style={styles.linkText}>Sign up</Text>
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
    contentContainer: {
    },
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
