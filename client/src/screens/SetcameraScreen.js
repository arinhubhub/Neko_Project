// ==============================================
// 1. ส่วนการนำเข้า Libraries และ Components
// ==============================================
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
    TextInput, Animated, LayoutAnimation, UIManager, Platform, Modal, Alert, PanResponder
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import supabase from './config/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertEngine from '../services/AlertEngine';
import { WebView } from 'react-native-webview';

const CAMERA_BRANDS = [
    { id: 'tapo', label: 'TP-Link Tapo', icon: 'link-variant', api: 'Tapo Cloud API' },
    { id: 'xiaomi', label: 'Xiaomi Mi Home', icon: 'shield-home', api: 'Xiaomi Cloud API' },
    { id: 'ezviz', label: 'EZVIZ', icon: 'video-check', api: 'EZVIZ Cloud API' },
    { id: 'custom', label: 'Other (Manual)', icon: 'cog-outline', api: 'Manual API setup' },
];

const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
// 🚨 กำหนด URL ของ Camera Server (Port 5000)
<<<<<<< HEAD
const VIDEO_STREAM_URL = 'http://192.168.1.100:5000/api/video_feed_raw?fps=15&quality=62&width=960';
const VIDEO_SERVER_BASE = VIDEO_STREAM_URL.split('/api')[0];
const CAMERA_RTSP_URL = 'rtsp://testt1:1234test@192.168.1.102:554/stream2';
=======
const VIDEO_STREAM_URL = 'http://192.168.1.131:5000/api/video_feed';
const CAMERA_RTSP_URL = 'rtsp://testt1:1234test@192.168.1.140:554/stream2';
>>>>>>> origin/main

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DecorativeCatEars = () => (
    <View style={styles.earContainer} pointerEvents="none">
        <View style={[styles.ear, styles.earLeft]} />
        <View style={[styles.ear, styles.earRight]} />
    </View>
);

// ==============================================
// 🚨 Component กล้อง: โครงสร้างเดียวกับ CameraScreen เป๊ะๆ
// ==============================================
// ใช้ React.memo คู่กับ () => true เพื่อ "ล็อคตาย" ไม่ให้ Component นี้โหลดใหม่เด็ดขาด (แก้กระพริบ 100%)
const LiveCameraStream = React.memo(({ streamUrl }) => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #E5E7EB; overflow: hidden; }
    img { width: 100%; height: 100%; object-fit: cover; }
  </style>
</head>
<body>
  <img src="${streamUrl}" onerror="console.log('Stream Failed')" />
</body>
</html>`;

    return (
        <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent, baseUrl: streamUrl }}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                scrollEnabled={false}
                bounces={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                mixedContentMode="always"
                allowsInlineMediaPlayback={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
}, () => true); // ล็อค: ห้าม Re-render กล้องนี้อีกต่อไป

// ==============================================
// 2. Main Component (หน้าจอตั้งค่า)
// ==============================================
export default function SetcameraScreen({ onNavigate, session, params }) {
    const defaultZoneLabel = 'Litter Box Zone';
    const CAMERA_SETUP_BACKUP_KEY = 'camera_prev_setup_backup';
    const [cameraStatus, setCameraStatus] = useState("disconnected");
    const [zoneLabel, setZoneLabel] = useState(defaultZoneLabel);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [latestSnapshotUrl, setLatestSnapshotUrl] = useState(`${VIDEO_SERVER_BASE}/api/latest_frame.jpg?t=${Date.now()}`);
    const [zoneStatus, setZoneStatus] = useState({ camera_moved: false, zones_configured: 0 });

    // ล็อค URL ไว้ให้โหลดแค่ครั้งเดียว
    const streamUrlRef = useRef(`${VIDEO_STREAM_URL}?t=${new Date().getTime()}`);

    const [monitoringMode, setMonitoringMode] = useState('multi');
    const [myCats, setMyCats] = useState([]);
    const [selectedCats, setSelectedCats] = useState([]);

    const [selectedCameraPreset, setSelectedCameraPreset] = useState(null);
    const [committedCameraBrand, setCommittedCameraBrand] = useState(null);
    const [customCameraBrand, setCustomCameraBrand] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [signalInfo, setSignalInfo] = useState({ pingMs: null, fps: null, frameAgeSec: null, lastCheckedAt: null });

    // Modals
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('Confirm Connection');
    const [confirmMessage, setConfirmMessage] = useState('Connect or update this camera?');
    const [isChangingConnectedBrand, setIsChangingConnectedBrand] = useState(false);
    const [isDuplicateConnectAttempt, setIsDuplicateConnectAttempt] = useState(false);
    const [cameraId, setCameraId] = useState(null);

    const successAnim = useRef(new Animated.Value(0)).current;
    const brandScales = useRef({ tapo: new Animated.Value(1), xiaomi: new Animated.Value(1), ezviz: new Animated.Value(1), custom: new Animated.Value(1) }).current;

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const animateSelection = (brandId) => {
        Object.keys(brandScales).forEach(id => {
            Animated.spring(brandScales[id], { toValue: id === brandId ? 1.03 : 1, useNativeDriver: true, friction: 8 }).start();
        });
    };

    useEffect(() => {
        const load = async () => {
            try {
                await AlertEngine.setScope(session?.user?.id || 'anonymous');
                const mode = await AsyncStorage.getItem('camera_monitoringMode');
                const savedCatsJson = await AsyncStorage.getItem('camera_selectedCats');
                const savedStatus = await AsyncStorage.getItem('camera_status');
                const savedBrand = await AsyncStorage.getItem('camera_brand');
                const savedCameraId = await AsyncStorage.getItem('camera_id');
                const savedZoneLabel = await AsyncStorage.getItem('camera_zone_summary');

                if (mode) setMonitoringMode(mode);
                if (savedStatus) setCameraStatus(savedStatus);
                if (savedBrand && savedStatus === 'connected') {
                    setSelectedCameraPreset(savedBrand);
                    setCommittedCameraBrand(savedBrand);
                    animateSelection(savedBrand);
                    setIsUpdateMode(true);
                    successAnim.setValue(1);
                } else {
                    setSelectedCameraPreset(null);
                    setCommittedCameraBrand(null);
                    animateSelection('');
                }
                if (savedCameraId) setCameraId(savedCameraId);
                if (savedZoneLabel) {
                    setZoneLabel(savedZoneLabel);
                }

                if (session?.user?.id) {
                    const { data: cats, error } = await supabase.from('cats').select('*').eq('owner_id', session.user.id);
                    if (error) throw error;
                    setMyCats(cats || []);

                    if (cats && cats.length === 1) {
                        const onlyCat = [cats[0].id];
                        setMonitoringMode('single');
                        setSelectedCats(onlyCat);
                        await AsyncStorage.setItem('camera_monitoringMode', 'single');
                        await AsyncStorage.setItem('camera_selectedCats', JSON.stringify(onlyCat));
                    } else if (savedCatsJson) {
                        setSelectedCats(JSON.parse(savedCatsJson));
                    } else if (cats && cats.length > 0) {
                        if (mode === 'single') setSelectedCats([cats[0].id]);
                        else setSelectedCats(cats.map(c => c.id));
                    }
                }
            } catch (e) { console.error("Load failed:", e); }
        };
        load();
    }, [session]);

    useEffect(() => {
        const restorePreviousSetupIfNeeded = async () => {
            if (!params?.restorePreviousSetup) return;
            try {
                const raw = await AsyncStorage.getItem(CAMERA_SETUP_BACKUP_KEY);
                if (!raw) return;
                const backup = JSON.parse(raw);
                const entries = Object.entries(backup?.storage || {}).filter(([, v]) => typeof v === 'string');
                if (entries.length > 0) await AsyncStorage.multiSet(entries);

                if (backup?.cameraStatus) setCameraStatus(backup.cameraStatus);
                if (backup?.selectedCameraPreset) {
                    setSelectedCameraPreset(backup.selectedCameraPreset);
                    setCommittedCameraBrand(backup.selectedCameraPreset);
                    animateSelection(backup.selectedCameraPreset);
                }
                if (backup?.monitoringMode) setMonitoringMode(backup.monitoringMode);
                if (Array.isArray(backup?.selectedCats)) setSelectedCats(backup.selectedCats);
                if (backup?.cameraId) setCameraId(backup.cameraId);
                if (backup?.zoneLabel) setZoneLabel(backup.zoneLabel);
                setIsUpdateMode(Boolean(backup?.selectedCameraPreset));

                await AsyncStorage.removeItem(CAMERA_SETUP_BACKUP_KEY);
            } catch (_e) { }
        };
        restorePreviousSetupIfNeeded();
    }, [params?.restorePreviousSetup]);

    const refreshLatestSnapshot = async () => {
        setLatestSnapshotUrl(`${VIDEO_SERVER_BASE}/api/latest_frame.jpg?t=${Date.now()}`);
        try {
            const targetCameraId = cameraId || await AsyncStorage.getItem('camera_id');
            const url = targetCameraId
                ? `${VIDEO_SERVER_BASE}/api/zone_status?camera_id=${encodeURIComponent(targetCameraId)}`
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
    }, [cameraId]);

    const syncCameraCatsAssignment = async (targetCameraId, catIds) => {
        if (!targetCameraId || !Array.isArray(catIds)) return;
        try {
            const uniqueCatIds = [...new Set(catIds)].filter(Boolean);
            await supabase.from('camera_cats').delete().eq('camera_id', targetCameraId);
            if (uniqueCatIds.length > 0) {
                const rows = uniqueCatIds.map((id, idx) => ({ camera_id: targetCameraId, cat_id: id, is_primary: idx === 0 }));
                await supabase.from('camera_cats').insert(rows);
            }
        } catch (err) { }
    };

    const clearCameraZonesInDb = async (targetCameraId) => {
        if (!targetCameraId) return;
        try { await supabase.from('camera_zones').delete().eq('camera_id', targetCameraId); } catch (err) { }
    };

    const upsertCameraConfig = async (overrides = {}) => {
        if (!session?.user?.id) return null;
        const effectiveBrand = overrides.brand || selectedCameraPreset || committedCameraBrand || 'custom';
        const modeValue = (overrides.mode || monitoringMode) === 'single' ? 'single_cat' : 'multi_cat';
        const connectionStatus = overrides.aiConnectionStatus || (cameraStatus === 'connected' ? 'online' : 'offline');

        try {
            const payload = {
                owner_id: session.user.id,
                name: `${String(effectiveBrand).toUpperCase()} Camera`,
                brand: effectiveBrand,
                model: effectiveBrand,
                mode: modeValue,
                assigned_by_user: true,
                is_ai_enabled: true,
                ai_mode: modeValue,
                ai_connection_status: connectionStatus,
                is_primary: true,
            };

            let resolvedCameraId = cameraId;
            if (resolvedCameraId) {
                await supabase.from('cameras').update(payload).eq('id', resolvedCameraId);
            } else {
                const insertPayload = {
                    ...payload,
                    stream_source: CAMERA_RTSP_URL,
                    stream_source_type: 'rtsp',
                };
                const { data: inserted } = await supabase.from('cameras').insert(insertPayload).select('id').single();
                resolvedCameraId = inserted?.id || null;
            }

            if (resolvedCameraId) {
                setCameraId(resolvedCameraId);
                await AsyncStorage.setItem('camera_id', resolvedCameraId);
                await syncCameraCatsAssignment(resolvedCameraId, selectedCats);
            }
            return resolvedCameraId;
        } catch (err) { return null; }
    };

    const updateCameraStatus = async (status) => {
        setCameraStatus(status);
        await AsyncStorage.setItem('camera_status', status);
        if (session?.user?.id && cameraId) {
            const aiConnectionStatus = status === 'connected' ? 'online' : 'offline';
            try { await supabase.from('cameras').update({ ai_connection_status: aiConnectionStatus }).eq('id', cameraId); } catch (err) { }
        }
    };

    const refreshSignalStatus = async () => {
        const startedAt = Date.now();
        try {
            const res = await fetch(`${VIDEO_SERVER_BASE}/api/health`);
            const h = await res.json();
            const pingMs = Math.max(1, Date.now() - startedAt);
            const isConnected = h?.camera_status === 'connected' || h?.camera === true;
            const nextStatus = isConnected ? 'connected' : 'disconnected';
            await updateCameraStatus(nextStatus);
            setSignalInfo({
                pingMs,
                fps: Number.isFinite(Number(h?.capture_fps)) ? Number(h.capture_fps) : null,
                frameAgeSec: Number.isFinite(Number(h?.frame_age_sec)) ? Number(h.frame_age_sec) : null,
                lastCheckedAt: new Date().toISOString(),
            });
        } catch (_e) {
            await updateCameraStatus('disconnected');
            setSignalInfo((prev) => ({ ...prev, lastCheckedAt: new Date().toISOString() }));
        }
    };

    const handleConnectCamera = () => {
        if (!selectedCameraPreset) return;
        const duplicateConnectedBrand = cameraStatus === 'connected' && committedCameraBrand && selectedCameraPreset === committedCameraBrand;
        if (duplicateConnectedBrand) {
            setIsDuplicateConnectAttempt(true);
            setIsChangingConnectedBrand(false);
            setConfirmTitle('Camera Already Connected');
            setConfirmMessage('This camera is already connected. Select another brand if you want to replace it.');
            setShowConfirmModal(true);
            return;
        }
        const changingConnectedBrand = cameraStatus === 'connected' && committedCameraBrand && selectedCameraPreset !== committedCameraBrand;
        setIsDuplicateConnectAttempt(false);
        setIsChangingConnectedBrand(changingConnectedBrand);
        setConfirmTitle(changingConnectedBrand ? 'Change Camera' : 'Confirm Connection');
        setConfirmMessage(changingConnectedBrand ? 'This will disconnect the current camera and reset setup.' : 'Connect or update this camera?');
        setShowConfirmModal(true);
    };

    const handleConfirmConnect = async () => {
        setShowConfirmModal(false);
        if (isDuplicateConnectAttempt) { setIsDuplicateConnectAttempt(false); return; }
        setIsConnecting(true);
        try {
            await wait(900);
            if (isChangingConnectedBrand) {
                const keys = ['camera_status', 'camera_brand', 'camera_monitoringMode', 'camera_selectedCats', 'camera_setup_complete', 'camera_zone_summary', 'camera_zone_feeding', 'camera_zone_litter', 'camera_id'];
                const pairs = await AsyncStorage.multiGet(keys);
                const storage = {};
                pairs.forEach(([k, v]) => { if (typeof v === 'string') storage[k] = v; });
                await AsyncStorage.setItem(CAMERA_SETUP_BACKUP_KEY, JSON.stringify({
                    storage,
                    cameraStatus,
                    selectedCameraPreset: committedCameraBrand,
                    monitoringMode,
                    selectedCats,
                    cameraId,
                    zoneLabel,
                }));
                await applyBrandChange(selectedCameraPreset);
            } else {
                await upsertCameraConfig({ brand: selectedCameraPreset, aiConnectionStatus: 'online' });
                await updateCameraStatus('connected');
                await AsyncStorage.setItem('camera_brand', selectedCameraPreset);
                await AsyncStorage.setItem('camera_setup_complete', 'true');
                setCommittedCameraBrand(selectedCameraPreset);
                setIsUpdateMode(true);
            }

            // หลังยืนยันเชื่อม/เปลี่ยนกล้อง พาไปหน้า Phone ที่ขั้นเชื่อมสำเร็จทันที
            onNavigate('Phone', {
                initialStep: 'live',
                brand: selectedCameraPreset,
                mode: 'new',
                returnTo: 'Setcamera',
                confirmBackToPrevious: Boolean(isChangingConnectedBrand),
                returnParams: isChangingConnectedBrand ? { restorePreviousSetup: true } : null,
            });

            Animated.sequence([
                Animated.spring(successAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
                Animated.delay(200),
                Animated.spring(successAnim, { toValue: 1.05, useNativeDriver: true }),
                Animated.spring(successAnim, { toValue: 1, friction: 3, useNativeDriver: true })
            ]).start();
        } catch (e) {
            console.error(e);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleCancelConnect = () => {
        setShowConfirmModal(false);
        setIsDuplicateConnectAttempt(false);
        if (isChangingConnectedBrand && committedCameraBrand) {
            setSelectedCameraPreset(committedCameraBrand);
            animateSelection(committedCameraBrand);
            return;
        }
        // ผู้ใช้ที่ยังไม่เคยเชื่อม: ถ้า Cancel ให้ไม่ค้างไฮไลท์ไว้
        if (!committedCameraBrand) {
            setSelectedCameraPreset(null);
            animateSelection('');
        }
    };

    const applyBrandChange = async (brandId) => {
        animateSelection(brandId);
        successAnim.setValue(0);
        await updateCameraStatus("disconnected");
        await AsyncStorage.multiRemove(['camera_monitoringMode', 'camera_selectedCats', 'camera_setup_complete', 'camera_zone_summary', 'camera_zone_feeding', 'camera_zone_litter']);
        if (cameraId) { await clearCameraZonesInDb(cameraId); }
        setMonitoringMode('multi');
        setSelectedCats(myCats.map((cat) => cat.id));
        setZoneLabel(defaultZoneLabel);
        setIsUpdateMode(false);
        await AsyncStorage.removeItem('camera_brand');
        setCommittedCameraBrand(null);
        await upsertCameraConfig({ brand: brandId, aiConnectionStatus: 'offline' });
    };

    const handleSelectCameraBrand = (brandId) => {
        if (brandId === selectedCameraPreset) return;
        setSelectedCameraPreset(brandId);
        animateSelection(brandId);
    };

    const handleTestConnection = () => {
        if (cameraStatus === 'connecting') return;
        setCameraStatus('connecting');
        refreshSignalStatus();
    };

    const toggleCatSelection = async (id) => {
        let newSelected = selectedCats;
        if (monitoringMode === 'single') {
            newSelected = [id];
        } else {
            if (selectedCats.includes(id)) {
                if (selectedCats.length > 1) newSelected = selectedCats.filter(catId => catId !== id);
            } else {
                newSelected = [...selectedCats, id];
            }
        }
        setSelectedCats(newSelected);
        await AsyncStorage.setItem('camera_selectedCats', JSON.stringify(newSelected));
        if (cameraStatus === 'connected' && cameraId) {
            await syncCameraCatsAssignment(cameraId, newSelected);
        }
    };

    const handleModeChange = async (mode) => {
        if (myCats.length === 1 && mode !== 'single') {
            Alert.alert('Single-cat mode only', 'This account has one cat, so monitoring mode stays on Single Cat.');
            return;
        }
        setMonitoringMode(mode);
        await AsyncStorage.setItem('camera_monitoringMode', mode);
        if (cameraStatus === 'connected') await upsertCameraConfig({ mode });
        if (mode === 'single') {
            if (myCats && myCats.length > 0) {
                const first = [myCats[0].id];
                setSelectedCats(first);
                await AsyncStorage.setItem('camera_selectedCats', JSON.stringify(first));
                if (cameraStatus === 'connected' && cameraId) await syncCameraCatsAssignment(cameraId, first);
            } else {
                setSelectedCats([]);
            }
        }
    };

    const isSameAsCurrentBrand =
        cameraStatus === 'connected' &&
        Boolean(committedCameraBrand) &&
        selectedCameraPreset === committedCameraBrand;

    useEffect(() => {
        refreshSignalStatus();
        const timer = setInterval(refreshSignalStatus, 15000);
        return () => clearInterval(timer);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#f5fffdff' }}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#f5fffdff', '#f5fffdff']} style={{ flex: 1 }}>
                <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => onNavigate('Camera')} style={styles.backBtnStyle} activeOpacity={0.85}>
                            <Ionicons name="chevron-back" size={28} color="#333" />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text style={styles.headerTitle}>Camera Settings</Text>
                        </View>
                        <View style={styles.headerIconBtn} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {/* 1. Connection Status Banner */}
                        <View style={styles.card}>
                            <View style={styles.connectionHeader}>
                                <View style={styles.statusRow}>
                                    <View style={[styles.statusDot, { backgroundColor: cameraStatus === 'connected' ? '#4CAF50' : cameraStatus === 'connecting' ? '#FFB300' : '#F44336' }]} />
                                    <Text style={styles.sectionTitleWhite}>
                                        {cameraStatus === 'connected' ? 'Camera Connected' : cameraStatus === 'connecting' ? 'Connecting...' : 'Camera Disconnected'}
                                    </Text>
                                </View>
                                <View style={[styles.statusIconBg, { backgroundColor: cameraStatus === 'connected' ? '#75c776ff' : cameraStatus === 'connecting' ? '#FFB300' : '#F44336' }]}>
                                    <View style={[styles.statusIconBg, { backgroundColor: cameraStatus === 'connected' ? '#4CAF50' : cameraStatus === 'connecting' ? '#FFB300' : '#F44336' }]}>
                                        <Ionicons name={cameraStatus === 'connected' ? "checkmark" : cameraStatus === "connecting" ? "sync" : "alert-outline"} size={16} color="#fff" />
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.statusDesc}>
                                {cameraStatus === 'connected'
                                    ? `Signal OK  Ping: ${signalInfo.pingMs ?? '--'} ms  FPS: ${signalInfo.fps ?? '--'}${signalInfo.frameAgeSec != null ? `  Frame age: ${signalInfo.frameAgeSec.toFixed(2)}s` : ''}`
                                    : cameraStatus === 'connecting'
                                        ? 'Checking camera signal...'
                                        : 'No signal received from this camera\nPlease check power, network, and RTSP source'}
                            </Text>

                            <TouchableOpacity
                                style={[styles.actionButtonGray, cameraStatus === 'connected' && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }, cameraStatus === 'connecting' && { opacity: 0.6 }, cameraStatus === 'disconnected' && { opacity: 0.65 }]}
                                onPress={handleTestConnection}
                                disabled={cameraStatus === 'connecting'}
                            >
                                <Text style={[styles.actionButtonText, cameraStatus === 'connected' && { color: '#fff' }]}>
                                    {cameraStatus === 'connected' ? 'Refresh Signal' : cameraStatus === 'connecting' ? 'Connecting...' : 'Test Connection'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 2. Live Preview */}
                        <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                            <View style={styles.previewHeader}>
                                <Ionicons name="videocam-outline" size={18} color="#1C1C1E" style={{ marginRight: 8 }} />
                                <Text style={styles.sectionTitleWhite}>Live Preview</Text>
                            </View>

                            <View style={styles.previewContent}>
                                <DecorativeCatEars />

                                {cameraStatus === 'connected' ? (
                                    <View style={styles.previewConnectedWrap}>
                                        <Image source={{ uri: latestSnapshotUrl }} style={styles.previewImage} resizeMode="cover" />

                                        <View style={styles.zoneMarkerFixed} pointerEvents="none">
                                            <Text style={styles.zoneMarkerText}>{zoneLabel}</Text>
                                        </View>
                                        {/* ลบตัวอัปเดตเวลาออก เปลี่ยนเป็นข้อความคงที่ */}
                                        <Text style={styles.scanUpdateText} pointerEvents="none">
                                            Latest Snapshot
                                        </Text>
                                        <View style={styles.snapshotToolbar}>
                                            <TouchableOpacity style={styles.snapshotRefreshBtn} onPress={refreshLatestSnapshot}>
                                                <Ionicons name="refresh" size={14} color="#0F766E" />
                                                <Text style={styles.snapshotRefreshText}>Refresh</Text>
                                            </TouchableOpacity>
                                            {zoneStatus.camera_moved && (
                                                <View style={styles.snapshotAlertBadge}>
                                                    <MaterialCommunityIcons name="alert" size={13} color="#B42318" />
                                                    <Text style={styles.snapshotAlertText}>Camera moved - re-set zones</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.previewPlaceholder}>
                                        <Text style={styles.errorText}>
                                            {cameraStatus === 'connecting' ? 'Connecting to camera...' : 'The camera in the litter box area has lost connection.'}
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.overlayButton, cameraStatus !== 'connected' && styles.overlayButtonDisabled]}
                                    disabled={cameraStatus !== 'connected'}
                                    onPress={() => {
                                        onNavigate('Phone', { initialStep: 'zone_setup', mode: 'update', returnTo: 'Setcamera', brand: selectedCameraPreset });
                                    }}
                                >
                                    <MaterialCommunityIcons name="crop-free" size={16} color={cameraStatus === 'connected' ? '#fff' : '#CBD5E1'} style={{ marginRight: 8 }} />
                                    <Text style={[styles.overlayButtonText, cameraStatus !== 'connected' && styles.overlayButtonTextDisabled]}>
                                        {cameraStatus === 'connected' ? 'Edit Label Zones' : 'Detection locked'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 3. Monitoring Mode */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Monitoring Mode</Text>
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity style={[styles.toggleBtn, monitoringMode === 'single' && styles.toggleBtnActive]} onPress={() => handleModeChange('single')}>
                                    <Text style={[styles.toggleText, monitoringMode === 'single' && styles.toggleTextActive]}>Single Cat</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleBtn, monitoringMode === 'multi' && styles.toggleBtnActive]} onPress={() => handleModeChange('multi')} disabled={myCats.length === 1}>
                                    <Text style={[styles.toggleText, monitoringMode === 'multi' && styles.toggleTextActive, myCats.length === 1 && { color: '#94A3B8' }]}>Multi cat mode</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.catSelectionRow}>
                                {myCats.map((cat) => (
                                    <TouchableOpacity key={cat.id} style={[styles.catItem, selectedCats.includes(cat.id) ? {} : { opacity: 0.5 }]} onPress={() => toggleCatSelection(cat.id)}>
                                        <View style={[styles.catAvatar, selectedCats.includes(cat.id) && styles.catAvatarSelected]}>
                                            {cat.image_url ? (
                                                <Image source={{ uri: cat.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                            ) : (
                                                <Image source={require('../../assets/cioncat.jpg')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                            )}
                                        </View>
                                        <Text style={styles.catName}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="information-circle" size={14} color="#555" />
                                <Text style={styles.infoText}>Used when {monitoringMode} cats share the same camera</Text>
                            </View>
                        </View>

                        {/* 4. Camera Hardware Accordion */}
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.accordionHeader} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsDropdownOpen(!isDropdownOpen); }} activeOpacity={0.7}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="webcam" size={22} color="#26A69A" style={{ marginRight: 10 }} />
                                    <Text style={styles.sectionTitle}>Camera Hardware & Brand</Text>
                                </View>
                                <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#00695C" />
                            </TouchableOpacity>

                            {isDropdownOpen && (
                                <Animated.View style={styles.accordionContent}>
                                    <Text style={styles.label}>Select camera brand</Text>
                                    <View style={styles.brandCardStack}>
                                        {CAMERA_BRANDS.map((brand) => {
                                            const isSelected = selectedCameraPreset === brand.id;
                                            return (
                                                <Animated.View key={brand.id} style={{ transform: [{ scale: brandScales[brand.id] || 1 }] }}>
                                                    <TouchableOpacity activeOpacity={0.9} onPress={() => handleSelectCameraBrand(brand.id)} style={[styles.brandCardSmall, isSelected && styles.brandCardSelected]}>
                                                        <View style={styles.brandHeader}>
                                                            <View style={[styles.brandIconBg, isSelected && { backgroundColor: '#B2DFDB' }]}><MaterialCommunityIcons name={brand.icon} size={20} color={isSelected ? "#004D40" : "#90A4AE"} /></View>
                                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                                <Text style={[styles.brandNameTitle, isSelected && { color: '#004D40' }]}>{brand.label}</Text>
                                                                <Text style={styles.brandApiSub}>Connect to app</Text>
                                                            </View>
                                                            {isSelected && <Ionicons name="checkmark-circle" size={20} color="#00695C" />}
                                                        </View>
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            );
                                        })}
                                    </View>
                                    {selectedCameraPreset === 'custom' && (
                                        <View style={styles.inputRow}>
                                            <MaterialCommunityIcons name="webcam" size={16} color="#555" style={{ marginRight: 8 }} />
                                            <TextInput style={styles.input} value={customCameraBrand} onChangeText={setCustomCameraBrand} placeholder="Type camera brand/model..." placeholderTextColor="#999" />
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButtonGray,
                                            { backgroundColor: '#00897B', borderColor: '#00897B' },
                                            (!selectedCameraPreset || isSameAsCurrentBrand) && { backgroundColor: '#9CA3AF', borderColor: '#9CA3AF' }
                                        ]}
                                        onPress={handleConnectCamera}
                                        disabled={isConnecting || !selectedCameraPreset || isSameAsCurrentBrand}
                                    >
                                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                                            {isConnecting
                                                ? 'Connecting...'
                                                : !selectedCameraPreset
                                                    ? 'Select Camera First'
                                                    : isSameAsCurrentBrand
                                                        ? 'Current Camera'
                                                        : isUpdateMode
                                                            ? 'Update Connection'
                                                            : 'Connect Camera'}
                                        </Text>
                                    </TouchableOpacity>
                                    {isSameAsCurrentBrand && (
                                        <Text style={styles.infoText}>Choose another brand to change camera.</Text>
                                    )}
                                </Animated.View>
                            )}
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <Modal transparent visible={showConfirmModal} animationType="fade" onRequestClose={handleCancelConnect}>
                        <View style={styles.confirmOverlay}>
                            <View style={styles.confirmCard}>
                                <Text style={styles.confirmTitle}>{confirmTitle}</Text>
                                <Text style={styles.confirmMessage}>{confirmMessage}</Text>
                                <View style={styles.confirmActions}>
                                    <TouchableOpacity style={styles.confirmCancelBtn} onPress={handleCancelConnect}><Text style={styles.confirmCancelText}>Cancel</Text></TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmPrimaryBtn} onPress={handleConfirmConnect}><Text style={styles.confirmPrimaryText}>Confirm</Text></TouchableOpacity>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: '#f5fffdff' },
    backButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
    backBtnStyle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    titleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
    titleLogo: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#00695C', marginHorizontal: 2 },
    headerTitle: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#2F6A62', textAlign: 'center', flex: 1 },
    content: { padding: 12, paddingTop: 0 },
    card: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0F2F1', borderRadius: 12, padding: 12, marginBottom: 10, overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionTitle: { color: '#1C1C1E', fontSize: 13, fontWeight: '700', marginBottom: 10 },
    sectionTitleWhite: { color: '#1C1C1E', fontSize: 13, fontWeight: '700' },
    connectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    statusIconBg: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statusDesc: { color: '#3A3A3C', fontSize: 12, marginBottom: 16, lineHeight: 18 },
    actionButtonGray: { backgroundColor: '#EEF2FF', paddingVertical: 10, borderRadius: 999, alignItems: 'center', borderWidth: 1, borderColor: '#D6E4FF' },
    actionButtonText: { color: '#1A56C5', fontWeight: '600' },
    previewHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F8FAFC' },
    previewContent: { height: 180, backgroundColor: '#ECEFF1', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    previewPlaceholder: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    previewConnectedWrap: { width: '100%', height: '100%', backgroundColor: '#E5E7EB', overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    snapshotToolbar: { position: 'absolute', left: 10, right: 10, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
    snapshotRefreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    snapshotRefreshText: { color: '#0F766E', fontSize: 11, fontWeight: '700' },
    snapshotAlertBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
    snapshotAlertText: { color: '#B42318', fontSize: 10, fontWeight: '700' },
    zoneMarkerFixed: { position: 'absolute', top: 24, left: 18, backgroundColor: 'rgba(0, 105, 92, 0.9)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    zoneMarkerText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    scanUpdateText: { position: 'absolute', right: 12, bottom: 56, color: '#FFFFFF', fontSize: 10, backgroundColor: 'rgba(0, 0, 0, 0.45)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    confirmCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
    confirmTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
    confirmMessage: { fontSize: 13, color: '#4B5563', lineHeight: 19, marginBottom: 16 },
    confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    confirmCancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F5F5F5' },
    confirmCancelText: { color: '#374151', fontSize: 13, fontWeight: '600' },
    confirmPrimaryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#111827' },
    confirmPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    errorText: { color: '#374151', textAlign: 'center', fontSize: 12, fontWeight: '600' },
    errorSubText: { color: '#6B7280', textAlign: 'center', fontSize: 10, marginTop: 4 },
    overlayButton: { position: 'absolute', bottom: 16, backgroundColor: '#3C8FDD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    overlayButtonDisabled: { backgroundColor: '#9CA3AF' },
    overlayButtonText: { color: '#fff', fontSize: 12 },
    overlayButtonTextDisabled: { color: '#E5E7EB' },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#E0F2F1', borderRadius: 20, padding: 4, marginBottom: 16 },
    toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16 },
    toggleBtnActive: { backgroundColor: '#B2DFDB', elevation: 2 },
    toggleText: { color: '#00695C', fontSize: 12 },
    toggleTextActive: { color: '#004D40', fontWeight: 'bold' },
    catSelectionRow: { flexDirection: 'row', marginBottom: 16 },
    catItem: { alignItems: 'center', marginRight: 16 },
    catAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ddd', marginBottom: 4, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
    catAvatarSelected: { borderColor: '#26A69A' },
    catName: { color: '#333', fontSize: 12, fontWeight: '600' },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    infoText: { color: '#6D6D72', fontSize: 10, marginLeft: 6 },
    label: { color: '#3A3A3C', fontSize: 12, marginTop: 8, marginBottom: 4, fontWeight: '600' },
    dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, height: 44 },
    dropdownHeaderText: { color: '#1F2937', fontSize: 12 },
    dropdownListContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: 4, overflow: 'hidden' },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    dropdownItemText: { color: '#555', fontSize: 12 },
    dropdownItemTextSelected: { color: '#00695C', fontWeight: 'bold' },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    input: { flex: 1, height: 40, color: '#333', fontSize: 12 },
    copyButton: { backgroundColor: '#3C8FDD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    copyText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    accordionContent: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 15 },
    brandCardStack: { gap: 10, marginBottom: 16 },
    brandCardSmall: { backgroundColor: "#fff", borderRadius: 13, padding: 10, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.05)", shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    brandCardSelected: { borderColor: "#26A69A", backgroundColor: "#F0FAF9" },
    brandHeader: { flexDirection: 'row', alignItems: 'center' },
    brandIconBg: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    brandNameTitle: { fontSize: 13, fontWeight: "700", color: "#546E7A" },
    brandApiSub: { fontSize: 10, color: "#78909C", marginTop: 1 },
    earContainer: { position: 'absolute', top: -8, left: 12, right: 12, height: 12, flexDirection: 'row', justifyContent: 'space-between', zIndex: -1 },
    ear: { width: 20, height: 16, backgroundColor: '#ECEFF1', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
    earLeft: { transform: [{ rotate: '-15deg' }] },
    earRight: { transform: [{ rotate: '15deg' }] },
});
