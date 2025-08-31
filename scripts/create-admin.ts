import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://ufgqmqoykddaotdbwteg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

// Admin user credentials
const ADMIN_EMAIL = "admin@newomen.me";
const ADMIN_PASSWORD = "Admin@Newomen2025!";
const ADMIN_NAME = "Admin User";

async function createAdminUser() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error("Please set SUPABASE_SERVICE_KEY environment variable");
    console.log("\nTo create admin user manually:");
    console.log("1. Go to Supabase Dashboard > Authentication > Users");
    console.log("2. Click 'Invite User' or 'Create User'");
    console.log("3. Use these credentials:");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("4. After user creation, update the profile:");
    console.log("   - Go to Table Editor > profiles");
    console.log("   - Find the user by user_id");
    console.log("   - Set role to 'admin'");
    console.log("   - Set full_name to 'Admin User'");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return;
    }

    console.log("✅ Admin user created successfully!");
    console.log("User ID:", authData.user?.id);

    // Update profile to set admin role
    if (authData.user?.id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          full_name: ADMIN_NAME,
          bio: 'Platform Administrator'
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        console.log("\nPlease manually update the profile in Supabase:");
        console.log("1. Go to Table Editor > profiles");
        console.log(`2. Find user with user_id: ${authData.user.id}`);
        console.log("3. Set role to 'admin'");
      } else {
        console.log("✅ Profile updated with admin role!");
      }
    }

    console.log("\n📧 Admin Credentials:");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log("\n🔐 Please change the password after first login!");

  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

createAdminUser();