import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://tabgwpkjfpsfcbjbneiz.supabase.co';
const supabaseKey = 'sb_publishable_ECRlKCJ6JnNyZhoFZ963Uw_TyYCg_tH';


const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;

