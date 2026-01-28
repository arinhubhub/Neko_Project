import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { styles } from './Style/authstyle';
import supabase from './config/supabaseClient';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, SafeAreaView } from 'react-native';

export default function SignInScreen({ onNavigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

const handleSignIn = async () => {
    setLoading(true);
    const cleanEmail = email.trim();
    const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
    });
    setLoading(false);

    if (!error) {
        Alert.alert('Sign In Success', `Email: ${email}`);
    }
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