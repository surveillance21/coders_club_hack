require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        console.log("URL:", supabaseUrl);
        console.log("KEY LENGTH:", supabaseKey.length);

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing credentials");
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Fetching zones...");
        const { data, error } = await supabase.from('zones').select('*');

        if (error) {
            console.error("SUPABASE ERROR:", error);
        } else {
            console.log("SUCCESS:", data.length, "zones found");
        }
    } catch (e) {
        console.error("EXCEPTION:", e);
    }
}

test();
