# New Log Creation View Implementation Plan

## 1. Overview

The New Log Creation view has been successfully implemented as a comprehensive meal logging system that allows users to record their meals, ingredients, and symptoms with severity tracking. The implementation follows Gutsy's privacy-first approach and integrates seamlessly with the existing Supabase backend.

## 2. View Routing

- **Path**: `/logs/new`
- **File**: `src/pages/logs/new.astro`
- **Access**: Public (will require authentication in production)

## 3. Component Structure

```
CreateLogForm (React Component)
├── Date Input (HTML5 date picker)
├── Ingredients Input (comma-separated text input)
├── Symptoms Section
│   ├── Symptom Selector (Dropdown)
│   ├── Severity Selector (1-5 scale)
│   ├── Add Button
│   └── Selected Symptoms List
├── Notes Textarea (optional)
├── Form Validation & Error Display
└── Submit/Cancel Actions
```

## 4. Component Details

### CreateLogForm Component

- **Description**: Main interactive form for log creation with React state management
- **Location**: `src/components/CreateLogForm.tsx`
- **Main Elements**: Form inputs, validation feedback, submit button, selected symptoms list
- **Handled Events**: Form submission, ingredient text changes, symptom selection/removal
- **Validation**: Required date, at least one ingredient, severity range 1-5
- **Types**: `CreateLogRequest`, `FormSymptom`, `SymptomSelectorState`
- **Props**: `onSuccess` callback function for navigation after successful creation

### Symptoms Management

- **Multi-step process**: Select symptom → Select severity → Add to list → Review/Remove
- **Real-time validation**: Ensures valid symptom ID and severity range
- **State management**: Local form state with ability to update/remove symptoms

## 5. Types

### Key Types Created:

- **FormSymptom**: Internal form state for selected symptoms

  ```typescript
  interface FormSymptom {
    symptomId: number;
    symptomName: string;
    severity: number;
  }
  ```

- **SymptomSelectorState**: State for the symptom selection UI
  ```typescript
  interface SymptomSelectorState {
    selectedSymptomId: string;
    selectedSeverity: string;
  }
  ```

### Updated Types:

- **CreateLogRequest**: Modified to match API expectations (ingredients as string array)

## 6. State Management

### Custom Hooks Created:

- **useCreateLog**: Handles log creation API calls with loading/error states
- **useSymptoms**: Fetches available symptoms for the selector

### Local Component State:

- Form data: `logDate`, `ingredients`, `notes`
- Selected symptoms array with ability to add/remove
- Symptom selector state for UI flow
- Form validation errors array
- Loading and success states

## 7. API Integration

### Endpoint: POST /api/logs

- **Request Type**: `CreateLogRequest`
- **Response Type**: `LogResponse`
- **Error Handling**: Comprehensive error display with form validation feedback
- **Authentication**: Uses existing Supabase middleware integration

### Supporting Endpoint: GET /api/symptoms

- **Used for**: Populating symptom dropdown options
- **Response Type**: `SymptomsResponse`

## 8. User Interactions

### Primary Flow:

1. User enters meal date (defaults to today)
2. User inputs ingredients as comma-separated text
3. User selects symptoms and severity levels (optional)
4. User adds optional notes
5. User submits form
6. Success: Redirects to home page
7. Error: Displays validation/API errors

### Symptom Management Flow:

1. Select symptom from dropdown
2. Select severity (1-5 scale with descriptive labels)
3. Click "Add Symptom" button
4. Review in selected symptoms list
5. Remove individual symptoms if needed

## 9. Conditions and Validation

### Form-Level Validation:

- **Date**: Required, cannot be in the future
- **Ingredients**: At least one ingredient required
- **Symptoms**: Valid symptom ID and severity 1-5 range
- **Notes**: Optional, no validation

### API-Level Validation:

- Uses existing Zod schema validation from `/api/logs`
- Handles server-side validation errors with detailed feedback

## 10. Error Handling

### Error Types Handled:

- **Form Validation**: Required fields, format validation
- **API Errors**: Network failures, server validation, business logic errors
- **Loading States**: Prevents multiple submissions, shows loading feedback

### Error Display:

- Form validation errors in red alert box with bullet points
- API errors in separate red alert box
- Success feedback in green alert box

## 11. Implementation Steps Completed

1. ✅ **Added Required UI Components**
   - Installed shadcn/ui components: `input`, `textarea`, `select`, `calendar`

2. ✅ **Created Custom Hooks**
   - `useCreateLog.ts`: API submission logic with state management
   - `useSymptoms.ts`: Symptoms data fetching

3. ✅ **Updated Type Definitions**
   - Fixed `CreateLogRequest` to match API schema
   - Added form-specific types

4. ✅ **Built Form Component**
   - `CreateLogForm.tsx`: Comprehensive form with validation
   - Ingredient text input with comma-separated parsing
   - Multi-step symptom selection process
   - Form validation and error handling

5. ✅ **Created Page Structure**
   - `src/pages/logs/new.astro`: Main page with React integration
   - Proper layout integration with navigation

6. ✅ **Enhanced Navigation**
   - Added header navigation to layout
   - Updated home page with Gutsy branding and CTA
   - Added quick navigation to new log creation

## 12. Testing & Verification

The implementation has been tested with:

- ✅ Development server running successfully
- ✅ Page loads without errors
- ✅ Form renders with all expected fields
- ✅ Navigation between pages working
- ✅ Integration with existing API endpoints

## 13. Next Steps

For complete functionality, consider implementing:

- User authentication integration
- Photo upload capability (mentioned in database schema)
- Form auto-save to localStorage
- Better mobile responsiveness
- Accessibility improvements (ARIA labels, keyboard navigation)
- Unit tests for form logic and custom hooks
