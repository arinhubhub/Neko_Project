import React, { useState } from 'react';
import {
    View, Text, SafeAreaView, ScrollView,
    TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import HomeHeader from '../components/HomeHeader';
import BottomNav from '../components/BottomNav';
import styles from '../styles/homeStyles';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import supabase from './config/supabaseClient';

// ── ชื่อ bucket ใน Supabase Storage ─────────────────────────────────────────
const STORAGE_BUCKET = 'ai-photo-checks';

const PHOTO_SLOTS = [
    { key: 'face', label: 'Picture Face' },
    { key: 'body', label: 'Picture Body' },
    { key: 'poop', label: 'Picture Poop' },
    { key: 'vomit', label: 'Picture Vomit' },
];

// ── อัปโหลดรูปไป Supabase Storage ────────────────────────────────────────────
async function uploadImage(uri, slotKey) {
    // อ่านไฟล์เป็น base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    // สร้างชื่อไฟล์เป็น unique
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${slotKey}_${Date.now()}.${ext}`;
    const path = `uploads/${filename}`;

    // decode base64 → ArrayBuffer
    const byteArr = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, byteArr, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: false,
        });

    if (error) throw new Error(`Upload ${slotKey}: ${error.message}`);

    // คืน public URL
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
}

// ── PhotoCheck Screen ─────────────────────────────────────────────────────────
export default function PhotoCheck({ onNavigate, session }) {
    const [images, setImages] = useState([null, null, null, null]);
    const [loading, setLoading] = useState(false);

    // ── เปิด dialog เลือกแหล่งรูป ────────────────────────────────────────────
    const handlePickImage = async (index) => {
        Alert.alert(
            'เลือกรูปภาพ',
            PHOTO_SLOTS[index].label,
            [
                { text: '📷 ถ่ายรูป', onPress: () => openCamera(index) },
                { text: '🖼️ เลือกจากคลัง', onPress: () => openGallery(index) },
                { text: 'ยกเลิก', style: 'cancel' },
            ]
        );
    };

    const openCamera = async (index) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('ไม่ได้รับสิทธิ์', 'กรุณาอนุญาตให้แอปเข้าถึงกล้องในการตั้งค่า');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length > 0) {
            const updated = [...images];
            updated[index] = result.assets[0].uri;
            setImages(updated);
        }
    };

    const openGallery = async (index) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('ไม่ได้รับสิทธิ์', 'กรุณาอนุญาตให้แอปเข้าถึงคลังภาพในการตั้งค่า');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length > 0) {
            const updated = [...images];
            updated[index] = result.assets[0].uri;
            setImages(updated);
        }
    };

    // ── กด Start AI Check → upload → insert DB ────────────────────────────────
    const handleStartAiCheck = async () => {
        const hasAny = images.some(Boolean);
        if (!hasAny) {
            Alert.alert('ยังไม่มีรูป', 'กรุณาอัปโหลดรูปอย่างน้อย 1 ช่อง');
            return;
        }

        setLoading(true);
        try {
            // อัปโหลดแต่ละ slot ที่มีรูป (null → ไม่อัปโหลด)
            const urls = await Promise.all(
                PHOTO_SLOTS.map(async (slot, i) => {
                    if (!images[i]) return null;
                    return await uploadImage(images[i], slot.key);
                })
            );

            // เตรียมข้อมูลสำหรับ insert
            const userId = session?.user?.id ?? null;
            const row = {
                user_id: userId,
                image_face_url: urls[0],   // null ถ้าไม่ได้ส่ง
                image_body_url: urls[1],
                image_poop_url: urls[2],
                image_vomit_url: urls[3],
                status: 'pending',
            };

            const { error: dbError } = await supabase
                .from('ai_photo_checks')
                .insert([row]);

            if (dbError) throw new Error(dbError.message);

            Alert.alert(
                '✅ ส่งรูปสำเร็จ!',
                'ระบบได้รับรูปของคุณแล้ว กำลังวิเคราะห์...',
                [{ text: 'ตกลง', onPress: () => onNavigate('AnalysisResult') }]
            );
        } catch (err) {
            Alert.alert('เกิดข้อผิดพลาด', err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <HomeHeader
                profileImage={null}
                profileName={null}
                onSetting={() => onNavigate('UserInfo')}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                    paddingBottom: 40,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* 2x2 Grid */}
                <View style={{
                    backgroundColor: '#B2DFDB',
                    borderRadius: 25,
                    padding: 15,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 15,
                    width: '100%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    elevation: 5,
                }}>
                    {PHOTO_SLOTS.map((slot, index) => (
                        <TouchableOpacity
                            key={slot.key}
                            onPress={() => handlePickImage(index)}
                            disabled={loading}
                            style={{
                                width: '45%',
                                aspectRatio: 1,
                                backgroundColor: phoneCameraEnabled ? '#FFF' : '#F1F5F9',
                                borderRadius: 15,
                                borderStyle: images[index] ? 'solid' : 'dashed',
                                borderWidth: 2,
                                borderColor: images[index] ? '#00897B' : '#00796B',
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {images[index] ? (
                                <>
                                    <Image
                                        source={{ uri: images[index] }}
                                        style={{ width: '100%', height: '100%', borderRadius: 13 }}
                                        resizeMode="cover"
                                    />
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 0, left: 0, right: 0,
                                        backgroundColor: 'rgba(0,0,0,0.45)',
                                        paddingVertical: 5,
                                        alignItems: 'center',
                                    }}>
                                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>{slot.label}</Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={{
                                        backgroundColor: '#F0F4F8',
                                        borderRadius: 8,
                                        padding: 10,
                                        marginBottom: 5,
                                    }}>
                                        <Ionicons name="add" size={30} color="#B0BEC5" />
                                    </View>
                                    <Text style={{ fontSize: 12, color: '#00796B', fontWeight: '600' }}>Upload</Text>
                                    <Text style={{ fontSize: 10, color: '#00796B' }}>{slot.label}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25, paddingHorizontal: 10 }}>
                    <Ionicons name="information-circle" size={24} color="#546E7A" style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 12, color: '#546E7A', flex: 1 }}>
                        You can upload up to 4 images: an image of a body shape, a face, poop, and vomit.
                    </Text>
                </View>

                {/* Start AI Check Button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: loading ? '#80CBC4' : '#00897B',
                        width: '100%',
                        paddingVertical: 18,
                        borderRadius: 30,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 25,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 5,
                        elevation: phoneCameraEnabled ? 5 : 0,
                    }}
                    onPress={handleStartAiCheck}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                    ) : (
                        <Ionicons name="paw" size={24} color="#80CBC4" style={{ marginRight: 10 }} />
                    )}
                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>
                        {loading ? 'กำลังอัปโหลด...' : 'Start AI Check'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <BottomNav current="Home" onNavigate={onNavigate} />
        </SafeAreaView>
    );
}


