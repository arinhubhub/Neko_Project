import React, { useState, useEffect } from 'react';
import SignInScreen from './src/screens/SignInScreen';
import { View, ActivityIndicator, AppState } from 'react-native';
import SignUpScreen from './src/screens/SignUpScreen';
import supabase from './src/screens/config/supabaseClient';
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from "./src/screens/ResultScreen";
import AssessmentScreen from "./src/screens/AssessmentScreen";
import HomeScreenOld from "./src/screens/HomeScreenOld";
import LogDailyNormal from "./src/screens/LogDailyNormal";
import CalendarScreen from "./src/screens/CalendarScreen";


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('SignIn');

  const navigateToSignIn = () => setCurrentScreen('SignIn');
  const navigateToSignUp = () => setCurrentScreen('SignUp');
  const navigateToHome = () => setCurrentScreen('Home');
  const navigateToResult = () => setCurrentScreen('Result');
  const navigateToAssessment = () => setCurrentScreen('Assessment');
  const navigateToHomeOld = () => setCurrentScreen("HomeOld");
  const navigateToLogDaily = () => setCurrentScreen("LogDaily");
  const navigateToCalendar = () => setCurrentScreen("Calendar");


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
      {/* ===== หน้า Home (เพิ่มใหม่) ===== */}
      {currentScreen === 'Home' && (
        <HomeScreen 
          onLogout={navigateToSignIn} 
          onAssess={navigateToResult}
          onPhotoAssess={navigateToAssessment}
        />
      )}
      {currentScreen === 'Assessment' && (
  <AssessmentScreen
    onBack={navigateToHome}
    onResult={navigateToResult}
  />
    )}
    {currentScreen === 'Result' && (
  <ResultScreen onSave={navigateToHomeOld} />
)}
{currentScreen === 'HomeOld' && (
  <HomeScreenOld
  onAssess={navigateToResult}
  onLogDaily={navigateToLogDaily}
  />
)}
{currentScreen === "LogDaily" && (
  <LogDailyNormal />
)}
{currentScreen === "Calendar" && (
  <CalendarScreen />
)}

    

    </>
  );
}
