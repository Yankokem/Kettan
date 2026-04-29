# Design Document: Authentication UI/UX Overhaul

## Overview

This design document specifies the technical approach for overhauling the authentication UI/UX for the Kettan coffee chain operations platform. The redesign transforms the authentication flow pages (login, sign-up, OTP verification, and company onboarding) with a modern, premium aesthetic while maintaining all existing backend authentication functionality.

### Design Goals

1. **Visual Modernization**: Implement centered layouts with ambient gradients for registration flow pages
2. **User Journey Optimization**: Redirect sign-up flow through pricing page for plan selection
3. **Design Consistency**: Unify visual language across all authentication pages
4. **Zero Backend Changes**: All modifications are UI/presentation layer only
5. **Responsive Design**: Maintain mobile, tablet, and desktop compatibility
6. **Accessibility**: Preserve keyboard navigation and screen reader support

### Key Design Principles

- **Centered Design for Registration**: Sign-up, OTP, and onboarding pages use centered content without visible container borders
- **Two-Column Layout for Login**: Login page maintains distinct two-column layout with decorative panel
- **Ambient Gradients**: Subtle, smooth gradient backgrounds create premium feel
- **Smooth Transitions**: CSS-based animations for page transitions (300-500ms)
- **Existing Color Palette**: Browns, creams, coffee tones (#6B4C2A, #2C1A0E, #C9A87D, #F5F0E8, etc.)

## Architecture

### High-Level Component Structure

```
Authentication Flow Architecture
├── Marketing Pages
│   ├── PricingPage (entry point for new users)
│   └── MarketingNavbar (added to LoginPage)
├── Login Flow
│   └── LoginPage (two-column layout, navbar added)
└── Registration Flow (centered design)
    ├── RegisterPage (email + terms)
    ├── RegisterOtpPage (6-digit verification)
    └── RegisterOnboardingPage (company details)
```

### URL Flow and Routing

```
User Journey:
1. LoginPage → "Sign up" link → /market/pricing
2. PricingPage → Plan CTA → /market/register?plan=<plan-id>
3. RegisterPage → Submit → /market/register/otp?email=<email>&plan=<plan-id>
4. RegisterOtpPage → Verify → /market/register/onboarding?email=<email>&plan=<plan-id>&token=<token>
5. RegisterOnboardingPage → Complete → Checkout or Success
```

### Router Configuration

No new routes required. Existing routes in `kettan.client/src/app/router.tsx`:
- `/login` - LoginPage
- `/market/pricing` - PricingPage
- `/market/register` - RegisterPage
- `/market/register/otp` - RegisterOtpPage
- `/market/register/onboarding` - RegisterOnboardingPage

## Components and Interfaces

### 1. LoginPage Component

**Location**: `kettan.client/src/features/auth/LoginPage.tsx`

**Modifications**:
- Add `MarketingNavbar` component at the top
- Remove `Demo_Credentials_Section` (the demo credentials box)
- Remove `JWT_Security_Text` (the "Secured by JWT" footer text)
- Update "Sign up" link to redirect to `/market/pricing` instead of `/market/register`
- Maintain two-column layout with decorative panel (70% left, 30% right)

**Component Structure**:
```tsx
<div className="min-h-screen flex flex-col">
  <MarketingNavbar />
  <div className="flex flex-1">
    {/* Left decorative panel (70%) */}
    <div className="hidden lg:flex w-[70%]">
      {/* Existing decorative content */}
    </div>
    {/* Right form panel (30%) */}
    <div className="w-[30%]">
      {/* Login form - remove demo credentials and JWT text */}
    </div>
  </div>
</div>
```

### 2. PricingPage Component

**Location**: `kettan.client/src/features/marketing/PricingPage.tsx`

**Modifications**:
- Update plan CTA buttons to link to `/market/register?plan=<plan-id>`
- Starter plan: `/market/register?plan=starter`
- Growth plan: `/market/register?plan=growth`
- Enterprise plan: Keep as `mailto:sales@kettan.io`

**Updated CTA Logic**:
```tsx
{plan.id === "enterprise" ? (
  <a href="mailto:sales@kettan.io">Contact Sales</a>
) : (
  <Link to={`/market/register?plan=${plan.id}`}>Get Started</Link>
)}
```

### 3. RegisterPage Component (Centered Design)

**Location**: `kettan.client/src/features/marketing/RegisterPage.tsx`

**Current State**: Already uses two-column layout (70% decorative, 30% form)

**Modifications for Centered Design**:
```tsx
<div 
  className="min-h-screen flex items-center justify-center"
  style={{
    background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
  }}
>
  <div className="w-full max-w-md px-6 py-12">
    {/* Form content - no visible borders */}
    <div className="space-y-6">
      {/* Logo */}
      {/* Back to Pricing link */}
      {/* Heading */}
      {/* Plan info badge (floating, subtle shadow) */}
      {/* Form fields */}
    </div>
  </div>
</div>
```

**Key Design Changes**:
- Remove two-column layout
- Center content in viewport
- Remove visible container borders
- Apply ambient gradient background
- Add soft shadows to form elements for depth
- Maintain all existing form logic and validation

### 4. RegisterOtpPage Component (Centered Design)

**Location**: `kettan.client/src/features/marketing/RegisterOtpPage.tsx`

**Current State**: Already uses two-column layout (70% decorative, 30% form)

**Modifications for Centered Design**:
```tsx
<div 
  className="min-h-screen flex items-center justify-center"
  style={{
    background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
  }}
>
  <div className="w-full max-w-md px-6 py-12">
    {/* Form content - no visible borders */}
    <div className="space-y-6">
      {/* Logo */}
      {/* Back to email step link */}
      {/* Heading */}
      {/* Plan info badge (floating, subtle shadow) */}
      {/* OTP input */}
      {/* Resend controls */}
    </div>
  </div>
</div>
```

**Key Design Changes**:
- Remove two-column layout
- Center content in viewport
- Remove visible container borders
- Apply ambient gradient background
- Add soft shadows to form elements
- Maintain all existing OTP logic, countdown timers, and resend functionality

### 5. RegisterOnboardingPage Component (Centered Design)

**Location**: `kettan.client/src/features/marketing/RegisterOnboardingPage.tsx`

**Current State**: Already uses two-column layout (70% decorative, 30% form)

**Modifications for Centered Design**:
```tsx
<div 
  className="min-h-screen flex items-center justify-center"
  style={{
    background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
  }}
>
  <div className="w-full max-w-md px-6 py-12">
    {/* Form content - no visible borders */}
    <div className="space-y-6">
      {/* Logo */}
      {/* Back to OTP step link */}
      {/* Heading */}
      {/* Plan info badge (floating, subtle shadow) */}
      {/* Form fields (company, name, phone, address, password) */}
      {/* Password strength indicator */}
    </div>
  </div>
</div>
```

**Key Design Changes**:
- Remove two-column layout
- Center content in viewport
- Remove visible container borders
- Apply ambient gradient background
- Add soft shadows to form elements
- Maintain all existing form logic, password strength validation, and submission handling

### 6. MarketingNavbar Component

**Location**: `kettan.client/src/components/Marketing/MarketingNavbar.tsx`

**No modifications required** - component already exists and will be imported into LoginPage

## Data Models

### URL Query Parameters

**Plan Parameter Structure**:
```typescript
interface PlanQueryParam {
  plan: 'starter' | 'growth' | 'enterprise';
}
```

**Email Parameter Structure**:
```typescript
interface EmailQueryParam {
  email: string; // Email address from registration
}
```

**Token Parameter Structure**:
```typescript
interface TokenQueryParam {
  token: string; // Verification token from OTP validation
}
```

**Complete Registration Flow Parameters**:
```typescript
// /market/register?plan=growth
type RegisterPageParams = { plan: string };

// /market/register/otp?email=user@example.com&plan=growth
type OtpPageParams = { email: string; plan: string };

// /market/register/onboarding?email=user@example.com&plan=growth&token=abc123
type OnboardingPageParams = { email: string; plan: string; token: string };
```

### Plan Resolution Logic

**Existing Implementation** (in `registerPlans.ts`):
```typescript
export function resolvePlan(planParam: string | null) {
  const planId = planParam?.toLowerCase() || 'starter';
  const planInfo = {
    starter: { label: 'Starter', price: 'PHP 2,999/mo', color: '#6B4C2A', bg: '#FFF8F0' },
    growth: { label: 'Growth', price: 'PHP 7,999/mo', color: '#2C1A0E', bg: '#F5EDD8' },
    enterprise: { label: 'Enterprise', price: 'PHP 14,999/mo', color: '#546B3F', bg: '#F0F5EB' },
  };
  return { planId, planInfo: planInfo[planId] || planInfo.starter };
}
```

**No changes required** - existing logic handles plan parameter resolution

## CSS/Styling Approach

### Design System Tokens

**Color Palette** (existing):
```css
--color-primary: #6B4C2A;        /* Primary brown */
--color-primary-dark: #2C1A0E;   /* Dark brown */
--color-accent: #C9A84C;         /* Gold accent */
--color-accent-light: #C9A87D;   /* Light gold */
--color-green: #546B3F;          /* Green accent */
--color-green-light: #93AF7E;    /* Light green */
--color-bg-cream: #FDFAF5;       /* Cream background */
--color-bg-warm: #F5EDD8;        /* Warm background */
--color-bg-tan: #EDE0C4;         /* Tan background */
--color-text-primary: #2C1A0E;   /* Primary text */
--color-text-secondary: #5C4A37; /* Secondary text */
--color-text-muted: #8C6B43;     /* Muted text */
```

**Typography** (existing):
```css
font-family: "DM Sans", "Inter", sans-serif;
```

### Centered Design Layout Pattern

**Container Structure**:
```tsx
<div 
  className="min-h-screen flex items-center justify-center"
  style={{
    background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
  }}
>
  <div className="w-full max-w-md px-6 py-12">
    {/* Content */}
  </div>
</div>
```

**Key CSS Properties**:
- `min-h-screen`: Full viewport height
- `flex items-center justify-center`: Center content vertically and horizontally
- `max-w-md`: Constrain form width to 28rem (448px)
- `px-6 py-12`: Padding for mobile responsiveness

### Ambient Gradient Backgrounds

**Registration Flow Gradient**:
```css
background: linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%);
```

**Characteristics**:
- 135-degree diagonal gradient
- Three-stop gradient for smooth transitions
- Cream → Warm → Tan color progression
- Subtle, non-distracting

### Floating Form Elements

**Input Field Styling**:
```tsx
<input
  className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
  style={{
    border: "1.5px solid rgba(107,76,42,0.2)",
    backgroundColor: "#FDFAF5",
    boxShadow: "0 2px 8px rgba(107,76,42,0.06)",
  }}
  onFocus={(e) => {
    e.target.style.borderColor = "#6B4C2A";
    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08), 0 4px 12px rgba(107,76,42,0.12)";
  }}
  onBlur={(e) => {
    e.target.style.borderColor = "rgba(107,76,42,0.2)";
    e.target.style.boxShadow = "0 2px 8px rgba(107,76,42,0.06)";
  }}
/>
```

**Button Styling**:
```tsx
<button
  className="w-full py-3.5 rounded-xl text-white transition-all duration-200"
  style={{
    backgroundColor: "#6B4C2A",
    fontWeight: 700,
    boxShadow: "0 4px 16px rgba(107,76,42,0.3)",
  }}
>
  Submit
</button>
```

**Plan Info Badge Styling**:
```tsx
<div
  className="px-4 py-3 rounded-xl"
  style={{
    backgroundColor: planInfo.bg,
    border: `1.5px solid ${planInfo.color}30`,
    boxShadow: "0 2px 12px rgba(107,76,42,0.08)",
  }}
>
  {/* Plan details */}
</div>
```

### Smooth Transitions

**Page Transition Animation**:
```tsx
<StaticMotionDiv
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Page content */}
</StaticMotionDiv>
```

**Input Focus Transition**:
```css
transition: border-color 0.2s, box-shadow 0.2s;
```

**Button Hover Transition**:
```css
transition: all 0.2s;
```

### Responsive Design Breakpoints

**Mobile (< 1024px)**:
```tsx
<div className="hidden lg:flex">
  {/* Decorative panel - hidden on mobile */}
</div>

<div className="w-full lg:w-[30%]">
  {/* Form - full width on mobile, 30% on desktop */}
</div>
```

**Responsive Padding**:
```tsx
<div className="px-6 lg:px-12">
  {/* Adaptive padding */}
</div>
```

## Error Handling

### Validation Error Display

**Error Message Styling**:
```tsx
{errors.fieldName && (
  <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>
    {errors.fieldName}
  </p>
)}
```

**Error Input Border**:
```tsx
<input
  style={{
    border: errors.fieldName ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.2)",
  }}
/>
```

**Submit Error Banner**:
```tsx
{submitError && (
  <div
    className="rounded-lg px-3 py-2"
    style={{
      backgroundColor: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.25)",
    }}
  >
    <p style={{ fontSize: "12px", color: "#B91C1C", fontWeight: 600 }}>
      {submitError}
    </p>
  </div>
)}
```

### Backend Error Preservation

**No changes to error handling logic**:
- All existing API error handling remains unchanged
- All existing validation logic remains unchanged
- All existing error state management remains unchanged

## Testing Strategy

### Property-Based Testing Assessment

**Property-based testing is NOT applicable for this feature** because:

1. **UI Rendering Focus**: This feature is primarily about visual design changes (centered layouts, ambient gradients, soft shadows, CSS styling)
2. **No Universal Properties**: There are no universal properties that hold across all inputs - the changes are about how components render, not about data transformations or business logic
3. **Visual Correctness**: Testing requires visual verification (layout, colors, spacing) rather than functional correctness across input ranges
4. **No Data Transformations**: No parsers, serializers, algorithms, or data processing logic that would benefit from property-based testing

**Appropriate Testing Approaches**:
- **Snapshot Tests**: Capture component rendering output for regression detection
- **Visual Regression Tests**: Compare screenshots before/after changes
- **Manual Testing**: Verify visual design matches specifications
- **Example-Based Unit Tests**: Test specific user interactions and routing logic
- **Integration Tests**: Verify authentication flow continues to work end-to-end

### Manual Testing Checklist

**Visual Regression Testing**:
1. Compare before/after screenshots of all authentication pages
2. Verify centered layouts on RegisterPage, OtpPage, OnboardingPage
3. Verify two-column layout maintained on LoginPage
4. Verify ambient gradients render correctly
5. Verify soft shadows on form elements
6. Verify smooth transitions between pages (300-500ms)
7. Verify plan info badges display correctly with appropriate colors

**Functional Testing**:
1. Test complete registration flow: Pricing → Register → OTP → Onboarding
2. Test plan parameter preservation through all steps
3. Test "Sign up" link on LoginPage redirects to PricingPage
4. Test plan CTA buttons on PricingPage redirect to RegisterPage with correct plan parameter
5. Test all form validations still work correctly
6. Test OTP resend functionality still works
7. Test password strength indicator still works
8. Test backend API calls still succeed
9. Test error messages display correctly with new styling
10. Test loading states display correctly

**Responsive Testing**:
1. Test all pages on mobile (< 768px)
2. Test all pages on tablet (768px - 1024px)
3. Test all pages on desktop (> 1024px)
4. Verify decorative panels hidden on mobile
5. Verify forms display full-width on mobile
6. Verify centered layouts work on all screen sizes
7. Verify touch interactions work on mobile devices

**Accessibility Testing**:
1. Test keyboard navigation through all forms
2. Test tab order is logical
3. Test focus indicators are visible with new styling
4. Test screen reader announcements
5. Test ARIA labels are present
6. Test color contrast ratios meet WCAG AA standards
7. Test form error announcements for screen readers

**Browser Compatibility Testing**:
1. Test on Chrome (latest)
2. Test on Firefox (latest)
3. Test on Safari (latest)
4. Test on Edge (latest)
5. Verify gradient backgrounds render correctly across browsers
6. Verify CSS transitions work smoothly across browsers

### Example-Based Unit Tests

**Routing Logic Tests**:
```typescript
describe('LoginPage', () => {
  it('should redirect to pricing page when sign up link is clicked', () => {
    // Test that "Sign up" link points to /market/pricing
  });
});

describe('PricingPage', () => {
  it('should include plan parameter in register link for starter plan', () => {
    // Test that starter CTA links to /market/register?plan=starter
  });
  
  it('should include plan parameter in register link for growth plan', () => {
    // Test that growth CTA links to /market/register?plan=growth
  });
  
  it('should keep enterprise plan as mailto link', () => {
    // Test that enterprise CTA is mailto:sales@kettan.io
  });
});

describe('RegisterPage', () => {
  it('should read plan parameter from URL', () => {
    // Test that plan parameter is correctly extracted from query string
  });
  
  it('should display correct plan info based on parameter', () => {
    // Test that plan info badge shows correct plan details
  });
});
```

**Component Rendering Tests**:
```typescript
describe('RegisterPage Centered Layout', () => {
  it('should render centered layout without visible borders', () => {
    // Test that container has centered flex layout
    // Test that no visible border styles are applied
  });
  
  it('should apply ambient gradient background', () => {
    // Test that background gradient is applied
  });
  
  it('should apply soft shadows to form elements', () => {
    // Test that form elements have box-shadow styles
  });
});
```

### Integration Tests

**Authentication Flow Tests**:
```typescript
describe('Complete Registration Flow', () => {
  it('should complete registration from pricing to onboarding', async () => {
    // 1. Navigate to /market/pricing
    // 2. Click "Get Started" on Growth plan
    // 3. Verify redirect to /market/register?plan=growth
    // 4. Fill email and agree to terms
    // 5. Submit and verify redirect to OTP page
    // 6. Enter OTP code
    // 7. Verify redirect to onboarding page
    // 8. Fill company details
    // 9. Submit and verify successful registration
  });
  
  it('should preserve plan parameter through entire flow', async () => {
    // Test that plan parameter is maintained in URL at each step
  });
});
```

**Existing Tests**:
- All existing authentication integration tests should continue to pass without modification
- No changes to backend authentication logic means existing API tests remain valid
- Existing form validation tests should continue to work with new styling

## Implementation Plan

### Phase 1: LoginPage Updates

**Files to modify**:
- `kettan.client/src/features/auth/LoginPage.tsx`

**Changes**:
1. Import `MarketingNavbar` component
2. Add `MarketingNavbar` at top of page
3. Remove demo credentials section
4. Remove JWT security text
5. Update "Sign up" link to redirect to `/market/pricing`

**Estimated effort**: 1 hour

### Phase 2: PricingPage Updates

**Files to modify**:
- `kettan.client/src/features/marketing/PricingPage.tsx`

**Changes**:
1. Update plan CTA buttons to link to `/market/register?plan=<plan-id>`
2. Keep Enterprise plan as mailto link

**Estimated effort**: 30 minutes

### Phase 3: RegisterPage Centered Design

**Files to modify**:
- `kettan.client/src/features/marketing/RegisterPage.tsx`

**Changes**:
1. Replace two-column layout with centered design
2. Remove decorative panel
3. Apply ambient gradient background
4. Remove visible container borders
5. Add soft shadows to form elements
6. Maintain all existing form logic

**Estimated effort**: 2 hours

### Phase 4: RegisterOtpPage Centered Design

**Files to modify**:
- `kettan.client/src/features/marketing/RegisterOtpPage.tsx`

**Changes**:
1. Replace two-column layout with centered design
2. Remove decorative panel
3. Apply ambient gradient background
4. Remove visible container borders
5. Add soft shadows to form elements
6. Maintain all existing OTP logic

**Estimated effort**: 2 hours

### Phase 5: RegisterOnboardingPage Centered Design

**Files to modify**:
- `kettan.client/src/features/marketing/RegisterOnboardingPage.tsx`

**Changes**:
1. Replace two-column layout with centered design
2. Remove decorative panel
3. Apply ambient gradient background
4. Remove visible container borders
5. Add soft shadows to form elements
6. Maintain all existing form logic and password validation

**Estimated effort**: 2 hours

### Phase 6: Testing and Refinement

**Activities**:
1. Manual testing of complete flow
2. Responsive testing on all breakpoints
3. Accessibility testing
4. Visual refinement and polish

**Estimated effort**: 2 hours

**Total estimated effort**: 9.5 hours

## Deployment Considerations

### Zero Downtime Deployment

- All changes are frontend-only
- No database migrations required
- No API changes required
- Can be deployed independently of backend

### Rollback Strategy

- Frontend changes can be rolled back by reverting commit
- No data migration rollback required
- No API version compatibility concerns

### Monitoring

- Monitor authentication success rates before and after deployment
- Monitor page load times for authentication pages
- Monitor error rates for registration flow
- Monitor user drop-off rates at each step

## Appendix

### Design Mockup References

**LoginPage Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ MarketingNavbar (new)                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐  ┌──────────────┐           │
│  │                      │  │              │           │
│  │  Decorative Panel    │  │  Login Form  │           │
│  │  (70% width)         │  │  (30% width) │           │
│  │                      │  │              │           │
│  │  - Logo              │  │  - Email     │           │
│  │  - Heading           │  │  - Password  │           │
│  │  - Description       │  │  - Submit    │           │
│  │  - Stats             │  │              │           │
│  │                      │  │  (no demo    │           │
│  │                      │  │   creds)     │           │
│  │                      │  │  (no JWT     │           │
│  │                      │  │   text)      │           │
│  └──────────────────────┘  └──────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**RegisterPage Centered Layout**:
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              Ambient Gradient Background                │
│                                                         │
│                  ┌──────────────┐                      │
│                  │              │                      │
│                  │  Centered    │                      │
│                  │  Form        │                      │
│                  │  (max-w-md)  │                      │
│                  │              │                      │
│                  │  - Logo      │                      │
│                  │  - Back link │                      │
│                  │  - Heading   │                      │
│                  │  - Plan info │                      │
│                  │  - Email     │                      │
│                  │  - Terms     │                      │
│                  │  - Submit    │                      │
│                  │              │                      │
│                  └──────────────┘                      │
│                                                         │
│              (no visible borders)                       │
│              (soft shadows on elements)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Color Palette Reference

**Primary Colors**:
- `#6B4C2A` - Primary brown (buttons, links, borders)
- `#2C1A0E` - Dark brown (headings, text)
- `#C9A84C` - Gold accent (highlights, badges)

**Background Colors**:
- `#FDFAF5` - Cream (input backgrounds)
- `#F5EDD8` - Warm (gradient middle)
- `#EDE0C4` - Tan (gradient end)

**Text Colors**:
- `#2C1A0E` - Primary text
- `#5C4A37` - Secondary text
- `#8C6B43` - Muted text
- `#A39C93` - Disabled text

**Accent Colors**:
- `#546B3F` - Green (success states)
- `#93AF7E` - Light green (success backgrounds)
- `#EF4444` - Red (error states)
- `#B91C1C` - Dark red (error text)

### Typography Scale

**Headings**:
- H1: `1.7rem` (27.2px), `font-weight: 800`
- H2: `1.8rem` (28.8px), `font-weight: 800`

**Body Text**:
- Regular: `14px`, `font-weight: 400-500`
- Small: `12px`, `font-weight: 400-500`
- Tiny: `11px`, `font-weight: 500-600`

**Labels**:
- Form labels: `13px`, `font-weight: 600`
- Button text: `15px`, `font-weight: 700`

### Shadow Scale

**Subtle Shadows** (form elements at rest):
```css
box-shadow: 0 2px 8px rgba(107,76,42,0.06);
```

**Medium Shadows** (form elements on focus):
```css
box-shadow: 0 0 0 3px rgba(107,76,42,0.08), 0 4px 12px rgba(107,76,42,0.12);
```

**Strong Shadows** (buttons):
```css
box-shadow: 0 4px 16px rgba(107,76,42,0.3);
```

### Border Radius Scale

- Small: `8px` (badges, small elements)
- Medium: `12px` (cards, containers)
- Large: `16px` (buttons, inputs)

