# UI Architecture for Gutsy

## 1. UI Structure Overview

Gutsy's UI follows a privacy-first, mobile-responsive architecture built on Astro 5 with React 19 components for interactive elements. The interface prioritizes intuitive meal logging, clear data visualization, and actionable trigger insights while maintaining accessibility compliance and secure user data handling.

The architecture employs a hybrid approach:
- **Static Astro components** for layouts, landing pages, and authentication flows
- **Interactive React components** for forms, data entry, calendars, and dynamic visualizations
- **Responsive design patterns** using Tailwind 4 with mobile-first approach
- **Progressive enhancement** ensuring core functionality without JavaScript

Key architectural principles:
- **User data isolation** through Supabase RLS policies
- **Real-time validation** with Zod schemas for immediate user feedback
- **Optimistic updates** with server confirmation for smooth UX
- **Accessible design** with ARIA labels, keyboard navigation, and screen reader support

## 2. View List

### Landing Page
- **View name**: Landing Page
- **View path**: `/`
- **Main purpose**: Marketing introduction and user acquisition with clear value proposition
- **Key information to display**: Product benefits, privacy guarantees, sign-up call-to-action, social proof
- **Key view components**: Hero section, feature highlights, privacy statement, CTA buttons
- **UX considerations**: Clear value proposition, trust indicators, simple navigation to auth
- **Accessibility considerations**: Semantic HTML structure, alt text for images, keyboard navigation
- **Security considerations**: No sensitive data exposure, secure auth redirect

### Authentication Views
- **View name**: Sign Up / Login
- **View path**: `/auth/signup`, `/auth/login`
- **Main purpose**: Secure user onboarding and session establishment
- **Key information to display**: Auth forms, privacy consent, password requirements, error feedback
- **Key view components**: Supabase Auth integration, form validation, consent checkboxes, loading states
- **UX considerations**: Clear form labels, immediate validation feedback, password visibility toggle
- **Accessibility considerations**: Form labels, error announcements, focus management
- **Security considerations**: Supabase Auth integration, HTTPS enforcement, GDPR consent capture

### Dashboard/Home
- **View name**: Dashboard
- **View path**: `/dashboard`
- **Main purpose**: Central navigation hub and quick access to primary actions
- **Key information to display**: Recent logs summary, quick actions, navigation menu, user status
- **Key view components**: Navigation cards, recent activity feed, quick log entry button, stats overview
- **UX considerations**: Clear visual hierarchy, prominent CTA for new log, easy navigation
- **Accessibility considerations**: Skip navigation, clear headings, button labels
- **Security considerations**: User session validation, secure data fetching

### New Log Creation
- **View name**: Create Log
- **View path**: `/logs/new`
- **Main purpose**: Primary meal logging workflow with photo, ingredients, and symptoms
- **Key information to display**: Photo capture interface, ingredient input, symptom selection, date picker
- **Key view components**: Camera integration, ingredient autocomplete, severity selectors (1-5), notes textarea, save/cancel actions
- **UX considerations**: Progressive disclosure, auto-save drafts, clear validation feedback, touch-friendly controls
- **Accessibility considerations**: Camera alt flow, keyboard ingredient selection, screen reader severity announcements
- **Security considerations**: Photo size validation, ingredient normalization, user data encryption

### Log Calendar View
- **View name**: Calendar
- **View path**: `/logs/calendar`
- **Main purpose**: Historical log overview with monthly navigation and day-level detail access
- **Key information to display**: Monthly calendar grid, log indicators, navigation controls, selected day summary
- **Key view components**: Calendar component, day indicators, date navigation, mini log previews
- **UX considerations**: Touch-friendly date selection, visual log density indicators, smooth navigation
- **Accessibility considerations**: Keyboard date navigation, screen reader date announcements, clear month/year labels
- **Security considerations**: Paginated data loading, user-specific log filtering

### Log Detail View
- **View name**: Log Detail
- **View path**: `/logs/[id]`
- **Main purpose**: Comprehensive individual log inspection with full data display
- **Key information to display**: Photo (if available), complete ingredient list, symptom details with severities, notes, metadata
- **Key view components**: Photo viewer, ingredient tags, symptom severity indicators, edit/delete actions, navigation
- **UX considerations**: Clear data hierarchy, edit-in-place functionality, breadcrumb navigation
- **Accessibility considerations**: Photo alt text, severity value announcements, action button labels
- **Security considerations**: User ownership verification, secure photo URL generation

### Triggers Analysis
- **View name**: Triggers
- **View path**: `/triggers`
- **Main purpose**: Correlation analysis results with actionable dietary insights
- **Key information to display**: Date range selector, ranked trigger list, confidence intervals, export options, analysis metadata
- **Key view components**: Date range picker, trigger ranking table, confidence visualizations, export buttons, insufficient data messaging
- **UX considerations**: Clear confidence indicators, exportable results, filter explanations
- **Accessibility considerations**: Table headers, confidence interval descriptions, export format announcements
- **Security considerations**: Date range validation, user-specific correlation data

### Ingredients Management
- **View name**: Ingredients
- **View path**: `/ingredients`
- **Main purpose**: Canonical ingredient browsing and new ingredient proposal submission
- **Key information to display**: Searchable ingredient list, proposal form, submission status, admin review queue
- **Key view components**: Search input, ingredient grid, proposal form, status indicators
- **UX considerations**: Fast search, clear proposal workflow, submission confirmation
- **Accessibility considerations**: Search results announcements, form validation feedback, status updates
- **Security considerations**: Proposal validation, duplicate prevention, admin role verification

### Profile and Settings
- **View name**: Profile
- **View path**: `/profile`
- **Main purpose**: User account management, preferences, and data export/deletion
- **Key information to display**: Account information, privacy settings, data export options, deletion controls
- **Key view components**: Profile form, preferences toggles, export interface, danger zone actions
- **UX considerations**: Clear settings organization, confirmation dialogs for destructive actions
- **Accessibility considerations**: Setting descriptions, confirmation dialog focus, action result announcements
- **Security considerations**: Re-authentication for sensitive actions, secure data export, GDPR compliance

### Error Pages
- **View name**: Error Pages (404, 500, Offline)
- **View path**: `/404`, `/500`, `/offline`
- **Main purpose**: Graceful error handling with recovery guidance
- **Key information to display**: Error explanation, recovery suggestions, navigation options
- **Key view components**: Error messaging, action buttons, help links
- **UX considerations**: Clear error communication, helpful recovery paths, maintain app context
- **Accessibility considerations**: Error announcements, clear action labels, keyboard navigation
- **Security considerations**: No sensitive data in error messages, secure fallback behavior

## 3. User Journey Map

### Primary User Journey: First-Time User to Trigger Analysis

1. **Discovery & Sign-up**
   - Land on marketing page → Review features and privacy → Click sign-up CTA
   - Complete registration with consent → Email verification → Dashboard arrival

2. **Initial Log Creation**
   - Dashboard → "Create First Log" button → New log form
   - Capture meal photo → Enter ingredients (autocomplete assistance) → Select symptoms with severity → Add notes → Save

3. **Continued Usage Pattern**
   - Dashboard → Quick log entry or calendar view
   - New log creation (streamlined with defaults) → Calendar review of past logs
   - Log detail viewing for specific days → Pattern recognition over time

4. **Trigger Analysis Discovery**
   - After sufficient data (≥10 logs) → Triggers tab appears/activates
   - Date range selection → Trigger analysis viewing → Export results
   - Action on insights → Continued logging with awareness

### Secondary User Journeys

**Ingredient Management Flow:**
- Log creation → Unknown ingredient → "Propose New Ingredient"
- Ingredients page → Search existing → Submit proposal → Confirmation

**Data Export Flow:**
- Profile page → Data export section → Format selection → Download
- Triggers page → Export button → Date range confirmation → CSV/JSON download

**Account Management Flow:**
- Profile page → Account settings → Privacy preferences → Data deletion → Confirmation

### Error Recovery Journeys

**Photo Upload Failure:**
- Log creation → Photo capture → Upload error → Retry option → Alternative: continue without photo

**Network Failure:**
- Any page → Connection loss → Offline indicator → Local storage draft → Sync when reconnected

**Insufficient Data for Analysis:**
- Triggers page → "Need more data" message → Guide to logging → Quick log creation link

## 4. Layout and Navigation Structure

### Primary Navigation
- **Top-level tabs**: Dashboard, Logs, Triggers, Ingredients, Profile
- **Mobile**: Bottom tab bar with icons and labels
- **Desktop**: Horizontal navigation bar with dropdown menus

### Secondary Navigation
- **Contextual breadcrumbs** for deep pages (Log Detail, specific dates)
- **Date navigation** within calendar and triggers views
- **Modal navigation** for log creation and editing
- **Back buttons** for linear workflows

### Navigation Hierarchy
```
Dashboard (Home)
├── Quick Actions
│   ├── New Log (Modal/Page)
│   └── Recent Logs → Calendar View
├── Logs Section
│   ├── Calendar View
│   │   └── Day Detail → Log Detail
│   └── New Log Creation
├── Triggers Analysis
│   ├── Date Range Selection
│   └── Export Options
├── Ingredients
│   ├── Browse/Search
│   └── Propose New
└── Profile
    ├── Account Settings
    ├── Privacy Preferences
    ├── Data Export
    └── Account Deletion
```

### Responsive Behavior
- **Mobile First**: Touch-optimized controls, collapsed navigation, stacked layouts
- **Tablet**: Enhanced grid layouts, side navigation options, improved data density
- **Desktop**: Multi-column layouts, hover states, keyboard shortcuts, expanded navigation

### State Management
- **Authentication state** maintained across all views with automatic refresh
- **Form state** preserved during navigation and auto-saved for recovery
- **Filter state** maintained within sessions for triggers and calendar views
- **Loading states** with skeleton screens and progress indicators

## 5. Key Components

### Form Components
- **`IngredientAutocomplete`**: Search and select from canonical ingredients with fallback to raw text entry
- **`SeveritySelector`**: 1-5 scale input with visual and numeric indicators
- **`PhotoCapture`**: Camera integration with preview, compression, and upload with fallback
- **`DatePicker`**: Accessible date selection with keyboard navigation and locale support
- **`ValidationMessage`**: Consistent error and success messaging with ARIA announcements

### Data Visualization Components
- **`CalendarGrid`**: Monthly view with log indicators, touch-friendly date selection
- **`TriggerRankingTable`**: Sortable table with confidence intervals and visual indicators
- **`ConfidenceIndicator`**: Visual representation of correlation confidence with explanations
- **`SeverityHeatmap`**: Visual pattern recognition for symptoms over time
- **`LogSummaryCard`**: Compact log display for lists and previews

### Navigation Components
- **`TabNavigation`**: Responsive tab bar with active states and badge indicators
- **`Breadcrumbs`**: Contextual navigation path with accessibility support
- **`DateNavigation`**: Previous/next controls for calendar and time-based views
- **`SearchInput`**: Optimized search with suggestions and keyboard navigation
- **`ActionButton`**: Consistent CTA styling with loading states and accessibility

### Utility Components
- **`LoadingSpinner`**: Progress indication with accessible labeling
- **`ErrorBoundary`**: Graceful error handling with recovery options
- **`ConfirmationDialog`**: Accessible modal dialogs for destructive actions
- **`Toast`**: Non-intrusive success/error notifications with auto-dismiss
- **`EmptyState`**: Helpful messaging and actions when no data is available

### Layout Components
- **`PageLayout`**: Consistent page structure with navigation and responsive behavior
- **`Modal`**: Accessible overlay for forms and detailed views
- **`CardContainer`**: Consistent content grouping with responsive spacing
- **`GridLayout`**: Flexible grid system for responsive content organization
- **`StickyHeader`**: Context-aware headers that maintain visibility during scroll

### Security and Privacy Components
- **`ConsentManager`**: GDPR compliance with clear consent options and withdrawal
- **`SecureImage`**: Signed URL handling with fallback and error states
- **`AuthGuard`**: Route protection with redirect handling and loading states
- **`DataExportInterface`**: Secure data download with format options and confirmation
- **`PrivacyIndicators`**: Clear visual indicators for data handling and storage

Each component follows accessibility guidelines with proper ARIA labeling, keyboard navigation support, and screen reader compatibility. All components integrate with the Zod validation schemas for consistent data handling and include appropriate loading states and error boundaries for robust user experience.
