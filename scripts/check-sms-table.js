const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('sms_notifications').select('count', { count: 'exact' }).limit(1);
  if (error) {
    console.log('Table does not exist or error:', error.message);
  } else {
    console.log('Table sms_notifications exists successfully!');
  }
}

check();
