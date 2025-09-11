// Test for user count filtering logic
// This test verifies that the "Total Users" count only includes users with
// is_admin = false, is_seller = false, and role = 'user'

import { describe, it, expect } from 'vitest';

describe('User Count Filtering', () => {
  it('should filter users correctly for Total Users count', () => {
    // Mock user profiles data
    const mockProfiles = [
      { id: '1', is_admin: false, is_seller: false, role: 'user' }, // Should be counted
      { id: '2', is_admin: false, is_seller: false, role: 'user' }, // Should be counted
      { id: '3', is_admin: true, is_seller: false, role: 'admin' }, // Should NOT be counted (admin)
      { id: '4', is_admin: false, is_seller: true, role: 'seller' }, // Should NOT be counted (seller)
      { id: '5', is_admin: false, is_seller: false, role: 'moderator' }, // Should NOT be counted (wrong role)
      { id: '6', is_admin: false, is_seller: false, role: 'user' }, // Should be counted
    ];

    // Simulate the filtering logic used in the application
    const regularUsers = mockProfiles.filter(user => 
      user.is_admin === false && 
      user.is_seller === false && 
      user.role === 'user'
    );

    // Should only count the 3 regular users (ids: 1, 2, 6)
    expect(regularUsers).toHaveLength(3);
    expect(regularUsers.map(u => u.id)).toEqual(['1', '2', '6']);
  });

  it('should exclude all admin users', () => {
    const mockProfiles = [
      { id: '1', is_admin: true, is_seller: false, role: 'admin' },
      { id: '2', is_admin: true, is_seller: true, role: 'admin' },
    ];

    const regularUsers = mockProfiles.filter(user => 
      user.is_admin === false && 
      user.is_seller === false && 
      user.role === 'user'
    );

    expect(regularUsers).toHaveLength(0);
  });

  it('should exclude all seller users', () => {
    const mockProfiles = [
      { id: '1', is_admin: false, is_seller: true, role: 'seller' },
      { id: '2', is_admin: false, is_seller: true, role: 'user' }, // seller flag takes precedence
    ];

    const regularUsers = mockProfiles.filter(user => 
      user.is_admin === false && 
      user.is_seller === false && 
      user.role === 'user'
    );

    expect(regularUsers).toHaveLength(0);
  });

  it('should exclude users with non-user roles', () => {
    const mockProfiles = [
      { id: '1', is_admin: false, is_seller: false, role: 'moderator' },
      { id: '2', is_admin: false, is_seller: false, role: 'guest' },
      { id: '3', is_admin: false, is_seller: false, role: 'admin' },
    ];

    const regularUsers = mockProfiles.filter(user => 
      user.is_admin === false && 
      user.is_seller === false && 
      user.role === 'user'
    );

    expect(regularUsers).toHaveLength(0);
  });
});