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
import { Picker } from '@react-native-picker/picker';

export default function LogDailyNormal({ session, onBack, initialDate }) {
    const [catId, setCatId] = useState(null);
    const [status, setStatus] = useState('Normal'); // Normal, Something off
    const [foodType, setFoodType] = useState(null); // 'dry', 'wet', 'homemade_barf'
    const [foodIntake, setFoodIntake] = useState(''); // Restored amount input
    const [waterIntake, setWaterIntake] = useState('');
    const [urineLevel, setUrineLevel] = useState(3); // 1-5
    const [stoolLevel, setStoolLevel] = useState(3); // 1-5

    // Additional fields requested
    const [urineColor, setUrineColor] = useState('');
    const [stoolColor, setStoolColor] = useState('');
    const [behavior, setBehavior] = useState('');
    const [vomitLevel, setVomitLevel] = useState(3);
    const [vomitColor, setVomitColor] = useState('');
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(false);

    // Format date for display if needed, or use logic
    const logDate = initialDate ? new Date(initialDate) : new Date();

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

        const formatToEnum = (val) => val ? String(val).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') : null;

        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, '0');
        const day = String(logDate.getDate()).padStart(2, '0');
        const localDateString = `${year}-${month}-${day}`;

        const payload = {
            cat_id: catId,
            log_date: localDateString, // Use local date strictly
            food_type_enum: foodType,
            food_intake: foodIntake ? Number(foodIntake) : (foodType ? 100 : 0), // Use input amount if available, else default if type selected
            water_level: waterIntake ? Number(waterIntake) : null,
            urine_level_enum: String(getLevelValue(urineLevel)).toLowerCase(),
            urine_color_enum: formatToEnum(urineColor),
            behavior_enum: formatToEnum(behavior),
            stool_level_enum: String(getLevelValue(stoolLevel)).toLowerCase(),
            stool_color_enum: formatToEnum(stoolColor),
            vomit_level_enum: status === 'Something off' ? String(getLevelValue(vomitLevel)).toLowerCase() : null,
            vomit_color_enum: status === 'Something off' ? formatToEnum(vomitColor) : null,
            notes: notes || null,
        };

        console.log('SENDING TO SUPABASE (v1.8) 👉', JSON.stringify(payload, null, 2));

        const { error } = await supabase
            .from('daily_logs')
            .upsert(payload, { onConflict: 'cat_id, log_date' });

        setLoading(false);

        if (error) {
            Alert.alert('Error (v1.8)', error.message);
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

    const getLevelValue = (level) => {
        switch (level) {
            case 1: return "very_low";
            case 2: return "low";
            case 3: return "normal";
            case 4: return "high";
            case 5: return "very_high";
            default: return null;
        }
    };


    // Data Arrays for Grids
    const urineColors = [
        { label: 'Pale Yellow', value: 'pale_yellow', icon: require('../../assets/Urine_Color.png') },
        { label: 'Dark Orange', value: 'dark_orange', icon: require('../../assets/Urine_Color.png') },
        { label: 'Deep Brown', value: 'deep_brown', icon: require('../../assets/Urine_Color.png') },
        { label: 'Bloody', value: 'bloody', icon: require('../../assets/Urine_Color.png') },
        { label: 'Clear', value: 'clear', icon: require('../../assets/Urine_Color.png') },
    ];

    const stoolColors = [
        { label: 'Brown', value: 'brown', icon: require('../../assets/Stool_Color.png') },
        { label: 'Red', value: 'red', icon: require('../../assets/Stool_Color.png') },
        { label: 'Green', value: 'green', icon: require('../../assets/Stool_Color.png') },
        { label: 'Yellow Foam', value: 'yellow_foam', icon: require('../../assets/Stool_Color.png') },
        { label: 'White Mucus', value: 'white_mucus', icon: require('../../assets/Stool_Color.png') },
        { label: 'Undigested Food', value: 'undigested_food', icon: require('../../assets/Stool_Color.png') },
    ];

    const behaviors = [
        { label: 'Frequent trips', value: 'frequent_trips', icon: require('../../assets/Behavior.png') },
        { label: 'Straining', value: 'straining', icon: require('../../assets/Behavior.png') },
        { label: 'Painful vocal', value: 'painful_vocal', icon: require('../../assets/Behavior.png') },
        { label: 'Inappropriate', value: 'inappropriate', icon: require('../../assets/Behavior.png') },
        { label: 'Hunched', value: 'hunched', icon: require('../../assets/Behavior.png') },
    ];

    const foodTypes = [
        { label: 'Dry Food', value: 'dry', icon: require('../../assets/Behavior.png') }, 
        { label: 'Wet Food', value: 'wet', icon: require('../../assets/Behavior.png') },
        { label: 'Homemade / BARF', value: 'homemade_barf', icon: require('../../assets/Behavior.png') },
    ];

    const vomitColors = [
        { label: 'Yellow Foam', value: 'yellow_foam', icon: require('../../assets/Stool_Color.png') },
        { label: 'White Mucus', value: 'white_mucus', icon: require('../../assets/Stool_Color.png') },
        { label: 'Brown', value: 'brown', icon: require('../../assets/Stool_Color.png') },
        { label: 'Red', value: 'red', icon: require('../../assets/Stool_Color.png') },
        { label: 'Green', value: 'green', icon: require('../../assets/Stool_Color.png') },
        { label: 'Undigested Food', value: 'undigested_food', icon: require('../../assets/Stool_Color.png') },
    ];

    const GridSelector = ({ label, data, selectedValue, onChange, isVomitColor }) => (
        <View style={styles.section}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.gridContainer}>
                {data.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.gridItem, isVomitColor && styles.gridItemVomit]}
                        onPress={() => onChange(item.value)}
                    >
                        <View style={[
                            styles.gridIconBtn,
                            isVomitColor && styles.gridIconBtnVomit,
                            selectedValue === item.value && (status === 'Something off' ? styles.gridIconBtnActiveOrange : styles.gridIconBtnActive)
                        ]}>
                            <Image
                                source={item.icon}
                                style={[styles.iconImg, isVomitColor && { width: 52, height: 52 }, selectedValue !== item.value && { opacity: 0.4 }]}
                            />
                        </View>
                        <Text style={[styles.gridLabel, isVomitColor && { fontSize: 12.5 }, selectedValue === item.value && { color: '#4d4b4bff' }]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={[styles.safeArea, status === 'Something off' && styles.safeAreaOff]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#000000ff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    daily log {initialDate ? `(${logDate.getDate()}/${logDate.getMonth() + 1})` : ''} 
                    <Text style={{ fontSize: 10, color: '#999' }}> v1.8</Text>
                </Text>
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

                {/* Food Intake Section - Combined Amount + Type */}
                <View style={styles.section}>
                    <Text style={styles.label}>Food Intake</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        
                        {/* Left: Amount Input */}
                        <View style={[styles.inputContainer, { flex: 0.35, marginRight: 10 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={foodIntake}
                                onChangeText={setFoodIntake}
                            />
                            <Text style={styles.unit}>g</Text>
                        </View>

                        {/* Right: Food Type Picker */}
                        <View style={{ flex: 0.65 }}>
                            <View style={{ 
                                width: '100%', 
                                height: 50, 
                                borderRadius: 12, 
                                backgroundColor: status === 'Something off' ? '#FFF3E0' : '#E0F2F1', // Light background matching theme
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: status === 'Something off' ? '#FF9800' : '#4FD1C5'
                            }}>
                                <Picker
                                    selectedValue={foodType}
                                    onValueChange={(itemValue) => setFoodType(itemValue)}
                                    style={{ width: '100%', height: 50 }}
                                    dropdownIconColor={status === 'Something off' ? '#FF9800' : '#00695C'}
                                >
                                    <Picker.Item label="Select Type" value={null} enabled={false} color="#999" />
                                    <Picker.Item label="Dry Food" value="dry" />
                                    <Picker.Item label="Wet Food" value="wet" />
                                    <Picker.Item label="Homemade / BARF" value="homemade_barf" />
                                </Picker>
                            </View>
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
                            isVomitColor={true}
                            data={vomitColors}
                            selectedValue={vomitColor}
                            onChange={setVomitColor}
                        />
                    </>
                )}



                {/* Notes Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Add some notes..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

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