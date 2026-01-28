import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileScreen from './src/screens/profileScreen';
import CatProfile from './src/screens/catprofile';
import UserInfoScreen from './src/screens/UserInfoScreen';
import supabase from './src/screens/config/supabaseClient';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('SignIn');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState('UserInfo'); // Default to UserInfo, it will handle fetching logic
  const [catId, setCatId] = useState(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log("Error getting session:", error.message);
        supabase.auth.signOut(); // Force sign out if session is invalid
        setSession(null);
      } else {
        setSession(session);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentScreen('SignIn');
        setAuthScreen('Profile'); // Reset to Profile on sign out (or UserInfo if you prefer default)
      } else if (session) {
         setSession(session);
         if (_event === 'SIGNED_IN') {
             setAuthScreen('UserInfo'); // Force to UserInfo on clean sign in
         }
      }
    });

    const handleAppStateChange = (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const navigateToSignIn = () => setCurrentScreen('SignIn');
  const navigateToSignUp = () => setCurrentScreen('SignUp');

  if (loading) {
     return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
        </View>
     );
  }

  // If session exists, user is logged in
  if (session && session.user) {
      if (authScreen === 'UserInfo') {
         return <UserInfoScreen 
            session={session} 
            catId={catId} 
            onLogout={() => supabase.auth.signOut()} 
         />;
      }
      if (authScreen === 'CatProfile') {
          return <CatProfile 
            session={session}
            onNavigateToHome={(id) => {
                setCatId(id);
                setAuthScreen('UserInfo');
            }} 
          />;
      }
      if (authScreen === 'Profile') {
          return <ProfileScreen session={session} onNavigateToCatProfile={() => setAuthScreen('CatProfile')} />;
      }
      return <UserInfoScreen 
            session={session} 
            catId={catId} 
            onLogout={() => supabase.auth.signOut()} 
         />;
  }

  // Otherwise handle Auth flow
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
