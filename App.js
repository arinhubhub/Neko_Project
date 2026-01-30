import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileScreen from './src/screens/profileScreen';
import CatProfile from './src/screens/catprofile';
import UserInfoScreen from './src/screens/UserInfoScreen';
import supabase from './src/screens/config/supabaseClient';

// ✅ 1. Import ไฟล์ LogDailyNormal เข้ามา
import LogDailyNormal from './src/screens/LogDailyNormal';
import CalendarScreen from './src/screens/CalendarScreen';
import HomeScreen from './src/screens/HomeScreen';
// import ResultScreen, AssessmentScreen, HomeScreenOld... (Import หน้าอื่นๆ ตามที่มีในโปรเจกต์จริง)

import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_700Bold,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_300Light
} from '@expo-google-fonts/inter';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Light': Inter_300Light,
    'Poppins-Regular': Poppins_400Regular,
  });

  const [currentScreen, setCurrentScreen] = useState('SignIn');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState('Home');
  const [catId, setCatId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false); // ✅ Track if checking profile

  // Fix Logout: Should actually sign out
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setAuthScreen('Home'); // Reset for next login
    setCurrentScreen('SignIn');
    setLoading(false);
  };

  const navigateToSignIn = () => {
    handleSignOut(); // Logout if navigating to SignIn
  };
  const navigateToSignUp = () => setCurrentScreen('SignUp');

  const navigateToLogDaily = () => {
    setAuthScreen('LogDaily');
    setCurrentScreen('LogDaily');
  };
  const navigateToHome = () => {
    setAuthScreen('Home');
    setCurrentScreen('Home');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
        if (session) checkUserProfileStatus(session); // Check if new user
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserProfileStatus(session);
      } else {
        setAuthScreen('Home'); // Reset
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserProfileStatus = async (session) => {
    // Normal flow: Go to Home after login
    setAuthScreen('Home');
  };


  if (!fontsLoaded || loading || (session && profileLoading)) { // ✅ Wait for profile check if session exists
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00695C" />
      </View>
    );
  }

  // ส่วนจัดการ Session (ถ้าล็อกอินแล้ว)
  if (session && !loading) {
    if (authScreen === 'CatProfile') {
      return <CatProfile session={session} onNavigateToHome={() => setAuthScreen('Home')} />;
    }
    if (authScreen === 'Profile') {
      return <ProfileScreen session={session} onNavigateToCatProfile={() => setAuthScreen('CatProfile')} />;
    }
    if (authScreen === 'UserInfo') {
      return <UserInfoScreen
        session={session}
        catId={catId}
        onLogout={() => supabase.auth.signOut()}
        onMissingProfile={() => setAuthScreen('Profile')}
        onBack={() => setAuthScreen('Home')} // ✅ Back button support
      />;
    }

    if (authScreen === 'LogDaily') {
      return <LogDailyNormal
        session={session}
        onBack={() => setAuthScreen('Calendar')}
      />;
    }

    if (authScreen === 'Calendar') {
      return <CalendarScreen
        onNavigate={(screen) => setAuthScreen(screen)}
      />;
    }

    // ✅ Default Home
    return <HomeScreen
      onLogout={navigateToSignIn}
      onLogDaily={() => setAuthScreen('LogDaily')}
      onAssess={() => {/* Logic for assessment */ }}
      onSetting={() => setAuthScreen('UserInfo')} // ✅ Go to Settings (UserInfo)
      onNavigate={(screen) => setAuthScreen(screen)} // ✅ Add this
    />;
  }

  // ส่วนจัดการหน้าจอ (ถ้ายังไม่ล็อกอิน หรือ flow ปกติ)
  return (
    <>
      {currentScreen === 'SignIn' && (
        <SignInScreen onNavigate={navigateToSignUp} />
      )}

      {currentScreen === 'SignUp' && (
        <SignUpScreen onNavigate={navigateToSignIn} />
      )}

      {/* ===== หน้า Home ===== */}
      {currentScreen === 'Home' && (
        <HomeScreen
          onLogout={navigateToSignIn}
          // ต้องส่ง props ไปให้กดแล้วไปหน้า LogDaily ได้
          onLogDaily={navigateToLogDaily}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* ===== ✅ 3. เพิ่มหน้า LogDaily ตรงนี้ ===== */}
      {/* ===== ✅ 3. เพิ่มหน้า LogDaily ตรงนี้ ===== */}
      {currentScreen === 'LogDaily' && (
        <LogDailyNormal
          session={session}
          onBack={() => setCurrentScreen('Calendar')}
        />
      )}

      {currentScreen === 'Calendar' && (
        <CalendarScreen
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      )}

    </>
  );
}