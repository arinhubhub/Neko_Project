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
import HomeScreen from './src/screens/HomeScreen'; // อย่าลืม Import Home ด้วยถ้าจะใช้
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
  const [authScreen, setAuthScreen] = useState('LogDaily'); // ✅ เปลี่ยน Default เป็น LogDaily

  // ... (navigation functions)

  // ... (useEffect hook)
  
  // ... (navigation functions restored previously)
  const navigateToSignIn = () => setCurrentScreen('SignIn');
  const navigateToSignUp = () => setCurrentScreen('SignUp');
  
  // ✅ 2. สร้างฟังก์ชันสำหรับกระโดดไปหน้า LogDaily
  const navigateToLogDaily = () => setCurrentScreen('LogDaily');
  const navigateToHome = () => setCurrentScreen('Home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) {
      return <ActivityIndicator />;
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
         />;
      }
      
      // ✅ เพิ่มเงื่อนไข LogDaily
      if (authScreen === 'LogDaily') {
         return <LogDailyNormal 
            session={session}
            onBack={() => setAuthScreen('Home')} // กด Back ให้ไป Home
         />;
      }

      // ✅ Default หรือ Home
      return <HomeScreen 
          onLogout={navigateToSignIn} 
          onLogDaily={() => setAuthScreen('LogDaily')}
          onAssess={() => {/* Logic for assessment */}}
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
        />
      )}

      {/* ===== ✅ 3. เพิ่มหน้า LogDaily ตรงนี้ ===== */}
      {/* ===== ✅ 3. เพิ่มหน้า LogDaily ตรงนี้ ===== */}
      {currentScreen === 'LogDaily' && (
        <LogDailyNormal 
            session={session}
            onBack={navigateToHome}
        />
      )}

    </>
  );
}