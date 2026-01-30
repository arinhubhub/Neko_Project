import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://jsdyonvgwvbuetsijvbc.supabase.co' //เอาลิงค์ของsupabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZHlvbnZnd3ZidWV0c2lqdmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDQ4OTAsImV4cCI6MjA4NDY4MDg5MH0.nT_Itjzn8Lcku3ZNAXYJAeOcV1L8qcKaPCterzkk9bw' //เอาkeyของsupabase



const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;

