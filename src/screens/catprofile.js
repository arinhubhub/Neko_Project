import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles } from './Style/authstyle';
import supabase from './config/supabaseClient';
import { StatusBar } from 'expo-status-bar';

export default function CatProfile({ session, onNavigateToHome }) { // Receiving session and callback
    const [catName, setCatName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('Male'); // Male, Female
    const [isNeutered, setIsNeutered] = useState('Yes'); // Yes, No
    const [breed, setBreed] = useState('');
    const [currentWeight, setCurrentWeight] = useState('');
    const [baselineWeight, setBaselineWeight] = useState('');
    const [activityLevel, setActivityLevel] = useState('Normal'); // Low, Normal, High

    const handleSave = async () => {
     
        if (!catName || !breed || !birthDate || !currentWeight || !baselineWeight || !gender || !isNeutered || !activityLevel) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        try {
            if (!session?.user?.id) throw new Error("No user logged in");

            // 1. Insert into cats table
            const { data: catData, error: catError } = await supabase
                .from('cats')
                .insert([
                    {
                        owner_id: session.user.id,
                        name: catName,
                        breed: breed,
                        gender: gender,
                        birthdate: birthDate || null,
                    }
                ])
                .select()
                .single();

            if (catError) throw catError;

            // 2. Insert into cat_weights table
            if (currentWeight) {
                const { error: weightError } = await supabase
                    .from('cat_weights')
                    .insert([
                        {
                            cat_id: catData.id,
                            weight_kg: parseFloat(currentWeight),
                             measured_at: new Date(),
                        }
                    ]);

                 if (weightError) throw weightError;
            }

            // Success
            Alert.alert('Success', 'Cat Profile Saved!', [
                { text: 'OK', onPress: () => onNavigateToHome && onNavigateToHome(catData.id) }
            ]);

        } catch (error) {
            Alert.alert('Error Saving Cat Profile', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <StatusBar style="auto" />

                {/* Header */}
                <View style={styles.headerContainer}>
                   {/* Back button could go here if needed */}
                </View>

                {/* Profile Image */}
                 <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={styles.profileImageContainer}>
                         <Image 
                            source={require('../../assets/cioncat.jpg')} // distinct placeholder ideally
                            style={[styles.profileImage, { opacity: 0.8 }]} 
                         />
                         <View style={{ position: 'absolute' }}>
                             {/* Camera Icon Placeholder */}
                             <Text style={{ fontSize: 30, color: '#fff', opacity: 0.8 }}>📷</Text>
                         </View>
                    </View>
                    <Text style={styles.title}>Upload Profile</Text>
                    <Text style={[styles.subtitle, { marginBottom: 10 }]}>Help us recognize your feline friend</Text>
                </View>


                <Text style={styles.sectionTitle}>GENERAL INFO</Text>
                <View style={styles.contentContainer}>
                    {/* Cat's Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Cat's Name</Text>
                        <TextInput
                            style={styles.input}
                            value={catName}
                            onChangeText={setCatName}
                            placeholder="Name"
                        />
                    </View>

                    {/* Birthdate */}
                    <View style={styles.inputGroup}>
                         <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '80%', alignSelf:'center'}}>
                            <Text style={[styles.label, {marginLeft: 0}]}>Birthdate (YYYY-MM-DD)</Text>
                            <Text style={[styles.label, {color: '#2F6A62', fontWeight: 'bold'}]}></Text> 
                         </View>
                        <TextInput
                            style={styles.input}
                            value={birthDate}
                            onChangeText={setBirthDate}
                            placeholder="2020-05-20"
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>ATTRIBUTES</Text>
                <View style={styles.contentContainer}>
                    {/* Gender Toggle */}
                    <View style={styles.rowContainer}>
                        {/* Gender Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Gender</Text>
                        <View style={[styles.input, { paddingHorizontal: 0, justifyContent: 'center' }]}>
                            <Picker
                                selectedValue={gender}
                                onValueChange={(itemValue) => setGender(itemValue)}
                                style={{ width: '100%', height: 50 }}
                                dropdownIconColor="#2F6A62"
                            >
                                <Picker.Item label="Male" value="Male" />
                                <Picker.Item label="Female" value="Female" />
                            </Picker>
                        </View>
                    </View>

                        {/* Neutered Toggle - Assuming Yes/No maps to Neutered status */}
                        <View style={styles.toggleContainer}>
                             <TouchableOpacity 
                                style={[styles.toggleButton, isNeutered === 'Yes' && styles.toggleButtonActive]}
                                onPress={() => setIsNeutered('Yes')}
                            >
                                <Text style={[styles.toggleText, isNeutered === 'Yes' && styles.toggleTextActive]}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.toggleButton, isNeutered === 'No' && styles.toggleButtonActive]}
                                onPress={() => setIsNeutered('No')}
                            >
                                <Text style={[styles.toggleText, isNeutered === 'No' && styles.toggleTextActive]}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                     {/* Breed */}
                     <View style={styles.inputGroup}>
                        <Text style={styles.labelprofile}>Breed</Text>
                        <TextInput
                            style={styles.input}
                            value={breed}
                            onChangeText={setBreed}
                            placeholder="Breed"
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>PHYSICAL METRICS</Text>
                <View style={styles.rowContainer}>
                     <View style={styles.weightContainer}>
                        <Text style={[styles.label, {marginBottom: 5}]}>Current Weight</Text>
                        <View style={styles.weightInputContainer}>
                            <TextInput 
                                style={styles.weightInput}
                                value={currentWeight}
                                onChangeText={setCurrentWeight}
                                placeholder="0.0"
                                keyboardType="numeric"
                            />
                            <Text style={styles.unitText}>Kg</Text>
                        </View>
                     </View>

                     <View style={styles.weightContainer}>
                        <Text style={[styles.label, {marginBottom: 5}]}>Baseline Weight</Text>
                        <View style={styles.weightInputContainer}>
                            <TextInput 
                                style={styles.weightInput}
                                value={baselineWeight}
                                onChangeText={setBaselineWeight}
                                placeholder="0.0"
                                keyboardType="numeric"
                            />
                            <Text style={styles.unitText}>Kg</Text>
                        </View>
                     </View>
                </View>

                <Text style={[styles.sectionTitle, {marginTop: 10}]}>Daily Activity Level</Text>
                <View style={styles.activityContainer}>
                    <TouchableOpacity 
                        style={[styles.activityButton, activityLevel === 'Low' && styles.activityButtonActive]}
                        onPress={() => setActivityLevel('Low')}
                    >
                         <Text style={styles.iconPlaceholder}>aaa</Text> 
                         {/* Replace with Icon */}
                         <Text style={styles.activityText}>Low</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.activityButton, activityLevel === 'Normal' && styles.activityButtonActive]}
                        onPress={() => setActivityLevel('Normal')}
                    >
                         <Text style={styles.iconPlaceholder}>🔥</Text>
                         {/* Replace with Icon */}
                         <Text style={styles.activityText}>Normal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.activityButton, activityLevel === 'High' && styles.activityButtonActive]}
                        onPress={() => setActivityLevel('High')}
                    >
                         <Text style={styles.iconPlaceholder}>⚡</Text>
                         {/* Replace with Icon */}
                         <Text style={styles.activityText}>High</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Complete Profile</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}
