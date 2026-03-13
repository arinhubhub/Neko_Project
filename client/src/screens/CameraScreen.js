import React, { useRef, useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './config/supabaseClient';
import HomeHeader from '../components/HomeHeader';

import { WebView } from 'react-native-webview'; // <-- ต้องมี WebView
import { CAMERA_API_BASE, CAMERA_STREAM_QUERY, CAMERA_STREAM_URL_MODEL, CAMERA_STREAM_URL_RAW } from '../config/cameraApi';
import BottomNav from '../components/BottomNav';
import useCameraData from '../hooks/useCameraData';
import ActivityLevelChart from '../components/ActivityLevelChart';
import AlertEngine, { AlertEvents } from '../services/AlertEngine';
import PendingIdentityBanner from '../components/alert/PendingIdentityBanner';
import { GlobalAlertQueueContext } from '../services/GlobalAlertQueue';

const { width } = Dimensions.get('window');

const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const RTSP_URL = "http://192.168.1.106:554/stream2"
// 🚨 เปลี่ยน 192.168.1.159 เป็น IP จริงของคอมพิวเตอร์คุณเสมอ
const VIDEO_STREAM_URL = CAMERA_STREAM_URL_RAW;
const VIDEO_STREAM_QUERY = CAMERA_STREAM_QUERY;
const VIDEO_SERVER_BASE = CAMERA_API_BASE;

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

// Create animated components
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const ButtonScale = ({ children, onPress, style, disabled = false }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={disabled ? 1 : 0.9}
      onPress={disabled ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[style, disabled && { opacity: 0.45 }, { transform: [{ scale: scaleValue }] }]}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
};

const DecorativeCatEars = () => (
  <View style={styles.earContainer} pointerEvents="none">
    <View style={[styles.ear, styles.earLeft]} />
    <View style={[styles.ear, styles.earRight]} />
  </View>
);

export default function CameraScreen({ onNavigate, session }) {
  const [showSetupIntro, setShowSetupIntro] = useState(null);
  const [requireSetcamera, setRequireSetcamera] = useState(false);

  const [cameraStatus, setCameraStatus] = useState('disconnected');
  const [currentCamera, setCurrentCamera] = useState(1);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [hasCriticalAlert, setHasCriticalAlert] = useState(false);
  const [pendingIdentityCount, setPendingIdentityCount] = useState(0);
  const [selectedCat, setSelectedCat] = useState(null);
  const [environment, setEnvironment] = useState({ temperature: null, humidity: null });
  const [proStats, setProStats] = useState({ ping: null, bitrate: null, fps: null });
  const [cameraModeFromDb, setCameraModeFromDb] = useState(null);
  const [livePreviewUri, setLivePreviewUri] = useState(null);
  const [quickSummary, setQuickSummary] = useState({ eventsToday: 0, lastDetected: '--' });
  // ดึง stream_source จาก DB
  const [dbStreamUrl, setDbStreamUrl] = useState(null);
  const [streamWebViewUrl] = useState(`${VIDEO_STREAM_URL}?${VIDEO_STREAM_QUERY}&t=${Date.now()}`);
  const streamWebViewHtml = useMemo(() => `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }
      .wrap {
        width: 100%;
        height: 100%;
        background: #000;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        background: #000;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <img src="${streamWebViewUrl}" alt="live-stream" />
    </div>
  </body>
</html>`, [streamWebViewUrl]);
  const modelStreamUrl = useMemo(() => `${CAMERA_STREAM_URL_MODEL}?${VIDEO_STREAM_QUERY}&t=${Date.now()}`, []);
  const modelStreamHtml = useMemo(() => `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }
      .wrap {
        width: 100%;
        height: 100%;
        background: #000;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        background: #000;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <img src="${modelStreamUrl}" alt="model-stream" />
    </div>
  </body>
</html>`, [modelStreamUrl]);
  const streamSource = useMemo(() => ({
    html: isDemoLikeSource(dbStreamUrl) ? modelStreamHtml : streamWebViewHtml,
    baseUrl: VIDEO_SERVER_BASE,
  }), [dbStreamUrl, modelStreamHtml, streamWebViewHtml]);
  const lastAppliedSourceRef = useRef('');
  const cameraScreenCatKey = session?.user?.id
    ? `camera_screen_selected_cat_id:${session.user.id}`
    : 'camera_screen_selected_cat_id';
  const scopedCameraIdKey = session?.user?.id
    ? `camera_id:${session.user.id}`
    : 'camera_id';
  const scopedSetupKey = session?.user?.id
    ? `camera_setup_complete:${session.user.id}`
    : 'camera_setup_complete';
  const healthMissCountRef = useRef(0);
  const lastConnectedAtRef = useRef(0);

  const { data, refetch } = useCameraData(session, cameraStatus, selectedCat?.id || null, { cameraOnly: true });
  const hasCameraAnalytics = data?.meta?.source === 'camera' && data?.meta?.hasCameraDetections;
  const isDisplayConnected = !requireSetcamera && cameraStatus === 'connected';
  const frameWidth = width - 28; // scrollContent horizontal padding (14 + 14)
  const videoFrameHeight = Math.max(220, Math.min(340, Math.round(frameWidth * 9 / 16)));

  // Animations
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Retrieve global queue context to open manual queue
  const { openPendingQueue } = useContext(GlobalAlertQueueContext);

  // Entry Animation
  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, []);

  // Pulse Animation for Live Status
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const showCameraIssueBanner = hasCriticalAlert && cameraStatus !== 'connected';

  // Animation for sticky banner
  useEffect(() => {
    if (showCameraIssueBanner) {
      Animated.spring(bannerAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    } else {
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showCameraIssueBanner]);

  // Subscribe to AlertEngine
  useEffect(() => {
    // Initial load
    setUnreadAlerts(AlertEngine.getUnreadCount());
    setHasCriticalAlert(AlertEngine.hasActiveCritical());
    setPendingIdentityCount(AlertEngine.getPendingIdentityCount());

    const handler = (data) => {
      setUnreadAlerts(data.unreadCount);
      setHasCriticalAlert(data.hasCritical);
      setPendingIdentityCount(data.pendingIdentityCount);
    };

    AlertEngine.on(AlertEvents.UPDATED, handler);
    return () => AlertEngine.off(AlertEvents.UPDATED, handler);
  }, []);

  // ผู้ใช้ใหม่ (camera_setup_complete ยังไม่ถูก set) -> หน้า Phone.js ทันที
  useEffect(() => {
    if (showSetupIntro === true) {
      onNavigate('Phone', { initialStep: 'intro' });
    }
  }, [showSetupIntro]);

  useEffect(() => {
    const applySourceToBackend = async ({ sourceUrl, cameraId, ownerId }) => {
      const cleanSource = String(sourceUrl || '').trim();
      if (!cleanSource || !cameraId || !ownerId) return;
      const sourceType = cleanSource ? (isDemoLikeSource(cleanSource) ? 'demo' : 'live') : 'live';
      const sourceKey = `${sourceType}|${cameraId}|${cleanSource || 'DEFAULT_LIVE'}`;
      if (lastAppliedSourceRef.current === sourceKey) return;

      // Avoid forcing backend source restart when it is already set correctly.
      try {
        const statusRes = await fetch(`${VIDEO_SERVER_BASE}/api/source_status`);
        const status = await statusRes.json();
        const backendKey = `${status?.source_type || 'live'}|${status?.camera_id || ''}|${String(status?.source || '').trim() || 'DEFAULT_LIVE'}`;
        if (backendKey === sourceKey) {
          lastAppliedSourceRef.current = sourceKey;
          return;
        }
      } catch (_e) {
        // continue to set_source fallback
      }

      await fetch(`${VIDEO_SERVER_BASE}/api/set_source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: sourceType,
          source_url: cleanSource || null,
          camera_id: cameraId || null,
          owner_id: ownerId || null,
        })
      });

      lastAppliedSourceRef.current = sourceKey;
    };

    const fetchStatusAndSetup = async () => {
      try {
        const hasSetup = await AsyncStorage.getItem(scopedSetupKey);
        const isSetupComplete = String(hasSetup || '').toLowerCase() === 'true';
        let hasValidSource = false;
        const storedCameraId =
          (await AsyncStorage.getItem(scopedCameraIdKey)) ||
          (await AsyncStorage.getItem('camera_id'));
        let cameraId = storedCameraId;

        if (session?.user?.id) {
          // -- Fetch cameras and always resolve active camera from owner_id --
          const { data: userCameras, error: camErr } = await supabase
            .from('cameras')
            .select('id, name, mode, stream_source, is_primary')
            .eq('owner_id', session.user.id)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });

          if (camErr) {
            console.warn('camera query failed:', camErr?.message || camErr);
          }

          if (userCameras && userCameras.length > 0) {
            const ownedStoredCam = userCameras.find((c) => c.id === storedCameraId);
            const activeCam = ownedStoredCam || userCameras[0];
            cameraId = activeCam.id;
            await AsyncStorage.setItem(scopedCameraIdKey, cameraId);
            await AsyncStorage.setItem('camera_id', cameraId);
            if (activeCam?.mode) {
              const normalized = String(activeCam.mode || '').toLowerCase().includes('single') ? 'single' : 'multi';
              setCameraModeFromDb(normalized);
            }

            const source = String(activeCam.stream_source || '').trim();
            hasValidSource = Boolean(source);
            setDbStreamUrl(hasValidSource ? source : null);
            if (!(hasValidSource && isSetupComplete)) {
              setCameraStatus('disconnected');
            }

            if (hasValidSource && isSetupComplete) {
              try {
                await applySourceToBackend({
                  sourceUrl: source,
                  cameraId,
                  ownerId: session.user.id,
                });
              } catch (e) {
                console.log('Failed to update python backend source', e);
              }
            }
          } else {
            setCameraStatus('disconnected');
            setDbStreamUrl(null);
            hasValidSource = false;
            await AsyncStorage.removeItem(scopedCameraIdKey);
            await AsyncStorage.removeItem('camera_id');
          }
        }

        if (cameraId && !hasValidSource && session?.user?.id) {
          const { data: camRow } = await supabase
            .from('cameras')
            .select('stream_source')
            .eq('id', cameraId)
            .eq('owner_id', session.user.id)
            .maybeSingle();
          const source = (camRow?.stream_source || '').trim();
          hasValidSource = Boolean(source);
          // เก็บ URL เพื่อใส่ใน WebView — ไม่เปลี่ยน connection logic
          if (hasValidSource) {
            setDbStreamUrl(source);
            if (!isSetupComplete) {
              setCameraStatus('disconnected');
            }
            if (isSetupComplete) {
              try {
                await applySourceToBackend({
                  sourceUrl: source,
                  cameraId,
                  ownerId: session.user.id,
                });
              } catch (e) {
                console.log('Failed to update python backend source (fallback)', e);
              }
            }
          } else {
            // ไม่มี source สำหรับ account นี้: บล็อกกล้องไว้จนกว่าจะตั้งค่าใน Setcamera
            setDbStreamUrl(null);
            setCameraStatus('disconnected');
          }
        }

        setRequireSetcamera(!(hasValidSource && isSetupComplete));
        setShowSetupIntro(prev => {
          const shouldShow = !isSetupComplete;
          return (prev === null || prev !== shouldShow) ? shouldShow : prev;
        });

      } catch (e) {
        console.error("Failed to fetch status from storage:", e);
      }
    };

    fetchStatusAndSetup();
    const interval = setInterval(fetchStatusAndSetup, 25000);
    return () => clearInterval(interval);
  }, [session?.user?.id, scopedCameraIdKey, scopedSetupKey]);

  useEffect(() => {
    let timer;
    const pollBackendHealth = async () => {
      // Guard: if user has not connected camera for this account yet,
      // do not allow backend health to flip UI to connected.
      if (requireSetcamera) {
        setCameraStatus('disconnected');
        return;
      }
      try {
        const startedAt = Date.now();
        const res = await fetch(`${VIDEO_SERVER_BASE}/api/health`);
        const h = await res.json();
        const pingMs = Math.max(1, Date.now() - startedAt);
        setProStats((prev) => ({
          ...prev,
          ping: pingMs,
          fps: Number.isFinite(Number(h?.capture_fps)) ? Number(h.capture_fps) : prev.fps,
        }));
        if (h?.camera_status === 'connected' || h?.camera === true) {
          healthMissCountRef.current = 0;
          lastConnectedAtRef.current = Date.now();
          setCameraStatus('connected');
        } else if (h?.camera_status === 'disconnected') {
          healthMissCountRef.current += 1;
          // Debounce disconnected to avoid stream flicker/remount on transient drops.
          if (healthMissCountRef.current >= 3 && (Date.now() - lastConnectedAtRef.current) > 15000) {
            setCameraStatus('disconnected');
          } else {
            setCameraStatus('disconnected');
          }
        } else {
          // Unknown status: keep last known state, but avoid forcing connected.
          if (healthMissCountRef.current >= 3) {
            setCameraStatus('disconnected');
          }
        }
      } catch (_e) {
        healthMissCountRef.current += 1;
        // If backend is unreachable, stay disconnected to prevent flip-flopping.
        setCameraStatus('disconnected');
      }
    };

    pollBackendHealth();
    timer = setInterval(pollBackendHealth, 5000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [requireSetcamera]);

  useEffect(() => {
    let timer;
    const fetchEnvironment = async () => {
      try {
        const cameraId =
          (await AsyncStorage.getItem(scopedCameraIdKey)) ||
          (await AsyncStorage.getItem('camera_id'));
        const url = cameraId
          ? `${VIDEO_SERVER_BASE}/api/environment?camera_id=${encodeURIComponent(cameraId)}`
          : `${VIDEO_SERVER_BASE}/api/environment`;
        const res = await fetch(url);
        const env = await res.json();
        if (env?.status === 'ok') {
          setEnvironment({
            temperature: Number(env.temperature),
            humidity: Number(env.humidity),
          });
        } else {
          setEnvironment({ temperature: null, humidity: null });
        }
      } catch (_e) {
        setEnvironment({ temperature: null, humidity: null });
      }
    };

    fetchEnvironment();
    timer = setInterval(fetchEnvironment, 5 * 60 * 1000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session?.user?.id, scopedCameraIdKey]);

  useEffect(() => {
    let timer;
    const fetchLatestPreview = async () => {
      try {
        const cameraId =
          (await AsyncStorage.getItem(scopedCameraIdKey)) ||
          (await AsyncStorage.getItem('camera_id'));
        if (!cameraId) {
          setLivePreviewUri(null);
          return;
        }

        const { data: latest, error } = await supabase
          .from('ai_cat_identity_review')
          .select('snapshot_url, occurred_at')
          .eq('camera_id', cameraId)
          .not('snapshot_url', 'is', null)
          .order('occurred_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Failed to load live preview:', error?.message || error);
          return;
        }

        const uri = latest?.snapshot_url || null;
        if (uri && /^https?:\/\//i.test(uri)) {
          setLivePreviewUri(uri);
        } else {
          setLivePreviewUri(null);
        }
      } catch (e) {
        console.warn('Failed to fetch live preview:', e?.message || e);
      }
    };

    if (cameraStatus === 'connected') {
      fetchLatestPreview();
      timer = setInterval(fetchLatestPreview, 6000);
    } else {
      setLivePreviewUri(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cameraStatus, scopedCameraIdKey]);

  // Poll camera analytics only when camera is connected
  useEffect(() => {
    if (!isDisplayConnected) return undefined;
    const timer = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(timer);
  }, [isDisplayConnected, refetch]);

  // Sync selected cat with HomeHeader dropdown
  useEffect(() => {
    const fetchSelectedCat = async () => {
      if (session?.user?.id) {
        const { data: catRows } = await supabase
          .from('cats')
          .select('*')
          .eq('owner_id', session.user.id);

        if (catRows && catRows.length > 0) {
          const scopedLastCatKey = `last_selected_cat_id:${session.user.id}`;
          const lastCatId =
            (await AsyncStorage.getItem(cameraScreenCatKey)) ||
            (await AsyncStorage.getItem(`selectedCatId:${session.user.id}`)) ||
            (await AsyncStorage.getItem(scopedLastCatKey)) ||
            (await AsyncStorage.getItem('selectedCatId')) ||
            (await AsyncStorage.getItem('last_selected_cat_id'));
          const found = catRows.find(c => String(c.id) === String(lastCatId));
          const targetCat = found || catRows[0];
          setSelectedCat(targetCat);
        }
      }
    };

    fetchSelectedCat();
    const sub = DeviceEventEmitter.addListener('catChanged', (cat) => {
      if (!cat?.id) return;
      (async () => {
        setSelectedCat(cat);
        await AsyncStorage.setItem(cameraScreenCatKey, String(cat.id));
        await refetch();
      })().catch((e) => {
        console.warn('Failed to apply catChanged selection:', e?.message || e);
      });
    });
    return () => sub?.remove?.();
  }, [session, cameraScreenCatKey]);

  // ดึง Quick Summary จาก DB (Events Today + Last Detected)
  useEffect(() => {
    const fetchQuickSummary = async () => {
      if (cameraStatus !== 'connected' || !session?.user?.id) return;
      try {
        const cameraId =
          (await AsyncStorage.getItem(scopedCameraIdKey)) ||
          (await AsyncStorage.getItem('camera_id'));
        if (!cameraId) return;
        const selectedCatId = selectedCat?.id || null;

        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);

        // Events today — นับจาก ai_cat_events ตาม camera_id
        let countQuery = supabase
          .from('ai_cat_events')
          .select('id', { count: 'exact', head: true })
          .eq('camera_id', cameraId)
          .gte('occurred_at', dayStart.toISOString());
        if (selectedCatId) countQuery = countQuery.eq('cat_id', selectedCatId);
        const { count } = await countQuery;

        // Last detected — ดึงจาก ai_cat_identity_review ที่ reviewed=true
        let lastReviewQuery = supabase
          .from('ai_cat_identity_review')
          .select('resolved_cat_id, occurred_at')
          .eq('camera_id', cameraId)
          .eq('reviewed', true)
          .not('resolved_cat_id', 'is', null)
          .order('occurred_at', { ascending: false })
          .limit(1);
        if (selectedCatId) lastReviewQuery = lastReviewQuery.eq('resolved_cat_id', selectedCatId);
        const { data: lastReview } = await lastReviewQuery.maybeSingle();

        let lastDetectedName = '--';
        if (lastReview?.resolved_cat_id) {
          const { data: catRow } = await supabase
            .from('cats').select('name').eq('id', lastReview.resolved_cat_id).maybeSingle();
          lastDetectedName = catRow?.name || '--';
        }

        setQuickSummary({ eventsToday: count ?? 0, lastDetected: lastDetectedName });
      } catch (e) {
        console.warn('quickSummary fetch error:', e?.message || e);
      }
    };
    fetchQuickSummary();
    const t = setInterval(fetchQuickSummary, 60000); // refresh ทุก 1 นาที
    return () => clearInterval(t);
  }, [cameraStatus, session, selectedCat?.id, scopedCameraIdKey]);

  const toggleCamera = () => {
    onNavigate('Setcamera');
  };

  if (!data) return null;

  const CameraSetupIntro = ({ onSetup, onMaybeLater }) => {
    // ... (โค้ดส่วนนี้เหมือนเดิม)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00695C" />
      </View>
    );
  };

  if (showSetupIntro === null || !data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4FAF9' }}>
        <ActivityIndicator size="large" color="#00695C" />
      </View>
    );
  }

  const SectionOverlay = ({ children }) => {
    if (!requireSetcamera && cameraStatus !== 'disconnected') return children;
    return (
      <View style={styles.sectionOverlayWrapper}>
        <View pointerEvents="none">{children}</View>
        <View style={styles.sectionOverlayContent}>
          <View style={styles.sectionOverlayHint}>
            <Text style={styles.sectionOverlayHintText}>
              {requireSetcamera ? 'Connect camera to start monitoring' : 'Connect camera to unlock this section'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const SetupPromptCard = () => (
    <View style={styles.setupCardWrapper}>
      <LinearGradient colors={['#F4FCF9', '#EAF7F2']} style={styles.setupCardGradient}>
        <View style={styles.setupCardIconContainer}>
          <MaterialCommunityIcons name="video-plus" size={26} color="#0F766E" />
        </View>
        <View style={styles.setupCardTextContainer}>
          <Text style={styles.setupCardTitle}>Connect Your Camera</Text>
          <Text style={styles.setupCardSubtitle}>Enable AI behavior monitoring for your pet.</Text>
        </View>
        <TouchableOpacity style={styles.setupCardButton} onPress={() => onNavigate('Phone', { initialStep: 'intro' })}>
          <Text style={styles.setupCardButtonText}>Connect</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const effectiveMode = data.cats <= 1 ? 'single' : (cameraModeFromDb || data.settings?.monitoringMode || 'multi');
  const modeDisplay = effectiveMode.charAt(0).toUpperCase() + effectiveMode.slice(1);
  const selectedCatsCount = data.cats <= 1 ? 1 : (data.settings?.selectedCats?.length ?? 0);
  const householdCatsCount = selectedCatsCount > 0 ? selectedCatsCount : data.cats;
  const translateY = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });
  const opacity = entryAnim;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5fffdff' }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#f5fffdff', '#f5fffdff']} style={{ flex: 1 }}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
          <HomeHeader
            onNotify={() => onNavigate('Alert', { returnTo: 'Camera' })}
            onSetting={() => onNavigate('Setting')}
          />

          <PendingIdentityBanner count={pendingIdentityCount} onPress={openPendingQueue} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* แสดง SetupPromptCard ถ้ายังไม่ได้ตั้งค่า stream_source (ไม่แตะ camera status) */}
            {requireSetcamera && <SetupPromptCard />}

            <Animated.View style={{ opacity, transform: [{ translateY }] }}>

              {/* 🚨 โซนแสดงกล้อง (ปรับเป็น WebView แบบยิงตรง ไม่ฝัง HTML) */}
              <View style={styles.cameraContainer}>
                <View style={[styles.cameraFrame, { height: videoFrameHeight }]}>
                  {isDisplayConnected ? (
                    <View style={{ width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#000' }}>
                      <WebView
                        source={streamSource}
                        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                        cacheEnabled={false}
                        scrollEnabled={false}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        originWhitelist={['*']}
                        mixedContentMode="always"
                        allowsInlineMediaPlayback={true}
                        automaticallyAdjustContentInsets={false}
                      />
                    </View>
                  ) : (
                    <View style={[styles.videoPlaceholder, { backgroundColor: '#FFFFFF' }]}>
                      <MaterialCommunityIcons
                        name={requireSetcamera ? 'camera-plus-outline' : 'camera-off-outline'}
                        size={30}
                        color="#90A4AE"
                        style={{ marginBottom: 8 }}
                      />
                      <Text style={styles.liveFeedLabel}>
                        {requireSetcamera ? 'Camera not connected yet' : 'Camera Disconnected'}
                      </Text>
                      <Text style={styles.videoSubText}>
                        {requireSetcamera ? 'Choose one way to connect and start monitoring.' : 'Reconnect from Camera settings.'}
                      </Text>
                      {requireSetcamera && (
                        <View style={styles.videoConnectActions}>
                          <TouchableOpacity
                            style={styles.videoConnectPrimary}
                            onPress={() => onNavigate('Phone', { initialStep: 'intro' })}
                          >
                            <Text style={styles.videoConnectPrimaryText}>Connect</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={[styles.cameraStatusBadge, { backgroundColor: isDisplayConnected ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 30, 30, 0.75)' }]}>
                    <Animated.View style={[styles.cameraStatusDot, {
                      opacity: isDisplayConnected ? pulseAnim : 1,
                      backgroundColor: isDisplayConnected ? '#4CAF50' : '#F44336'
                    }]} />
                    <Text style={[styles.cameraStatusText, { color: isDisplayConnected ? '#1B5E20' : '#fff' }]}>
                      {isDisplayConnected ? 'Connected' : 'Camera Disconnected'}
                    </Text>
                  </View>
                </View>

                <View style={styles.householdPill}>
                  <MaterialCommunityIcons name="paw" size={14} color="#00695C" style={{ marginRight: 6 }} />
                  <Text style={styles.householdText}>
                    {modeDisplay} Mode • {householdCatsCount} Cat{householdCatsCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Environment Status */}
              <View style={styles.envRow}>
                <LinearGradient colors={['#DDE7FF', '#EEF2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.weatherWidget}>
                  <View style={styles.weatherLeft}>
                    <Text style={styles.weatherLabel}>Current location</Text>
                    <Text style={styles.weatherCity}>Home</Text>
                    <Text style={styles.weatherCondition}>
                      {isDisplayConnected
                        ? (environment.humidity != null && environment.humidity > 70
                          ? 'Humid'
                          : environment.temperature != null && environment.temperature > 30
                            ? 'Warm'
                            : 'Live')
                        : 'No Signal'}
                    </Text>
                  </View>

                  <View style={styles.weatherRight}>
                    <View style={styles.weatherIconWrap}>
                      <MaterialCommunityIcons name="weather-partly-cloudy" size={28} color="#6366F1" />
                    </View>
                    <Text style={styles.weatherTemp}>
                      {isDisplayConnected && environment.temperature != null ? `${Number(environment.temperature).toFixed(1)}°C` : '--°C'}
                    </Text>
                    <View style={styles.weatherHumidityPill}>
                      <MaterialCommunityIcons name="water-percent" size={12} color="#5B67D6" style={{ marginRight: 4 }} />
                      <Text style={styles.weatherHumidity}>
                        {isDisplayConnected && environment.humidity != null ? `${environment.humidity}%` : '--%'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Stream Stats Bar — ping/bitrate/fps จาก proStats + Quick Summary */}
              {isDisplayConnected && (
                <View style={styles.streamStatsBar}>
                  <View style={styles.streamStatItem}>
                    <MaterialCommunityIcons name="access-point" size={13} color="#00695C" />
                    <Text style={styles.streamStatLabel}>Ping</Text>
                    <Text style={styles.streamStatValue}>{proStats.ping != null ? `${Math.round(proStats.ping)}ms` : '--'}</Text>
                  </View>
                  <View style={styles.streamStatDivider} />
                  <View style={styles.streamStatItem}>
                    <MaterialCommunityIcons name="video" size={13} color="#00695C" />
                    <Text style={styles.streamStatLabel}>Bitrate</Text>
                    <Text style={styles.streamStatValue}>{proStats.bitrate != null ? `${proStats.bitrate.toFixed(1)} Mbps` : '--'}</Text>
                  </View>
                  <View style={styles.streamStatDivider} />
                  <View style={styles.streamStatItem}>
                    <MaterialCommunityIcons name="speedometer" size={13} color="#00695C" />
                    <Text style={styles.streamStatLabel}>FPS</Text>
                    <Text style={styles.streamStatValue}>{proStats.fps != null ? Math.round(proStats.fps) : '--'}</Text>
                  </View>
                  <View style={styles.streamStatDivider} />
                  <View style={styles.streamStatItem}>
                    <MaterialCommunityIcons name="calendar-today" size={13} color="#00695C" />
                    <Text style={styles.streamStatLabel}>Events</Text>
                    <Text style={styles.streamStatValue}>{quickSummary.eventsToday}</Text>
                  </View>
                  <View style={styles.streamStatDivider} />
                  <View style={styles.streamStatItem}>
                    <MaterialCommunityIcons name="paw" size={13} color="#00695C" />
                    <Text style={styles.streamStatLabel}>Last seen</Text>
                    <Text style={[styles.streamStatValue, { maxWidth: 60 }]} numberOfLines={1}>{quickSummary.lastDetected}</Text>
                  </View>
                </View>
              )}

              <SectionOverlay>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScrollContent}
                  style={styles.recentScroll}
                >
                  {data?.recentActivities?.length > 0
                    ? data.recentActivities.map((item, index) => (
                      <View key={item.id || index} style={styles.recentItem}>
                        <View style={[styles.recentIcon, { backgroundColor: (item.color || '#FFB74D') + '25' }]}>
                          <MaterialCommunityIcons name={item.icon || 'run'} size={20} color={item.color || '#FFB74D'} />
                        </View>
                        <View>
                          <Text style={styles.recentType}>{item.type}</Text>
                          <Text style={styles.recentTime}>{item.time}</Text>
                        </View>
                      </View>
                    ))
                    : <Text style={{ color: '#B0BEC5', fontSize: 12, paddingVertical: 12, paddingLeft: 4 }}>No activity recorded today</Text>
                  }
                </ScrollView>
              </SectionOverlay>

              <Text style={styles.sectionTitle}>Today's Insights</Text>

              <SectionOverlay>
                <View style={styles.cardContainer}>
                  <DecorativeCatEars />
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>Activity Level</Text>
                      <Text style={styles.cardSubtitle}>
                        Status: <Text style={{
                          color:
                            (data.behaviorAnalytics?.energy?.active ?? 0) >= 60 ? '#FF6D00'
                              : (data.behaviorAnalytics?.energy?.active ?? 0) >= 30 ? '#F9A825'
                                : '#90A4AE',
                          fontWeight: 'bold'
                        }}>
                          {(data.behaviorAnalytics?.energy?.active ?? 0) >= 60 ? 'High'
                            : (data.behaviorAnalytics?.energy?.active ?? 0) >= 30 ? 'Moderate'
                              : 'Low'}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.iconCircleSmall}>
                      <MaterialCommunityIcons name="chart-bar" size={20} color="#FF6D00" />
                    </View>
                  </View>

                  <ActivityLevelChart
                    data={{
                      labels: ['00:00', '06:00', '12:00', '18:00', '24:00'],
                      activity: data.activity
                    }}
                  />
                </View>
              </SectionOverlay>

              {/* Stats Grid — Food & Litter จาก DB */}
              <SectionOverlay>
                <View style={styles.statsRow}>
                  <View style={styles.statCardGlowFood}>
                    <View style={[styles.statCard, styles.statCardFood]}>
                      <MaterialCommunityIcons name="paw" size={80} color="rgba(255, 109, 0, 0.05)" style={styles.statWatermark} />
                      <View style={[styles.iconCircle, styles.iconCircleFood]}>
                        <MaterialCommunityIcons name="food-apple" size={26} color="#FF6D00" />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statValue}>{data.food}</Text>
                        <Text style={styles.statLabel}>Feeding Events</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statCardGlowLitter}>
                    <View style={[styles.statCard, styles.statCardLitter]}>
                      <MaterialCommunityIcons name="paw" size={80} color="rgba(2, 136, 209, 0.05)" style={styles.statWatermark} />
                      <View style={[styles.iconCircle, styles.iconCircleLitter]}>
                        <MaterialCommunityIcons name="delete-outline" size={26} color="#0288D1" />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statValue}>{data.litter}</Text>
                        <Text style={styles.statLabel}>Litter Visits</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </SectionOverlay>

              {/* Posture & Behavior Card — จาก DB */}
              <SectionOverlay>
                <View style={styles.cardContainer}>
                  <DecorativeCatEars />
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Posture & Behavior</Text>
                    <MaterialCommunityIcons name="dots-horizontal" size={20} color="#B0BEC5" />
                  </View>

                  <View style={styles.postureGrid}>
                    <View style={[styles.postureCard, styles.postureCardNormal]}>
                      <View style={styles.postureIconBgNormal}>
                        <MaterialCommunityIcons name="cat" size={28} color="#00695C" />
                      </View>
                      <View style={styles.postureContent}>
                        <Text style={styles.postureValueNormal}>{data.posture?.normal?.percent ?? 0}%</Text>
                        <Text style={styles.postureLabel}>Normal</Text>
                      </View>
                    </View>

                    <View style={[styles.postureCard, styles.postureCardAbnormal]}>
                      <View style={styles.postureIconBgAbnormal}>
                        <MaterialCommunityIcons name="medical-bag" size={28} color="#D32F2F" />
                      </View>
                      <View style={styles.postureContent}>
                        <Text style={styles.postureValueAbnormal}>{data.posture?.abnormal?.percent ?? 0}%</Text>
                        <Text style={styles.postureLabel}>Attention</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.postureContext}>
                    <Text style={styles.postureContextText}>
                      Most detected: <Text style={{ fontWeight: 'bold', color: '#00695C' }}>{data.posture?.normal?.name ?? '--'}</Text>
                    </Text>
                    {(data.posture?.abnormal?.percent ?? 0) > 0 && (
                      <Text style={[styles.postureContextText, { color: '#D32F2F', marginTop: 4 }]}>
                        Alert: {data.posture?.abnormal?.name ?? '--'}
                      </Text>
                    )}
                  </View>
                </View>
              </SectionOverlay>

              {/* Behavior Analytics Card — คำนวณจากข้อมูลจริงใน DB ผ่าน useCameraData */}
              <SectionOverlay>
                <View style={styles.cardContainer}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="chart-arc" size={20} color="#00695C" style={{ marginRight: 6 }} />
                      <Text style={styles.cardTitle}>Behavior Analytics</Text>
                    </View>
                    <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                      <Animated.View style={[styles.cameraStatusDot, { backgroundColor: '#4CAF50', width: 6, height: 6, marginRight: 4, opacity: pulseAnim }]} />
                      <Text style={{ color: '#2E7D32', fontSize: 10, fontWeight: 'bold' }}>
                        {hasCameraAnalytics ? 'LIVE' : 'NO DATA'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cardSubtitle, { marginTop: -4, marginBottom: 8 }]}>
                    {hasCameraAnalytics
                      ? 'Insights improve with more recorded behavior over time.'
                      : 'Waiting for camera detections to calculate analytics.'}
                  </Text>

                  {!hasCameraAnalytics ? (
                    <View style={styles.analyticsEmpty}>
                      <MaterialCommunityIcons name="camera-off" size={24} color="#94A3B8" />
                      <Text style={styles.analyticsEmptyText}>No camera detections yet.</Text>
                      <Text style={styles.analyticsEmptySubtext}>Start the camera feed to see real analytics.</Text>
                    </View>
                  ) : (
                    <View style={styles.insightsGrid}>
                    {/* Energy Distribution */}
                    <View style={styles.insightRow}>
                      <View style={styles.insightHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <MaterialCommunityIcons name="lightning-bolt-circle" size={16} color="#FF9800" style={{ marginRight: 6 }} />
                          <Text style={styles.insightLabel} numberOfLines={1}>Energy Distribution</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                          <MaterialCommunityIcons name="paw" size={12} color="#FF9800" style={{ marginRight: 4 }} />
                          <Text style={styles.insightValue} numberOfLines={1}>{data.behaviorAnalytics?.energy?.active || 0}% Active</Text>
                        </View>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={styles.progressBarGray} />
                        <View style={[styles.progressBarFill, { width: `${data.behaviorAnalytics?.energy?.active || 0}%` }]}>
                          <View style={[styles.progressBarColor, { backgroundColor: '#FFAB40' }]} />
                          <MaterialCommunityIcons name="paw" size={24} color="#FF6D00" style={styles.progressPaw} />
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 }}>
                        <Text style={styles.insightSubtextLeft}>High (Playing)</Text>
                        <Text style={styles.insightSubtext}>Low (Resting)</Text>
                      </View>
                    </View>

                    {/* Routine Consistency */}
                    <View style={[styles.insightRow, { marginTop: 12 }]}>
                      <View style={styles.insightHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <MaterialCommunityIcons name="calendar-check" size={16} color="#2196F3" style={{ marginRight: 6 }} />
                          <Text style={styles.insightLabel} numberOfLines={1}>Routine Consistency</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                          <MaterialCommunityIcons name="paw" size={12} color="#2196F3" style={{ marginRight: 4 }} />
                          <Text style={[styles.insightValue, { color: '#2196F3' }]} numberOfLines={1}>{data.behaviorAnalytics?.routine?.status || 'No Data'}</Text>
                        </View>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={styles.progressBarGray} />
                        <View style={[styles.progressBarFill, { width: `${data.behaviorAnalytics?.routine?.score || 0}%` }]}>
                          <View style={[styles.progressBarColor, { backgroundColor: '#64B5F6' }]} />
                          <MaterialCommunityIcons name="paw" size={24} color="#0D47A1" style={styles.progressPaw} />
                        </View>
                      </View>
                      <Text style={[styles.insightSubtextLeft, { marginTop: 0 }]}>Consistent feeding and litter habits</Text>
                    </View>

                    {/* Wellness Index */}
                    <View style={[styles.insightRow, { marginTop: 12 }]}>
                      <View style={styles.insightHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <MaterialCommunityIcons name="heart-pulse" size={16} color="#4CAF50" style={{ marginRight: 6 }} />
                          <Text style={styles.insightLabel} numberOfLines={1}>Wellness Index</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                          <MaterialCommunityIcons name="paw" size={12} color="#4CAF50" style={{ marginRight: 4 }} />
                          <Text style={[styles.insightValue, { color: '#4CAF50' }]} numberOfLines={1}>{data.behaviorAnalytics?.wellness?.status || 'No Data'}</Text>
                        </View>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={styles.progressBarGray} />
                        <View style={[styles.progressBarFill, { width: `${data.behaviorAnalytics?.wellness?.score || 0}%` }]}>
                          <View style={[styles.progressBarColor, { backgroundColor: '#81C784' }]} />
                          <MaterialCommunityIcons name="paw" size={24} color="#1B5E20" style={styles.progressPaw} />
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 }}>
                        <Text style={styles.insightSubtextLeft}>Relaxed</Text>
                        <Text style={styles.insightSubtext}>Stressed</Text>
                      </View>
                    </View>
                  </View>
                  )}
                </View>
              </SectionOverlay>

              {/* Action Buttons */}
              <ButtonScale style={styles.actionButton} onPress={() => onNavigate('Gallery')}>
                <MaterialCommunityIcons name="image-multiple-outline" size={22} color="#00695C" />
                <Text style={styles.actionButtonText}>Activity Gallery</Text>
                <Ionicons name="chevron-forward" size={20} color="#B2DFDB" />
              </ButtonScale>

              <ButtonScale style={styles.actionButton} onPress={() => onNavigate('Setcamera')}>
                <Ionicons name="settings-outline" size={22} color="#00695C" />
                <Text style={styles.actionButtonText}>Camera Settings</Text>
                <Ionicons name="chevron-forward" size={20} color="#B2DFDB" />
              </ButtonScale>

              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>

          <View style={styles.footerBar}>
            <BottomNav current="Camera" onNavigate={onNavigate} />
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5fffdff' },
  scrollContent: { padding: 14, paddingBottom: 68 },
  footerBar: { backgroundColor: '#FFFFFF' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 20, paddingHorizontal: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: '#004D40' },
  catProfileCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', width: 42, height: 42, borderRadius: 21, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  catAvatarContainer: { position: 'relative' },
  catAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#E0F2F1' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFFFFF' },
  headerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  bellButton: { width: 40, height: 32, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  headerIconButton: { width: 36, height: 32, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5252', borderWidth: 1.5, borderColor: '#FFFFFF' },
  cameraContainer: { marginTop: 12, marginBottom: 24, alignItems: 'center' },
  cameraFrame: { width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFFFF', position: 'relative', elevation: 2, shadowColor: '#546E7A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  videoPlaceholder: { flex: 1, justifyContent: 'center', backgroundColor: '#FFFFFF', alignItems: 'center' },
  livePreviewImage: { width: '100%', height: '100%', backgroundColor: '#000' },
  liveFeedLabel: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  videoSubText: { color: '#94A3B8', fontSize: 12, marginTop: 4, marginBottom: 10, textAlign: 'center' },
  videoConnectActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  videoConnectPrimary: { backgroundColor: '#0F766E', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  videoConnectPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cameraStatusBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  cameraStatusDot: { width: 10, height: 10, borderRadius: 4, marginRight: 6 },
  cameraStatusText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  householdPill: { backgroundColor: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginTop: -16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  householdText: { color: '#00695C', fontSize: 12, fontWeight: '700' },
  envRow: { marginBottom: 16 },
  weatherWidget: { borderRadius: 15, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E3E8FF' },
  weatherLeft: { flex: 1 },
  weatherLabel: { fontSize: 12, color: '#6B78B8', fontWeight: '600' },
  weatherCity: { fontSize: 18, fontWeight: '800', color: '#3D4A80', marginTop: 2, marginBottom: 4 },
  weatherCondition: { fontSize: 12, color: '#5F6CA8', fontWeight: '700' },
  weatherRight: { alignItems: 'flex-end', minWidth: 110 },
  weatherIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  weatherTemp: { fontSize: 17, color: '#3D4A80', fontWeight: '800', marginTop: 6, marginBottom: 4 },
  weatherHumidityPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  weatherHumidity: { fontSize: 11, color: '#4B5A9A', fontWeight: '700' },
  sectionTitle: { fontSize: 15, marginTop: 16, marginBottom: 10, fontWeight: '700', color: '#37474F', marginLeft: 4 },
  cardContainer: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 13, marginBottom: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#37474F', marginBottom: 4 },
  cardSubtitle: { fontSize: 11, color: '#78909C' },
  iconCircleSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  actionButton: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 14, marginBottom: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionButtonText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#37474F', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  switcherContainer: { width: '80%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, maxHeight: '50%' },
  switcherTitle: { fontSize: 18, fontWeight: 'bold', color: '#37474F', marginBottom: 16, textAlign: 'center' },
  switcherItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  switcherItemActive: { backgroundColor: '#F0F4F8', borderRadius: 12, paddingHorizontal: 8 },
  switcherAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  switcherName: { fontSize: 16, color: '#37474F', flex: 1 },
  switcherNameActive: { fontWeight: 'bold', color: '#00695C' },
  earContainer: { position: 'absolute', top: -8, left: 12, right: 12, height: 12, flexDirection: 'row', justifyContent: 'space-between', zIndex: -1 },
  ear: { width: 20, height: 16, backgroundColor: '#FFFFFF', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  earLeft: { transform: [{ rotate: '-15deg' }] },
  earRight: { transform: [{ rotate: '15deg' }] },
  sectionOverlayWrapper: { position: 'relative', marginHorizontal: 0, marginBottom: 0, borderRadius: 0, overflow: 'visible' },
  sectionOverlayContent: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.45)', zIndex: 20, justifyContent: 'center', alignItems: 'center' },
  sectionOverlayHint: { backgroundColor: 'rgba(255, 255, 255, 0.82)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionOverlayHintText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  setupCardWrapper: { marginHorizontal: 16, marginTop: 10, marginBottom: 10, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#D7ECE5', elevation: 2, shadowColor: '#0F766E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  setupCardGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  setupCardIconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#D9F1E8', justifyContent: 'center', alignItems: 'center' },
  setupCardTextContainer: { flex: 1, marginLeft: 12 },
  setupCardTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700', marginBottom: 1 },
  setupCardSubtitle: { color: '#64748B', fontSize: 11 },
  setupCardButton: { backgroundColor: '#0F766E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  setupCardButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  // Stream Stats Bar
  streamStatsBar: { flexDirection: 'row', backgroundColor: '#F0FDF8', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#CCEDE4' },
  streamStatItem: { flex: 1, alignItems: 'center', gap: 2 },
  streamStatLabel: { fontSize: 9, color: '#78909C', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  streamStatValue: { fontSize: 11, color: '#004D40', fontWeight: '800' },
  streamStatDivider: { width: 1, height: 28, backgroundColor: '#D0EDE6' },
  // Stats Grid
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 11, borderRadius: 14, alignItems: 'center', flexDirection: 'row', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.015, shadowRadius: 2, elevation: 0 },
  statCardFood: { borderLeftWidth: 4, borderLeftColor: '#FF6D00' },
  statCardLitter: { borderLeftWidth: 4, borderLeftColor: '#0288D1' },
  statCardGlowFood: { flex: 1, marginRight: 6, borderRadius: 18, shadowColor: '#FF6D00', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 },
  statCardGlowLitter: { flex: 1, marginLeft: 6, borderRadius: 18, shadowColor: '#0288D1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 },
  statContent: { marginLeft: 12, flex: 1 },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconCircleFood: { backgroundColor: '#FFF3E0' },
  iconCircleLitter: { backgroundColor: '#E1F5FE' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#37474F' },
  statLabel: { fontSize: 8, color: '#78909C', fontWeight: '600', textTransform: 'uppercase' },
  statWatermark: { position: 'absolute', right: -10, bottom: -10, opacity: 0.5 },
  // Posture Card
  postureGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, gap: 10 },
  postureCard: { flex: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  postureCardNormal: { backgroundColor: '#E0F2F1' },
  postureCardAbnormal: { backgroundColor: '#FFEBEE' },
  postureIconBgNormal: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  postureIconBgAbnormal: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  postureContent: { flex: 1 },
  postureValueNormal: { fontSize: 17, fontWeight: '800', color: '#00695C' },
  postureValueAbnormal: { fontSize: 17, fontWeight: '800', color: '#D32F2F' },
  postureLabel: { fontSize: 11, fontWeight: '600', color: '#546E7A' },
  postureContext: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ECEFF1' },
  postureContextText: { fontSize: 11, color: '#78909C' },
  // Recent Activity
  recentScroll: { marginBottom: 8 },
  recentScrollContent: { paddingRight: 16 },
  recentItem: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 8, paddingRight: 12, marginRight: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#90A4AE', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  recentIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  recentType: { fontSize: 12, fontWeight: '700', color: '#37474F' },
  recentTime: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
  // Behavior Analytics
  insightsGrid: { marginTop: 12, gap: 16 },
  insightRow: { marginBottom: 4 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  insightLabel: { fontSize: 13, color: '#455A64', fontWeight: '600' },
  insightValue: { fontSize: 13, color: '#37474F', fontWeight: 'bold' },
  progressBarBg: { height: 24, justifyContent: 'center', overflow: 'visible', marginVertical: 4 },
  progressBarGray: { height: 8, backgroundColor: '#ECEFF1', borderRadius: 5, width: '100%', position: 'absolute' },
  progressBarFill: { height: 24, minWidth: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  progressBarColor: { height: 8, borderRadius: 5, width: '100%', position: 'absolute' },
  progressPaw: { marginRight: -8, textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 3, zIndex: 10 },
  insightSubtext: { fontSize: 11, color: '#90A4AE', marginTop: 4, textAlign: 'right' },
  insightSubtextLeft: { fontSize: 11, color: '#90A4AE' },
  analyticsEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  analyticsEmptyText: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  analyticsEmptySubtext: { fontSize: 11, color: '#94A3B8' },
});



