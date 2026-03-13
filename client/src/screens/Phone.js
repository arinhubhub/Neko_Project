import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
    ActivityIndicator,
    Modal,
    Platform,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { PanResponder } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './config/supabaseClient';
import AlertEngine from '../services/AlertEngine';
import { WebView } from 'react-native-webview';
import { CAMERA_API_BASE, CAMERA_STREAM_QUERY, CAMERA_STREAM_URL_MODEL, CAMERA_STREAM_URL_RAW } from '../config/cameraApi';

const { width } = Dimensions.get("window");

// 🚨 URL ของเซิร์ฟเวอร์สตรีมภาพ (ตรวจสอบ IP ให้ตรงกับคอมพิวเตอร์ของคุณ)
const VIDEO_STREAM_URL = `${CAMERA_STREAM_URL_RAW}?${CAMERA_STREAM_QUERY}`;
const VIDEO_SERVER_BASE = CAMERA_API_BASE;

// 🚨 ประกาศตัวแปรลิงก์กล้อง RTSP ที่นี่ (เพื่อเอาไปบันทึกลง Database)
const CAMERA_RTSP_URL = "rtsp://testt1:1234test@192.168.1.101:554/stream2"

const BRANDS = [
    { id: "tapo", name: "TP-Link Tapo", icon: "link-variant" },
    { id: "xiaomi", name: "Xiaomi Mi Home", icon: "shield-home" },
    { id: "ezviz", name: "EZVIZ", icon: "video-check" },
];

const isDemoLikeSource = (source = '') => {
    const s = String(source || '').toLowerCase();
    return (
        s.endsWith('.mp4') ||
        s.endsWith('.webm') ||
        s.endsWith('.mov') ||
        s.endsWith('.mkv') ||
        s.endsWith('.avi') ||
        s.includes('/storage/v1/object/public/')
    );
};

export default function Phone({
    session,
    onBack,
    onConfirm,
    initialStep,
    brand,
    returnTo,
    confirmBackToPrevious = false,
    mode = 'new',
    isHideBackButton = false,
    isHideSkipButton = false
}) {
    const previewFrameHeight = Math.max(220, Math.min(340, Math.round((width - 40) * 9 / 16)));
    const scopedStatusKey = session?.user?.id ? `camera_status:${session.user.id}` : 'camera_status';
    const scopedBrandKey = session?.user?.id ? `camera_brand:${session.user.id}` : 'camera_brand';
    const scopedCameraIdKey = session?.user?.id ? `camera_id:${session.user.id}` : 'camera_id';
    const scopedSetupKey = session?.user?.id ? `camera_setup_complete:${session.user.id}` : 'camera_setup_complete';
    const scopedZoneFeedingKey = session?.user?.id ? `camera_zone_feeding:${session.user.id}` : 'camera_zone_feeding';
    const scopedZoneLitterKey = session?.user?.id ? `camera_zone_litter:${session.user.id}` : 'camera_zone_litter';
    const scopedZoneSummaryKey = session?.user?.id ? `camera_zone_summary:${session.user.id}` : 'camera_zone_summary';

    const getStepNumber = (step) => {
        if (typeof step === 'number') return step;
        switch (step) {
            case 'intro': return 1;
            case 'login': return 1;
            case 'live': return 2;
            case 'zone_setup': return 3;
            case 'ready': return 4;
            default: return 1;
        }
    };

    const isUpdateMode = mode === 'update';
    const [currentStep, setCurrentStep] = useState(isUpdateMode ? 3 : getStepNumber(initialStep));
    const [selectedBrand, setSelectedBrand] = useState(brand || null);
    const [connected, setConnected] = useState(brand ? true : false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Zone States
    const [feedingZone, setFeedingZone] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [litterZone, setLitterZone] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [activeZoneType, setActiveZoneType] = useState('feeding');
    const [isDrawing, setIsDrawing] = useState(false);
    const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
    const [showAbortConnectModal, setShowAbortConnectModal] = useState(false);
    const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });
    const [inlineNotice, setInlineNotice] = useState(null);
    const startPoint = useRef({ x: 0, y: 0 });

    // ล็อค URL ไว้ไม่ให้ Re-render พร่ำเพรื่อ
    const [stableStreamUrl] = useState(`${VIDEO_STREAM_URL}&t=${new Date().getTime()}`);
    const [latestSnapshotUrl, setLatestSnapshotUrl] = useState(`${VIDEO_SERVER_BASE}/api/latest_frame.jpg?t=${Date.now()}`);
    const [zoneStatus, setZoneStatus] = useState({ camera_moved: false, zones_configured: 0 });
    const [hasDbCameraSource, setHasDbCameraSource] = useState(false);
    const [cameraGateChecked, setCameraGateChecked] = useState(false);
    const [dbStreamSource, setDbStreamSource] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const successAnim = useRef(new Animated.Value(0)).current;
    const stepAnim = useRef(new Animated.Value(0)).current;
    const brandScales = useRef({ tapo: new Animated.Value(1), xiaomi: new Animated.Value(1), ezviz: new Animated.Value(1) }).current;
    const loginRevealAnim = useRef(new Animated.Value(brand ? 1 : 0)).current;

    useEffect(() => {
        if (session?.user?.id) AlertEngine.setScope(session.user.id);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
        ]).start();
    }, []);

    useEffect(() => {
        // Reset transient UI state when switching account
        setCurrentStep(isUpdateMode ? 3 : getStepNumber(initialStep));
        setSelectedBrand(brand || null);
        setConnected(Boolean(brand));
        setInlineNotice(null);
        setHasDbCameraSource(false);
        setCameraGateChecked(false);
        setDbStreamSource(null);
    }, [session?.user?.id]);

    const resolveOwnerCamera = async () => {
        if (!session?.user?.id) return { camera: null, hasSource: false };
        const { data: dbCameras, error } = await supabase
            .from('cameras')
            .select('id, brand, mode, stream_source, is_primary')
            .eq('owner_id', session.user.id)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });
        if (error) throw error;

        const storedCameraId = (await AsyncStorage.getItem(scopedCameraIdKey)) || (await AsyncStorage.getItem('camera_id'));
        const ownedStored = (dbCameras || []).find((c) => c.id === storedCameraId) || null;
        const activeCamera = ownedStored || (dbCameras || [])[0] || null;
        const hasSource = Boolean(String(activeCamera?.stream_source || '').trim());
        setDbStreamSource(hasSource ? String(activeCamera?.stream_source || '').trim() : null);
        return { camera: activeCamera, hasSource };
    };

    const enforceDbCameraSourceGate = async ({ silent = false } = {}) => {
        try {
            const { camera, hasSource } = await resolveOwnerCamera();
            setHasDbCameraSource(hasSource);
            setCameraGateChecked(true);
            if (hasSource) {
                if (camera?.id) {
                    await AsyncStorage.setItem(scopedCameraIdKey, camera.id);
                    await AsyncStorage.setItem('camera_id', camera.id);
                }
                return true;
            }

            setConnected(false);
            setCurrentStep(1);
            setDbStreamSource(null);
            await AsyncStorage.setItem(scopedStatusKey, 'disconnected');
            await AsyncStorage.setItem('camera_status', 'disconnected');
            await AsyncStorage.setItem(scopedSetupKey, 'false');
            await AsyncStorage.setItem('camera_setup_complete', 'false');
            if (!silent) {
                showNotice('No camera source in DB. Please complete setup in Setcamera before continuing.', 'warning');
            }
            return false;
        } catch (e) {
            console.warn('Failed to validate camera source gate:', e);
            setHasDbCameraSource(false);
            setDbStreamSource(null);
            setCameraGateChecked(true);
            if (!silent) showNotice('Unable to validate camera source.', 'danger');
            return false;
        }
    };

    useEffect(() => {
        enforceDbCameraSourceGate({ silent: true });
    }, [session?.user?.id]);

    useEffect(() => {
        const loadSavedZones = async () => {
            try {
                const [savedFeeding, savedLitter] = await AsyncStorage.multiGet([scopedZoneFeedingKey, scopedZoneLitterKey]);
                if (savedFeeding?.[1]) setFeedingZone(JSON.parse(savedFeeding[1]));
                if (savedLitter?.[1]) setLitterZone(JSON.parse(savedLitter[1]));
            } catch (e) { console.error('Failed to load saved zones', e); }
        };
        loadSavedZones();
    }, [session?.user?.id, scopedZoneFeedingKey, scopedZoneLitterKey]);

    const refreshLatestSnapshot = async () => {
        setLatestSnapshotUrl(`${VIDEO_SERVER_BASE}/api/latest_frame.jpg?t=${Date.now()}`);
        try {
            const cameraId = (await AsyncStorage.getItem(scopedCameraIdKey)) || (await AsyncStorage.getItem('camera_id'));
            const url = cameraId
                ? `${VIDEO_SERVER_BASE}/api/zone_status?camera_id=${encodeURIComponent(cameraId)}`
                : `${VIDEO_SERVER_BASE}/api/zone_status`;
            const res = await fetch(url);
            const st = await res.json();
            setZoneStatus({
                camera_moved: Boolean(st?.camera_moved),
                zones_configured: Number(st?.zones_configured || 0),
            });
        } catch (_e) {
            // ignore
        }
    };

    useEffect(() => {
        refreshLatestSnapshot();
        const t = setInterval(refreshLatestSnapshot, 15000);
        return () => clearInterval(t);
    }, [session?.user?.id, scopedCameraIdKey]);

    useEffect(() => {
        if (selectedBrand) {
            Animated.spring(loginRevealAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
        }
    }, [selectedBrand]);

    const showNotice = (message, tone = 'warning') => setInlineNotice({ message, tone });

    // 🚨 ส่วนนี้ถูกแยกออกมาเพื่อบังคับการแสดงผลกล้องให้เหมือนกัน 100% ทุกจุด
    const LiveVideoFeed = () => {
        const isDemo = isDemoLikeSource(dbStreamSource);
        const activeStreamUrl = `${isDemo ? CAMERA_STREAM_URL_MODEL : CAMERA_STREAM_URL_RAW}?${CAMERA_STREAM_QUERY}&t=${new Date().getTime()}`;
        const streamHtml = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; }
      img { width:100%; height:100%; object-fit:cover; display:block; background:#000; }
    </style>
  </head>
  <body>
    <img src="${activeStreamUrl}" alt="live-stream" />
  </body>
</html>`;
        return (
            <WebView
                source={{ html: streamHtml, baseUrl: VIDEO_SERVER_BASE }}
                style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'transparent' }}
                scrollEnabled={false}
                bounces={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                originWhitelist={['*']}
                mixedContentMode="always"
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
            />
        );
    };

    const ensureCameraWithSource = async (brandId, desiredStatus = 'online') => {
        if (!session?.user?.id) { showNotice('Please sign in first.', 'warning'); return null; }
        const effectiveBrand = brandId || selectedBrand || 'custom';

        const payload = {
            owner_id: session.user.id,
            name: `${String(effectiveBrand).toUpperCase()} Camera`,
            brand: effectiveBrand,
            model: effectiveBrand,
            mode: 'multi_cat',
            assigned_by_user: true,
            is_ai_enabled: true,
            ai_mode: 'multi_cat',
            ai_connection_status: desiredStatus === 'online' ? 'online' : 'offline',
            is_primary: true,
        };

        try {
            const { data: existingCameras, error: fetchErr } = await supabase
                .from('cameras')
                .select('id, stream_source, is_primary')
                .eq('owner_id', session.user.id)
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: true });
            if (fetchErr) throw fetchErr;

            const activeCamera = (existingCameras || []).find((c) => String(c.stream_source || '').trim()) || null;

            let resolvedCameraId = null;

            if (activeCamera && activeCamera.id) {
                resolvedCameraId = activeCamera.id;
                const { error: updateErr } = await supabase.from('cameras').update(payload).eq('id', resolvedCameraId);
                if (updateErr) throw updateErr;
            } else {
                // Do not auto-create a connected camera/source for brand new accounts.
                showNotice('No camera configured yet. Please connect camera source in Setcamera first.', 'warning');
                setHasDbCameraSource(false);
                return null;
            }

            if (!resolvedCameraId) return null;
            await AsyncStorage.setItem(scopedCameraIdKey, resolvedCameraId);
            await AsyncStorage.setItem('camera_id', resolvedCameraId);
            setHasDbCameraSource(true);
            setInlineNotice(null);
            return resolvedCameraId;
        } catch (e) {
            console.warn('DB Error:', e);
            showNotice('Database sync failed.', 'danger');
            return null;
        }
    };

    const handleLogin = async () => {
        const gateOk = await enforceDbCameraSourceGate();
        if (!gateOk) {
            setConnected(false);
            return;
        }
        setIsConnecting(true);
        setTimeout(async () => {
            const resolvedCameraId = await ensureCameraWithSource(selectedBrand, 'online');
            if (!resolvedCameraId) {
                setIsConnecting(false);
                setConnected(false);
                return;
            }
            setIsConnecting(false);
            setConnected(true);
            // Connection established but not completed setup flow yet.
            await AsyncStorage.setItem(scopedStatusKey, 'disconnected');
            await AsyncStorage.setItem('camera_status', 'disconnected');
            await AsyncStorage.setItem(scopedBrandKey, selectedBrand || '');
            await AsyncStorage.setItem('camera_brand', selectedBrand || '');
            await AsyncStorage.setItem(scopedSetupKey, 'false');
            await AsyncStorage.setItem('camera_setup_complete', 'false');
            setCurrentStep(2);
            Animated.sequence([
                Animated.spring(successAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
                Animated.delay(200),
                Animated.spring(successAnim, { toValue: 1.05, useNativeDriver: true }),
                Animated.spring(successAnim, { toValue: 1, friction: 3, useNativeDriver: true })
            ]).start();
        }, 1500);
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem(scopedStatusKey, 'disconnected');
        await AsyncStorage.setItem('camera_status', 'disconnected');
        await AsyncStorage.setItem(scopedBrandKey, '');
        await AsyncStorage.setItem('camera_brand', '');
        await AsyncStorage.setItem(scopedSetupKey, 'true');
        await AsyncStorage.setItem('camera_setup_complete', 'true');
        onConfirm();
    };

    const handleNextStep = async () => {
        if (currentStep >= 2) {
            const gateOk = await enforceDbCameraSourceGate();
            if (!gateOk) return;
        }
        if (currentStep === 2) {
            const resolved = await ensureCameraWithSource(selectedBrand, connected ? 'online' : 'offline');
            if (!resolved) return;
        }
        Animated.timing(stepAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
            setCurrentStep(prev => Math.min(prev + 1, 4));
            stepAnim.setValue(0);
        });
    };

    const handlePrevStep = () => {
        const shouldReturnToSetcameraDirectly = returnTo === 'Setcamera';

        if (shouldReturnToSetcameraDirectly) {
            if (confirmBackToPrevious) {
                setShowAbortConnectModal(true);
                return;
            }
            onBack();
            return;
        }

        if (isUpdateMode) { onBack(); return; }
        if (currentStep === 1) onBack();
        else setCurrentStep(prev => prev - 1);
    };

    const handleUpdateZones = () => setShowUpdateConfirmModal(true);

    const normalizeRect = (zone, canvas) => {
        const w = Math.max(1, Number(canvas?.width || 1));
        const h = Math.max(1, Number(canvas?.height || 1));
        return {
            x: Math.max(0, Math.min(1, Number(zone?.x || 0) / w)),
            y: Math.max(0, Math.min(1, Number(zone?.y || 0) / h)),
            w: Math.max(0, Math.min(1, Number(zone?.w || 0) / w)),
            h: Math.max(0, Math.min(1, Number(zone?.h || 0) / h)),
        };
    };

    const rectToPolygon = (zone, zoneType) => {
        const n = normalizeRect(zone, previewSize);
        const x1 = n.x; const y1 = n.y;
        const x2 = Math.min(1, n.x + n.w); const y2 = Math.min(1, n.y + n.h);
        return {
            version: 1, coord_space: "normalized_xywh", shape: "rect", zone_type: zoneType,
            canvas: { width: Number(previewSize.width || 1), height: Number(previewSize.height || 1) },
            rect: { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) },
            points: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }],
        };
    };

    const persistZones = async () => {
        await AsyncStorage.multiSet([
            [scopedZoneFeedingKey, JSON.stringify(feedingZone)],
            [scopedZoneLitterKey, JSON.stringify(litterZone)],
            [scopedZoneSummaryKey, 'Feeding + Litter'],
            ['camera_zone_feeding', JSON.stringify(feedingZone)],
            ['camera_zone_litter', JSON.stringify(litterZone)],
            ['camera_zone_summary', 'Feeding + Litter'],
        ]);
        try {
            const cameraId = (await AsyncStorage.getItem(scopedCameraIdKey)) || (await AsyncStorage.getItem('camera_id'));
            if (!cameraId) return;
            let frameSig = null;
            let frameSigTs = null;
            try {
                const sigRes = await fetch(`${VIDEO_SERVER_BASE}/api/frame_signature`);
                const sigJson = await sigRes.json();
                frameSig = sigJson?.signature || null;
                frameSigTs = sigJson?.frame_ts || null;
            } catch (_e) { }
            await supabase.from('camera_zones').delete().eq('camera_id', cameraId).in('zone_type', ['food', 'litter']);

            const rows = [];
            if (feedingZone.w > 0 && feedingZone.h > 0) {
                const polygon = rectToPolygon(feedingZone, 'food');
                polygon.frame_signature = frameSig;
                polygon.frame_signature_ts = frameSigTs;
                rows.push({ camera_id: cameraId, zone_type: 'food', label: 'Feeding Zone', polygon });
            }
            if (litterZone.w > 0 && litterZone.h > 0) {
                const polygon = rectToPolygon(litterZone, 'litter');
                polygon.frame_signature = frameSig;
                polygon.frame_signature_ts = frameSigTs;
                rows.push({ camera_id: cameraId, zone_type: 'litter', label: 'Litter Zone', polygon });
            }

            if (rows.length > 0) await supabase.from('camera_zones').insert(rows);
        } catch (e) { console.warn('Failed to persist zones to DB:', e?.message || e); }
    };

    const handleConfirmUpdateZones = async () => {
        setShowUpdateConfirmModal(false);
        await persistZones();
        onConfirm();
    };

    const drawPanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            startPoint.current = { x: locationX, y: locationY };
            setIsDrawing(true);
            const setZone = activeZoneType === 'feeding' ? setFeedingZone : setLitterZone;
            setZone({ x: locationX, y: locationY, w: 0, h: 0 });
        },
        onPanResponderMove: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            const setZone = activeZoneType === 'feeding' ? setFeedingZone : setLitterZone;
            setZone(prev => {
                const newW = locationX - startPoint.current.x;
                const newH = locationY - startPoint.current.y;
                return {
                    x: newW > 0 ? startPoint.current.x : locationX,
                    y: newH > 0 ? startPoint.current.y : locationY,
                    w: Math.abs(newW),
                    h: Math.abs(newH),
                };
            });
        },
        onPanResponderRelease: () => setIsDrawing(false),
    }).panHandlers;

    const animateSelection = (brandId) => {
        Object.keys(brandScales).forEach(id => {
            Animated.spring(brandScales[id], { toValue: id === brandId ? 1.03 : 1, useNativeDriver: true, friction: 8 }).start();
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f5fffdff' }}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />
            <LinearGradient colors={["#f5fffdff", "#f5fffdff"]} style={{ flex: 1 }}>
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        {!isHideBackButton || currentStep > 1 ? (
                            <TouchableOpacity onPress={handlePrevStep} style={styles.backBtnStyle} activeOpacity={0.85}>
                                <Ionicons name="chevron-back" size={28} color="#333" />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.backBtnStyle} />
                        )}
                        <View style={styles.titleContainer}><Text style={styles.headerTitle}>Camera Setup</Text></View>
                        <View style={styles.headerIconBtn} />
                    </View>

                    {!isUpdateMode && (
                        <View style={styles.stepBar}>
                            {[1, 2, 3, 4].map((s) => (
                                <View key={s} style={[styles.stepDot, currentStep >= s && styles.stepDotActive]} />
                            ))}
                        </View>
                    )}

                    <Animated.View style={{ flex: 1, opacity: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} scrollEnabled={currentStep !== 3} bounces={currentStep !== 3}>

                            {/* Step 1 */}
                            {currentStep === 1 && (
                                <View>
                                    <View style={styles.hero}>
                                        <View style={styles.catIconContainer}><MaterialCommunityIcons name="cat" size={40} color="#00695C" /></View>
                                        <Text style={styles.title}>Choose Camera Brand</Text>
                                        <Text style={styles.subtitle}>Select the brand you are currently using</Text>
                                        {!!inlineNotice?.message && (
                                            <View style={[styles.inlineNotice, inlineNotice.tone === 'danger' ? styles.inlineNoticeDanger : styles.inlineNoticeWarning]}>
                                                <MaterialCommunityIcons name={inlineNotice.tone === 'danger' ? 'alert-circle-outline' : 'information-outline'} size={16} color={inlineNotice.tone === 'danger' ? '#B42318' : '#0F766E'} />
                                                <Text style={[styles.inlineNoticeText, inlineNotice.tone === 'danger' ? styles.inlineNoticeTextDanger : styles.inlineNoticeTextWarning]}>{inlineNotice.message}</Text>
                                            </View>
                                        )}
                                        {cameraGateChecked && !hasDbCameraSource && (
                                            <View style={[styles.inlineNotice, styles.inlineNoticeWarning]}>
                                                <MaterialCommunityIcons name="link-off" size={16} color="#0F766E" />
                                                <Text style={[styles.inlineNoticeText, styles.inlineNoticeTextWarning]}>
                                                    This account has no camera link/video in DB yet. Please set camera source first.
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.cardContainer}>
                                        {BRANDS.map((brand) => {
                                            const isSelected = selectedBrand === brand.id;
                                            return (
                                                <Animated.View key={brand.id} style={{ transform: [{ scale: brandScales[brand.id] || 1 }] }}>
                                                    <TouchableOpacity activeOpacity={0.9} onPress={() => { setSelectedBrand(brand.id); animateSelection(brand.id); }} style={[styles.brandCard, isSelected && styles.brandCardSelected]}>
                                                        <View style={styles.brandHeader}>
                                                            <View style={[styles.brandIconBg, isSelected && { backgroundColor: '#E0F2F1' }]}><MaterialCommunityIcons name={brand.icon} size={24} color={isSelected ? "#00695C" : "#90A4AE"} /></View>
                                                            <View style={{ flex: 1, marginLeft: 12 }}><Text style={[styles.brandName, isSelected && { color: '#00695C' }]}>{brand.name}</Text></View>
                                                        </View>
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            );
                                        })}
                                    </View>

                                    <Animated.View style={{ opacity: loginRevealAnim, transform: [{ translateY: loginRevealAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                                        {selectedBrand && !isConnecting && (
                                            <View style={{ marginTop: 30 }}>
                                                <Text style={[styles.subtitle, { marginBottom: 12 }]}>Log in to {BRANDS.find(b => b.id === selectedBrand)?.name} to link your camera feed.</Text>
                                                <TouchableOpacity style={[styles.loginButton, (!hasDbCameraSource || isConnecting) && { opacity: 0.55 }]} onPress={handleLogin} disabled={isConnecting || !hasDbCameraSource}>
                                                    <View style={styles.gradientBtn}>
                                                        <MaterialCommunityIcons name="link-variant-plus" size={18} color="#FFFFFF" />
                                                        <Text style={styles.loginText}>{hasDbCameraSource ? 'Connect Now' : 'No DB Source'}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        {isConnecting && (
                                            <View style={{ marginTop: 40, alignItems: 'center', justifyContent: 'center' }}>
                                                <ActivityIndicator size="large" color="#00897B" />
                                                <Text style={[styles.subtitle, { marginTop: 12, color: '#00695C', fontWeight: '600' }]}>Connecting to your camera...</Text>
                                            </View>
                                        )}
                                    </Animated.View>
                                </View>
                            )}

                            {/* Step 2: Live Feed */}
                            {currentStep === 2 && (
                                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                    <View>
                                        <View style={styles.hero}>
                                            <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE STREAM</Text></View>
                                            <Text style={styles.title}>Test Live Feed</Text>
                                            <Text style={styles.subtitle}>Verify the camera feed is working correctly.</Text>
                                            {!hasDbCameraSource && (
                                                <Text style={[styles.subtitle, { marginTop: 8, color: '#B42318', fontWeight: '600' }]}>
                                                    No camera source in DB. Please connect in Setcamera first.
                                                </Text>
                                            )}
                                        </View>

                                        {/* 🚨 แสดงกล้องผ่าน Component ย่อย */}
                                        <View style={[styles.previewCard, { overflow: 'hidden', height: previewFrameHeight }]}>
                                            {hasDbCameraSource ? (
                                                <LiveVideoFeed />
                                            ) : (
                                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                                                    <MaterialCommunityIcons name="camera-off-outline" size={28} color="#94A3B8" />
                                                    <Text style={[styles.subtitle, { marginTop: 8, textAlign: 'center' }]}>
                                                        No camera source in DB for this account.
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                    </View>
                                    <TouchableOpacity
                                        style={[styles.nextButton, { marginTop: 20 }, !hasDbCameraSource && { opacity: 0.55 }]}
                                        onPress={handleNextStep}
                                        disabled={!hasDbCameraSource}
                                    >
                                        <LinearGradient colors={["#00897B", "#00695C"]} style={styles.gradientNext}>
                                            <Text style={[styles.nextText, styles.nextTextLight]}>Next: Set Zones</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Step 3: Zone Setup */}
                            {currentStep === 3 && (
                                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                    <View>
                                        <View style={styles.hero}>
                                            <Text style={styles.title}>Set Detection Zones</Text>
                                            <Text style={styles.subtitle}>1. Choose a label 2. Tap and drag on the screen to draw the zone.</Text>
                                            <Text style={styles.zoneHintText}>If labels are not set, detection results may be unclear.</Text>
                                        </View>

                                        <View style={styles.tabContainer}>
                                            <View style={styles.tabWrapper}>
                                                <TouchableOpacity style={[styles.tabBtn, activeZoneType === 'feeding' && styles.tabActive]} onPress={() => setActiveZoneType('feeding')}>
                                                    <MaterialCommunityIcons name="food-apple" size={18} color={activeZoneType === 'feeding' ? '#00695C' : '#90A4AE'} />
                                                    <Text style={[styles.tabText, activeZoneType === 'feeding' && styles.tabTextActive]}>Feeding</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.tabBtn, activeZoneType === 'litter' && styles.tabActive]} onPress={() => setActiveZoneType('litter')}>
                                                    <MaterialCommunityIcons name="delete-outline" size={18} color={activeZoneType === 'litter' ? '#00695C' : '#90A4AE'} />
                                                    <Text style={[styles.tabText, activeZoneType === 'litter' && styles.tabTextActive]}>Litter Box</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.minimalWorkspace}>
                                            <View style={styles.zoneToolbar}>
                                                <TouchableOpacity style={styles.zoneRefreshBtn} onPress={refreshLatestSnapshot}>
                                                    <Ionicons name="refresh" size={14} color="#0F766E" />
                                                    <Text style={styles.zoneRefreshText}>Refresh Snapshot</Text>
                                                </TouchableOpacity>
                                                {zoneStatus.camera_moved && (
                                                    <View style={styles.zoneMovedBadge}>
                                                        <MaterialCommunityIcons name="alert" size={13} color="#B42318" />
                                                        <Text style={styles.zoneMovedText}>Camera moved - please set zones again</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {/* กรอบรับ Touch */}
                                            <View
                                                style={[styles.minimalPreviewBg, { overflow: 'hidden', position: 'relative' }]}
                                                onLayout={(evt) => {
                                                    const { width: w, height: h } = evt.nativeEvent.layout;
                                                    if (w > 0 && h > 0) setPreviewSize({ width: w, height: h });
                                                }}
                                                {...drawPanResponder}
                                            >
                                                {/* 🚨 เลเยอร์ชั้นล่าง: ใช้ภาพล่าสุดจากกล้องสำหรับ label zone ที่แม่นยำ */}
                                                <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                                                    <Image source={{ uri: latestSnapshotUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                                                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' }} />
                                                </View>

                                                {/* เลเยอร์ชั้นบน: วาดกรอบ */}
                                                <View style={styles.gridOverlay} pointerEvents="none" />

                                                {feedingZone.w > 0 && (
                                                    <View style={[styles.zoneFeedingMinimal, { top: feedingZone.y, left: feedingZone.x, width: feedingZone.w, height: feedingZone.h, borderColor: '#26A69A', borderStyle: 'dashed' }]} pointerEvents="none">
                                                        <View style={[styles.zoneTagMinimal, { backgroundColor: '#26A69A' }]}><MaterialCommunityIcons name="paw" size={10} color="#FFF" style={{ marginRight: 2 }} /><Text style={styles.zoneTagText}>Feeding</Text></View>
                                                    </View>
                                                )}

                                                {litterZone.w > 0 && (
                                                    <View style={[styles.zoneLitterMinimal, { top: litterZone.y, left: litterZone.x, width: litterZone.w, height: litterZone.h, borderColor: '#00897B', borderStyle: 'dashed' }]} pointerEvents="none">
                                                        <View style={[styles.zoneTagMinimal, { backgroundColor: '#00897B' }]}><MaterialCommunityIcons name="paw" size={10} color="#FFF" style={{ marginRight: 2 }} /><Text style={styles.zoneTagText}>Litter</Text></View>
                                                    </View>
                                                )}

                                                {isDrawing && (
                                                    <View style={styles.minimalDrawingBanner} pointerEvents="none">
                                                        <Text style={styles.minimalDrawingText}>Drawing {activeZoneType} area...</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={[styles.nextButton, { marginTop: 20 }]} onPress={isUpdateMode ? handleUpdateZones : handleNextStep}>
                                        <LinearGradient colors={["#00897B", "#00695C"]} style={styles.gradientNext}>
                                            <Text style={[styles.nextText, styles.nextTextLight]}>{isUpdateMode ? 'Update Zones' : 'Next: Complete'}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Step 4: Ready */}
                            {currentStep === 4 && (
                                <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 20 }}>
                                    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                                            <MaterialCommunityIcons name="check-circle" size={50} color="#4CAF50" />
                                        </View>
                                        <Text style={[styles.title, { fontSize: 28, marginBottom: 10 }]}>Ready to Monitor!</Text>
                                        <Text style={[styles.subtitle, { textAlign: 'center', paddingHorizontal: 20, fontSize: 16 }]}>Your AI health monitoring system is active and ready to keep an eye on your cat 🐾</Text>
                                    </View>
                                    <TouchableOpacity style={[styles.nextButton, { width: '100%' }]} onPress={async () => {
                                        await persistZones();
                                        await AsyncStorage.setItem(scopedSetupKey, 'true');
                                        await AsyncStorage.setItem('camera_setup_complete', 'true');
                                        await AsyncStorage.setItem(scopedStatusKey, 'connected');
                                        await AsyncStorage.setItem('camera_status', 'connected');
                                        onConfirm();
                                    }}>
                                        <LinearGradient colors={["#00897B", "#00695C"]} style={styles.gradientNext}>
                                            <Text style={[styles.nextText, styles.nextTextLight]}>Start Monitoring</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </Animated.View>

                    {currentStep === 1 && !isConnecting && !isUpdateMode && !isHideSkipButton && (
                        <TouchableOpacity style={styles.fixedBottomButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>Skip for now</Text>
                        </TouchableOpacity>
                    )}

                    <Modal transparent visible={showUpdateConfirmModal} animationType="fade" onRequestClose={() => setShowUpdateConfirmModal(false)}>
                        <View style={styles.confirmOverlay}>
                            <View style={styles.confirmCard}>
                                <Text style={styles.confirmTitle}>Confirm Update</Text>
                                <Text style={styles.confirmMessage}>Apply these detection zone changes?</Text>
                                <View style={styles.confirmActions}>
                                    <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowUpdateConfirmModal(false)}><Text style={styles.confirmCancelText}>Cancel</Text></TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmPrimaryBtn} onPress={handleConfirmUpdateZones}><Text style={styles.confirmPrimaryText}>Confirm</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <Modal transparent visible={showAbortConnectModal} animationType="fade" onRequestClose={() => setShowAbortConnectModal(false)}>
                        <View style={styles.confirmOverlay}>
                            <View style={styles.confirmCard}>
                                <Text style={styles.confirmTitle}>Stop This Connection?</Text>
                                <Text style={styles.confirmMessage}>This connection attempt will be cancelled and previous camera settings will be restored.</Text>
                                <View style={styles.confirmActions}>
                                    <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowAbortConnectModal(false)}><Text style={styles.confirmCancelText}>Keep Setup</Text></TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmPrimaryBtn} onPress={() => { setShowAbortConnectModal(false); onBack(); }}><Text style={styles.confirmPrimaryText}>Stop and Go Back</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5fffdff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: 'transparent' },
    headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
    backBtnStyle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    titleContainer: { flex: 1 },
    titleLogo: { fontSize: 20, fontWeight: '900', color: '#004D40', marginHorizontal: 3 },
    stepBar: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 10 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#2F6A62', textAlign: 'center', flex: 1 },
    stepIndicatorContainer: { flexDirection: 'row', gap: 8 },
    stepDot: { width: 12, height: 4, borderRadius: 2, backgroundColor: '#CFD8DC' },
    stepDotActive: { backgroundColor: '#00897B', width: 24 },
    hero: { alignItems: 'center', marginTop: 14, marginBottom: 18 },
    tabContainer: { paddingHorizontal: 14, marginBottom: 14 },
    tabWrapper: { flexDirection: 'row', backgroundColor: "#FFFFFF", borderRadius: 15, padding: 3, borderWidth: 1, borderColor: '#E6EFF0' },
    tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    tabActive: { backgroundColor: "#B2DFDB" },
    tabText: { fontSize: 13, fontWeight: "600", color: "#90A4AE" },
    tabTextActive: { color: "#00695C" },
    zoneToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, gap: 8 },
    zoneRefreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    zoneRefreshText: { color: '#0F766E', fontSize: 11, fontWeight: '700' },
    zoneMovedBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    zoneMovedText: { color: '#B42318', fontSize: 11, fontWeight: '700' },
    minimalWorkspace: { marginHorizontal: 14, borderRadius: 15, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EFF1', position: 'relative' },
    minimalPreviewBg: { height: 320, backgroundColor: '#F5FBFB', position: 'relative' },
    gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.05, borderWidth: 1, borderColor: '#00695C', borderStyle: 'dashed' },
    zoneFeedingMinimal: { position: 'absolute', borderWidth: 2, backgroundColor: 'rgba(38, 166, 154, 0.1)', borderRadius: 12 },
    zoneLitterMinimal: { position: 'absolute', borderWidth: 2, backgroundColor: 'rgba(0, 137, 123, 0.1)', borderRadius: 12 },
    zoneTagMinimal: { position: 'absolute', top: -12, left: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
    zoneTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    minimalDrawingBanner: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    minimalDrawingText: { color: '#37474F', fontSize: 12, fontWeight: '700' },
    liveBadge: { backgroundColor: '#F44336', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 8 },
    liveText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    catIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E6EFF0' },
    title: { fontSize: 20, fontWeight: "700", color: "#004D40", textAlign: 'center' },
    subtitle: { marginTop: 6, fontSize: 13, color: "#546E7A", textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },
    zoneHintText: { marginTop: 6, fontSize: 11, color: '#B45309', textAlign: 'center', paddingHorizontal: 20 },
    cardContainer: { gap: 10 },
    brandCard: { backgroundColor: "#fff", borderRadius: 15, padding: 13, borderWidth: 1, borderColor: "#E6EFF0" },
    brandCardSelected: { borderColor: "#BFDCD5", backgroundColor: '#FAFEFC' },
    brandHeader: { flexDirection: 'row', alignItems: 'center' },
    brandIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    brandName: { fontSize: 13, fontWeight: "700", color: "#37474F" },
    loginButton: { marginTop: 20 },
    gradientBtn: { paddingVertical: 12, borderRadius: 14, alignItems: "center", flexDirection: 'row', justifyContent: 'center', backgroundColor: '#0F766E', borderColor: '#0F766E', borderWidth: 1, gap: 8, shadowColor: '#0F766E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2 },
    loginText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
    inlineNotice: { marginTop: 10, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', width: '100%' },
    inlineNoticeWarning: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 },
    inlineNoticeDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
    inlineNoticeText: { marginLeft: 8, fontSize: 12, flex: 1, lineHeight: 16 },
    inlineNoticeTextWarning: { color: '#0F766E' },
    inlineNoticeTextDanger: { color: '#B42318' },
    skipButtonText: { color: "#90A4AE", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
    previewCard: { marginTop: 10, borderRadius: 24, backgroundColor: "#E5E7EB", overflow: "hidden", position: 'relative' },
    nextButton: { marginTop: 20 },
    gradientNext: { paddingVertical: 12, borderRadius: 14, alignItems: "center", flexDirection: 'row', justifyContent: 'center', borderColor: '#0F766E', borderWidth: 1, shadowColor: '#0F766E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 1 },
    nextText: { fontSize: 13, fontWeight: "700" },
    nextTextLight: { color: "#FFFFFF" },
    fixedBottomButton: { position: 'absolute', bottom: 40, left: 20, right: 20, paddingVertical: 10, alignItems: "center", zIndex: 10 },
    confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    confirmCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
    confirmTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
    confirmMessage: { fontSize: 12, color: '#4B5563', lineHeight: 17, marginBottom: 16 },
    confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    confirmCancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F5F5F5' },
    confirmCancelText: { color: '#374151', fontSize: 13, fontWeight: '600' },
    confirmPrimaryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#111827' },
    confirmPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
