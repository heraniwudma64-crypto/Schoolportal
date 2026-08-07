import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdwpgbubenazrdqohgrq.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_uMxTyKkzHwluRsPtDOaRfA_cz_j5kiN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);