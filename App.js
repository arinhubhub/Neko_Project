import React, { useState, useEffect } from 'react';
import SignInScreen from './src/screens/SignInScreen';
import { View, ActivityIndicator, AppState } from 'react-native';
import SignUpScreen from './src/screens/SignUpScreen';
import supabase from './src/screens/config/supabaseClient';


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('SignIn');

  const navigateToSignIn = () => setCurrentScreen('SignIn');
  const navigateToSignUp = () => setCurrentScreen('SignUp');
useEffect(() => {
    // ฟังก์ชันจัดการสถานะแอป (เปิด/พับหน้าจอ)
    const handleAppStateChange = (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      {currentScreen === 'SignIn' ? (
        <SignInScreen onNavigate={navigateToSignUp} />
      ) : (
        <SignUpScreen onNavigate={navigateToSignIn} />
      )}
    </>
  );
}
