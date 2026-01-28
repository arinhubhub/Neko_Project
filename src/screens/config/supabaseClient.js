import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'REACT_APP_SUPABASE_UR' //เอาลิงค์ของsupabase
const supabaseKey ='REACT_APP_ANON_KEY' //เอาkeyของsupabase



const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;

