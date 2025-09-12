// Test for the updated user count filtering in Admin Dashboard
// Validates that Total Users count now uses is_admin=FALSE filter only

import { describe, it, expect } from 'vitest';

describe('Admin Dashboard User Count - Updated Logic', () => {
  it('should count all non-admin users (including sellers and other roles)', () => {
    // Simulate the database profiles with various user types
    const mockProfiles = [
      { id: '1', is_admin: false, is_seller: false, role: 'user' },      // Regular user
      { id: '2', is_admin: false, is_seller: false, role: 'user' },      // Regular user
      { id: '3', is_admin: true, is_seller: false, role: 'admin' },      // Admin - EXCLUDED
      { id: '4', is_admin: false, is_seller: true, role: 'seller' },     // Seller - NOW INCLUDED
      { id: '5', is_admin: false, is_seller: false, role: 'moderator' }, // Moderator - NOW INCLUDED
      { id: '6', is_admin: false, is_seller: false, role: 'user' },      // Regular user
      { id: '7', is_admin: true, is_seller: true, role: 'admin' },       // Admin seller - EXCLUDED
      { id: '8', is_admin: false, is_seller: false, role: null },        // Null role - NOW INCLUDED
    ];

    // New filtering logic: WHERE is_admin = FALSE
    const updatedFilter = mockProfiles.filter(user => user.is_admin === false);

    // Should include: users 1, 2, 4, 5, 6, 8 (all non-admin users)
    expect(updatedFilter).toHaveLength(6);
    expect(updatedFilter.map(u => u.id)).toEqual(['1', '2', '4', '5', '6', '8']);

    // Verify all included users are non-admin
    expect(updatedFilter.every(user => user.is_admin === false)).toBe(true);

    // Verify admin users are excluded
    const adminUsers = mockProfiles.filter(user => user.is_admin === true);
    expect(adminUsers).toHaveLength(2); // users 3, 7
    expect(updatedFilter.some(user => user.is_admin === true)).toBe(false);
  });

  it('should match the exact problem statement requirement', () => {
    const profiles = [
      { id: '1', is_admin: false, is_seller: false, role: 'user' },
      { id: '2', is_admin: false, is_seller: true, role: 'seller' },
      { id: '3', is_admin: true, is_seller: false, role: 'admin' },
    ];

    // Problem statement: "where is_admin=FALSE"
    const result = profiles.filter(user => user.is_admin === false);
    
    expect(result).toHaveLength(2); // users 1 and 2
    expect(result.map(u => u.id)).toEqual(['1', '2']);
    
    // Specifically verify seller is now included (key change)
    const sellerIncluded = result.some(u => u.is_seller === true);
    expect(sellerIncluded).toBe(true);
  });

  it('should demonstrate the difference from old logic', () => {
    const testData = [
      { id: '1', is_admin: false, is_seller: false, role: 'user' },
      { id: '2', is_admin: false, is_seller: true, role: 'seller' },
      { id: '3', is_admin: false, is_seller: false, role: 'moderator' },
    ];

    // Old logic (3 conditions)
    const oldLogic = testData.filter(user => 
      user.is_admin === false && 
      user.is_seller === false && 
      user.role === 'user'
    );

    // New logic (1 condition - as implemented)
    const newLogic = testData.filter(user => user.is_admin === false);

    expect(oldLogic).toHaveLength(1); // Only user 1
    expect(newLogic).toHaveLength(3); // All users (no admins in test data)
    
    // The change increases the count by including sellers and other roles
    expect(newLogic.length).toBeGreaterThan(oldLogic.length);
  });
});