# Account Components

This directory contains the refactored account-related components that were extracted from the monolithic `Account.tsx` file.

## Components

### AuthenticationForm.tsx
Handles user login, signup, and password reset functionality.
- User/Admin login modes
- Form validation and error handling
- Password reset flow

### ProfileContent.tsx
Manages user profile information display and editing.
- View/edit profile information
- Save profile changes to database

### AddressesContent.tsx
Handles user address management.
- Add/edit/delete addresses
- Set default address
- Address form validation

### OrdersContent.tsx
Displays user order history.
- Order listing with status indicators
- Order details view

### types.ts
Shared TypeScript types and interfaces used across all account components.
- Database types
- Form data interfaces
- Common constants

### index.ts
Barrel export file for easy component imports.

## Original Refactoring

The original `Account.tsx` file was 1,756 lines and handled multiple responsibilities:
- Authentication (login/signup)
- Profile management
- Address management
- Order history
- Admin dashboard
- Analytics dashboard

After refactoring:
- Main `Account.tsx`: 179 lines (90% reduction)
- Total component lines: ~999 lines across focused components
- Better separation of concerns
- Improved maintainability
- Easier testing and debugging

## Future Work

The Admin Dashboard functionality still needs to be properly extracted as it's complex and contains many dependencies, queries, and mutations. This is planned for a future phase of the refactoring.