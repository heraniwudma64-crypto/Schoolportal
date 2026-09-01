# Authentication & Dashboard Testing Guide

This guide explains how to test the authentication login and teacher dashboard functionality after the recent fixes.

## Overview of Fixes

### 1. Fixed: POST /auth/login 401 Unauthorized Error
**What was fixed:**
- Improved error logging in the authentication flow
- Added better error handling in the login endpoint
- Prevented automatic login loops by implementing proper error tracking
- Added detailed error messages for failed login attempts

**Error Handling:**
- Login failures are now logged as warnings instead of errors to reduce console spam
- Network errors are caught and reported separately from authentication failures
- Session validation errors are handled gracefully during app initialization

### 2. Fixed: GET /teachers/dashboard 500 Internal Server Error
**What was fixed:**
- Added try-catch blocks in the TeachersService methods
- Improved error messages when teacher profiles are missing
- Changed unhandled `NotFoundException` to return proper HTTP 404 with descriptive messages instead of 500 errors
- All methods that resolve teacher IDs now handle missing profiles gracefully

**New Behavior:**
- If a teacher tries to access their dashboard but no teacher profile exists, they get: 
  - HTTP 404 with message: "Teacher profile not found. Please contact your administrator."
- This indicates a data inconsistency that should be fixed by an admin

## Testing Setup

### Prerequisites
1. Ensure PostgreSQL database is running
2. Ensure `.env` file is configured with correct `DATABASE_URL`
3. Backend should be running on `http://localhost:3000`
4. Frontend should be running on `http://localhost:5173` or similar

### Step 1: Create Test Users

Run the test user seeding script to create test accounts:

```bash
cd backend
node seed-test-users.js
```

This creates:
- **Admin Account**: `admin-001` / `Admin@1234`
- **Teacher Accounts**: `teacher-001` / `Teacher@2024`, `teacher-002` / `Teacher@2024`
- **Student Account**: `student-001` / `Student@2024`

### Step 2: Test Login Flow

#### Valid Login (Should Succeed ✓)
1. Navigate to the login page: `http://localhost:5173/login`
2. Enter credentials:
   - Login ID/Email: `teacher-001`
   - Password: `Teacher@2024`
3. Click "Sign in"
4. **Expected Result**: Login succeeds, redirects to dashboard, no error messages

#### Invalid Login (Should Fail Gracefully ✓)
1. Enter incorrect password: `teacher-001` / `wrongpassword`
2. Click "Sign in"
3. **Expected Result**: Shows error message "Invalid credentials"
4. **Console Check**: Single warning log entry, no repeated 401 errors

#### Missing User (Should Fail Gracefully ✓)
1. Enter non-existent ID: `nonexistent-user` / `AnyPassword123`
2. Click "Sign in"
3. **Expected Result**: Shows error message "Invalid credentials"
4. **Console Check**: Single warning log entry

### Step 3: Test Teacher Dashboard

#### Successful Dashboard Load ✓
1. Login as `teacher-001` / `Teacher@2024`
2. Navigate to teacher dashboard
3. **Expected Result**: Dashboard loads with stats (assignments, students, exams)
4. **Console Check**: No 500 errors, only info/warn level logs

#### Missing Teacher Profile Handling ✓
*(Only applicable if you manually create a TEACHER user without a teacher profile)*

1. If teacher dashboard returns 404 error with message "Teacher profile not found"
2. **Expected Result**: Error is properly logged and handled
3. **Fix**: Admin should ensure all TEACHER users have corresponding Teacher profiles

### Step 4: Verify Console Logs

#### Expected Logs During Normal Operation:
```
[Auth] Login successful for user: <user-id>
[Auth] Session restored for user: <user-id>
```

#### Expected Logs on Auth Failure:
```
[Auth] Login failed for identifier: tea... (Status: 401)
[Auth] Stored session expired or invalid
```

#### What Should NOT Appear:
- Repeated "401 Unauthorized" errors in a loop
- Unhandled exception stack traces for missing teacher profiles
- Multiple identical error logs within seconds

## Database Relationships

### User Model
- Has: `id`, `loginId` (unique), `email`, `password`, `role`, `isActive`, `isDeleted`
- Can relate to: `Teacher`, `Student`, `Parent`

### Teacher Model
- Must have: `userId` (foreign key to User), `firstName`, `lastName`
- Can have: `staffId`, `qualification`, `address`, `phoneNumber`

### Important Constraint
- Every User with role=TEACHER **must** have exactly one Teacher profile
- If this constraint is violated, dashboard requests will fail with 404 error

## Troubleshooting

### Issue: "Password confirmation does not match" during registration
**Solution**: Ensure password and confirmPassword fields match exactly

### Issue: Login returns 401 with valid credentials
**Possible Causes**:
- User account is marked as `isDeleted = true` or `isActive = false`
- Password hash doesn't match (can happen if db was restored)
- **Solution**: Re-run seed script or manually update user status

### Issue: Teacher dashboard returns 404 "Teacher profile not found"
**Solution**:
1. Check if Teacher record exists for the user:
   ```sql
   SELECT * FROM "Teacher" WHERE "userId" = '<user_id>';
   ```
2. If missing, create it:
   ```sql
   INSERT INTO "Teacher" (id, "userId", "firstName", "lastName", "updatedAt")
   VALUES ('<uuid>', '<user_id>', 'FirstName', 'LastName', NOW());
   ```
3. Re-run seed script to create clean test data

### Issue: Console flooded with repeated 401 errors
**Solution**:
- This should no longer happen after the fixes
- Check if any background process is repeatedly calling login endpoint
- Verify stored session tokens are being cleared properly on 401 responses

## API Endpoints Reference

### Authentication
- `POST /auth/login` - Login with credentials
- `POST /auth/register` - Create new account
- `GET /auth/me` - Get current user profile (requires valid token)
- `POST /auth/forgot-password` - Initiate password reset

### Teacher Operations (Protected - requires TEACHER or ADMIN role)
- `GET /teachers/dashboard` - Get teacher dashboard stats
- `GET /teachers/dashboard-stats` - Get detailed dashboard statistics
- `GET /teachers/assignments` - Get teaching assignments
- `GET /teachers/classes` - Get assigned classes

## Performance Notes

### Dashboard Load Time
- Should complete within 2-3 seconds for typical data
- Parallel Promise.all() fetches 6 different data sets concurrently
- Attendence records limited to 100 records for performance

### Token Expiration
- JWT tokens expire after 24 hours (configurable in auth.module.ts)
- Expired tokens automatically clear session on next API call
- User is redirected to login page

## Next Steps

1. Run the test seed script: `node seed-test-users.js`
2. Test login with the provided credentials
3. Access teacher dashboard and verify it loads successfully
4. Check browser console for proper error logging (no spam)
5. All tests should pass without 401 loops or 500 errors

For questions or issues, please check the error logs in the browser console and terminal output.
