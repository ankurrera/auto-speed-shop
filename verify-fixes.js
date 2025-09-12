/**
 * Verification Script - Tests the exact errors mentioned in the problem statement
 * 
 * This script replicates the exact error conditions to verify they are fixed:
 * 1. AdminDiscountCouponManagement.tsx:95 Error fetching coupons
 * 2. AdminCustomerSupportTools.tsx:89 Error fetching tickets  
 * 3. UserCoupons.tsx:35 Error loading user coupons
 * 4. UserSupportTickets.tsx:116 Error loading tickets
 * 5. UserSupportTickets.tsx:167 Error creating ticket
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (same as in the app)
const supabaseUrl = 'https://dkopohqiihhxmbjhzark.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb3BvaHFpaWh4bWJqaHphcmsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMzk5MzQzOCwiZXhwIjoyMDQ5NTY5NDM4fQ.SJo6UuQyf0K0O5_vN_lFZU2q1waDJ6QVdwm2h59gFsI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testErrorConditions() {
  console.log('🔍 Testing Original Error Conditions...\n');

  // Test 1: AdminDiscountCouponManagement.tsx:95 - Error fetching coupons
  console.log('1️⃣ Testing: AdminDiscountCouponManagement.tsx:95');
  console.log('   Original error: "Error fetching coupons: Error: Failed to fetch coupon statistics"');
  try {
    // This should match line 87-95 in AdminDiscountCouponManagement.tsx
    const [couponsData, statsData] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.rpc('get_coupon_stats')
    ]);
    
    if (couponsData.error) throw couponsData.error;
    if (statsData.error) throw statsData.error;
    
    console.log('   ✅ FIXED: Successfully fetched coupons and stats');
    console.log('   📊 Stats:', statsData.data);
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  // Test 2: AdminCustomerSupportTools.tsx:89 - Error fetching tickets
  console.log('\n2️⃣ Testing: AdminCustomerSupportTools.tsx:89');
  console.log('   Original error: "Could not find a relationship between \'support_tickets\' and \'profiles\'"');
  try {
    // This should match line 81-89 in AdminCustomerSupportTools.tsx
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles!support_tickets_user_id_fkey (
          id,
          email,
          full_name,
          role
        ),
        assigned_profiles:profiles!support_tickets_assigned_to_fkey (
          id,
          email,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log('   ✅ FIXED: Successfully fetched tickets with profile relationships');
    console.log('   🎫 Tickets:', data.length);
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  // Test 3: UserCoupons.tsx:35 - Error loading user coupons
  console.log('\n3️⃣ Testing: UserCoupons.tsx:35');
  console.log('   Original error: "column user_coupons.assigned_at does not exist"');
  try {
    // This should match line 32-35 in UserCoupons.tsx
    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupons (*)
      `)
      .eq('user_id', 'test-user-id')
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    console.log('   ✅ FIXED: Successfully fetched user coupons with assigned_at column');
    console.log('   🎟️ User Coupons:', data.length);
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  // Test 4: UserSupportTickets.tsx:116 - Error loading tickets (same relationship issue)
  console.log('\n4️⃣ Testing: UserSupportTickets.tsx:116');
  console.log('   Original error: "Could not find a relationship between \'support_tickets\' and \'profiles\'"');
  try {
    // This should match line 113-116 in UserSupportTickets.tsx
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles!support_tickets_user_id_fkey (
          id,
          email,
          full_name,
          role
        ),
        assigned_profiles:profiles!support_tickets_assigned_to_fkey (
          id,
          email,
          full_name,
          role
        )
      `)
      .eq('user_id', 'test-user-id')
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log('   ✅ FIXED: Successfully fetched user tickets with profile relationships');
    console.log('   🎫 User Tickets:', data.length);
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  // Test 5: UserSupportTickets.tsx:167 - Error creating ticket
  console.log('\n5️⃣ Testing: UserSupportTickets.tsx:167');
  console.log('   Original error: "null value in column \\"ticket_number\\" violates not-null constraint"');
  try {
    // This should match line 142-167 in UserSupportTickets.tsx
    // Generate unique ticket number (this is now handled automatically by the database)
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: 'test-user-id',
        subject: 'Test Ticket for Error Verification',
        description: 'This ticket tests that the ticket_number constraint is now working properly',
        priority: 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    console.log('   ✅ FIXED: Successfully created ticket with auto-generated ticket_number');
    console.log('   🎫 New Ticket Number:', data.ticket_number);
    
    // Clean up test ticket
    await supabase.from('support_tickets').delete().eq('id', data.id);
    console.log('   🧹 Test ticket cleaned up');
    
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  console.log('\n🎉 Error condition testing completed!');
  console.log('\n📋 Summary:');
  console.log('   All original errors should now be ✅ FIXED');
  console.log('   If any show ❌ ERROR, the migration may not have been applied correctly');
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testErrorConditions };
} else {
  // Run immediately if in browser
  testErrorConditions();
}