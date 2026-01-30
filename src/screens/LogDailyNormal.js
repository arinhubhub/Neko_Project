import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    Alert
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import supabase from "./config/supabaseClient";
import { styles } from './Style/LogDailyStyle';

export default function LogDailyNormal({ session, onBack }) {
    const [catId, setCatId] = useState(null);
    const [status, setStatus] = useState('Normal'); // Normal, Something off
    const [foodIntake, setFoodIntake] = useState('');
    const [waterIntake, setWaterIntake] = useState('');
    const [urineLevel, setUrineLevel] = useState(3); // 1-5
    const [stoolLevel, setStoolLevel] = useState(3); // 1-5

    // Additional fields requested
    const [urineColor, setUrineColor] = useState('');
    const [stoolColor, setStoolColor] = useState('');
    const [behavior, setBehavior] = useState('');
    const [vomitLevel, setVomitLevel] = useState(3);
    const [vomitColor, setVomitColor] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchCatId();
        }
    }, [session]);

    const fetchCatId = async () => {
        try {
            const { data, error } = await supabase
                .from('cats')
                .select('id, name')
                .eq('owner_id', session.user.id)
                .limit(1)
                .single();

            if (error) throw error;
            if (data) setCatId(data.id);
        } catch (error) {
            console.log("Error fetching cat:", error.message);
        }
    };

    const handleSave = async () => {
        if (!catId) {
            Alert.alert("Error", "No cat profile found");
            return;
        }

        setLoading(true);

        const payload = {
            cat_id: catId,
            log_date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
            status, // 'Normal' | 'Something off'
            food_intake: foodIntake ? Number(foodIntake) : null,
            water_intake: waterIntake ? Number(waterIntake) : null,
            urine_level: urineLevel,
            urine_color: urineColor || null,
            behavior: behavior || null,
            stool_level: stoolLevel,
            stool_color: stoolColor || null,
            vomit_level: status === 'Something off' ? vomitLevel : null,
            vomit_color: status === 'Something off' ? (vomitColor || null) : null,
        };

        console.log('SAVE DATA 👉', payload);

        const { error } = await supabase
            .from('daily_logs')
            .insert(payload);

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Daily log saved!', [
                { text: 'OK', onPress: onBack }
            ]);
        }
    };


    const LevelSelector = ({ label, value, onChange, iconSource }) => (
        <View style={styles.section}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.selectorContainer}>
                {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                        key={level}
                        style={styles.levelBtn}
                        onPress={() => onChange(level)}
                    >
                        <View style={[
                            styles.gridIconBtn,
                            value === level && (status === 'Something off' ? styles.gridIconBtnActiveOrange : styles.gridIconBtnActive)
                        ]}>
                            {/* Use Image if provided, else generic icon */}
                            {iconSource ? (
                                <Image source={iconSource} style={[styles.iconImg, value !== level && { opacity: 0.6 }]} />
                            ) : (
                                <View style={[styles.circle, value === level && styles.circleActive]} />
                            )}
                        </View>
                        <Text style={styles.levelText}>{getLevelLabel(level)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const getLevelLabel = (level) => {
        switch (level) {
            case 1: return "Very Low";
            case 2: return "Low";
            case 3: return "Normal";
            case 4: return "High";
            case 5: return "Very High";
            default: return "";
        }
    };


    // Data Arrays for Grids
    const urineColors = [
        { label: 'Pale Yellow', value: 'Pale Yellow', icon: require('../../assets/Urine_Color.png') }, // Generic icon
        { label: 'Dark Orange', value: 'Dark Orange', icon: require('../../assets/Urine_Color.png') },
        { label: 'Deep Brown', value: 'Deep Brown', icon: require('../../assets/Urine_Color.png') },
        { label: 'Bloody', value: 'Bloody', icon: require('../../assets/Urine_Color.png') },
        { label: 'Clear', value: 'Clear', icon: require('../../assets/Urine_Color.png') },
    ];

    const stoolColors = [
        { label: 'Dark Brown', value: 'Dark Brown', icon: require('../../assets/Stool_Color.png') },
        { label: 'Bright Red', value: 'Bright Red', icon: require('../../assets/Stool_Color.png') },
        { label: 'Black', value: 'Black', icon: require('../../assets/Stool_Color.png') },
        { label: 'Yellow/Orange', value: 'Yellow or Orange', icon: require('../../assets/Stool_Color.png') },
        { label: 'Green', value: 'Green', icon: require('../../assets/Stool_Color.png') },
    ];

    const behaviors = [
        { label: 'Frequent trips', value: 'Frequent trips', icon: require('../../assets/Behavior.png') },
        { label: 'Straining', value: 'Straining', icon: require('../../assets/Behavior.png') },
        { label: 'Painful vocal', value: 'Painful vocalization', icon: require('../../assets/Behavior.png') },
        { label: 'Inappropriate', value: 'Inappropriate urination', icon: require('../../assets/Behavior.png') },
        { label: 'Hunched', value: 'Hunched posture', icon: require('../../assets/Behavior.png') },
    ];

    const vomitColors = [
        { label: 'Yellow Foam', value: 'yellow_foam', icon: require('../../assets/Stool_Color.png') },
        { label: 'White Mucus', value: 'white_mucus', icon: require('../../assets/Stool_Color.png') },
        { label: 'Brown', value: 'brown', icon: require('../../assets/Stool_Color.png') },
        { label: 'Red', value: 'red', icon: require('../../assets/Stool_Color.png') },
        { label: 'Green', value: 'green', icon: require('../../assets/Stool_Color.png') },
        { label: 'Undigested Food', value: 'undigested_food', icon: require('../../assets/Stool_Color.png') },
    ];

    const GridSelector = ({ label, data, selectedValue, onChange }) => (
        <View style={styles.section}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.gridContainer}>
                {data.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.gridItem}
                        onPress={() => onChange(item.value)}
                    >
                        <View style={[
                            styles.gridIconBtn,
                            selectedValue === item.value && (status === 'Something off' ? styles.gridIconBtnActiveOrange : styles.gridIconBtnActive)
                        ]}>
                            <Image
                                source={item.icon}
                                style={[styles.iconImg, selectedValue !== item.value && { opacity: 0.4 }]}
                            />
                        </View>
                        <Text style={[styles.gridLabel, selectedValue === item.value && { color: '#000', fontWeight: 'bold' }]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>daily log</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={[
                styles.content,
                status === 'Something off' && styles.contentOff]}>

                <Text style={styles.questionText}>
                    How was <Text style={{ color: status === 'Something off' ? '#FF9800' : '#4CAF50' }}>Luna</Text> today
                </Text>

                {/* Status Toggle */}
                <View style={styles.statusContainer}>
                    <TouchableOpacity
                        style={[styles.statusCard, status === 'Normal' && styles.statusCardActive]}
                        onPress={() => setStatus('Normal')}
                    >
                        <View style={{ backgroundColor: '#ffffffff', borderRadius: 40, padding: 5, marginBottom: 5 }}>
                            <MaterialCommunityIcons name="cat" size={60} color="#00695C" />
                        </View>
                        <Text style={styles.statusText}>Normal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.statusCard,
                            status === 'Something off' && styles.statusCardActive,
                            status === 'Something off' && styles.statusCardOff
                        ]}
                        onPress={() => setStatus('Something off')}
                    >
                        <View style={{ backgroundColor: '#fff', borderRadius: 40, padding: 5, marginBottom: 5 }}>
                            <MaterialCommunityIcons name="emoticon-sick-outline" size={60} color="#FF9800" />
                        </View>
                        <Text style={styles.statusText}>Something off</Text>
                    </TouchableOpacity>
                </View>

                {/* Food Intake - Input fixed to avoid overlap */}
                <View style={styles.section}>
                    <Text style={styles.label}>Food Intake</Text>
                    <View style={styles.row}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="amount"
                                keyboardType="numeric"
                                value={foodIntake}
                                onChangeText={setFoodIntake}
                            />
                            <Text style={styles.unit}>g</Text>
                        </View>

                        <Text style={{ marginHorizontal: 10, fontSize: 14, color: '#555' }}>per</Text>

                        <View style={[styles.inputContainer]}>
                            <TextInput style={styles.input} placeholder="meal" />
                        </View>
                    </View>
                </View>

                {/* Water Intake - Changed to Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Water Intake</Text>
                    <View style={styles.row}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="amount"
                                keyboardType="numeric"
                                value={waterIntake}
                                onChangeText={setWaterIntake}
                            />
                            <Text style={styles.unit}>ml</Text>
                        </View>
                    </View>
                </View>

                {/* Urine */}
                <LevelSelector
                    label="Urine"
                    value={urineLevel}
                    onChange={setUrineLevel}
                    iconSource={require('../../assets/Urine.png')}
                />

                {/* Urine Color Grid */}
                <GridSelector
                    label="Urine Color"
                    data={urineColors}
                    selectedValue={urineColor}
                    onChange={setUrineColor}
                />

                {/* Behavior Grid */}
                <GridSelector
                    label="Behavior"
                    data={behaviors}
                    selectedValue={behavior}
                    onChange={setBehavior}
                />

                {/* Stool */}
                <LevelSelector
                    label="Stool"
                    value={stoolLevel}
                    onChange={setStoolLevel}
                    iconSource={require('../../assets/Stool.png')}
                />

                {/* Stool Color Grid */}
                <GridSelector
                    label="Stool Color"
                    data={stoolColors}
                    selectedValue={stoolColor}
                    onChange={setStoolColor}
                />

                {status === 'Something off' && (
                    <>
                        {/* Vomit */}
                        <LevelSelector
                            label="vomit"
                            value={vomitLevel}
                            onChange={setVomitLevel}
                            iconSource={require('../../assets/Stool_Color.png')}
                        />

                        {/* Vomit Color Grid */}
                        <GridSelector
                            label="vomit Color"
                            data={vomitColors}
                            selectedValue={vomitColor}
                            onChange={setVomitColor}
                        />
                    </>
                )}


                <TouchableOpacity
                    style={[styles.saveButton, status === 'Something off' && styles.saveButtonOff]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Event"}</Text>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
