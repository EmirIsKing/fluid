# OnePay - Project TODO

## Phase 2: Database Schema & Configuration
- [x] Update database schema with transactions, contacts, delegations, and user profiles tables
- [x] Generate and apply database migrations via webdev_execute_sql
- [x] Set up Particle Auth credentials (projectId, projectClientKey, projectAppUuid)
- [x] Configure environment variables for Particle Network integration
- [x] Create database query helpers in server/db.ts

## Phase 3: Landing Page
- [x] Design and implement hero section with headline and subheading
- [x] Create feature highlights section showcasing key benefits
- [x] Add wallet connect CTA button
- [x] Implement responsive layout for mobile/tablet/desktop
- [x] Add dark mode styling with neon accent colors
- [x] Test accessibility and keyboard navigation

## Phase 4: Wallet Connection
- [x] Integrate Particle Auth SDK into the project
- [x] Implement wallet connection flow with MetaMask/Particle Auth
- [x] Add EIP-7702 delegation detection logic
- [x] Create delegation activation UI component
- [x] Handle wallet connection errors and edge cases
- [x] Store user's wallet address and delegation status in database
- [x] Write vitest tests for wallet connection logic

## Phase 5: Dashboard
- [x] Implement getPrimaryAssets() call to fetch unified balance
- [x] Create balance display component with USD value
- [x] Build per-chain asset breakdown view
- [x] Implement transaction history list component
- [x] Add transaction filtering/sorting options
- [x] Create dashboard layout with navigation
- [x] Ensure responsive design for all screen sizes
- [x] Write vitest tests for balance fetching and display

## Phase 6: Send Payment Flow
- [x] Create send payment form component
- [x] Implement recipient address/username input with validation
- [x] Add token selection dropdown (USDC, USDT, ETH, etc.)
- [x] Add destination chain selection
- [x] Implement amount input with validation
- [x] Create confirmation screen showing transaction details
- [x] Integrate Universal Accounts SDK for cross-chain transfer
- [x] Handle transaction signing and execution
- [x] Add transaction success/error states
- [x] Write vitest tests for send flow logic

## Phase 7: Receive Payment Page
- [x] Generate QR code for Universal Account address
- [x] Display EVM Universal Account address
- [x] Display Solana Universal Account address
- [x] Implement copy-to-clipboard functionality
- [x] Create shareable payment link/request feature
- [x] Ensure responsive layout for mobile
- [x] Add visual indicators for address types
- [x] Write vitest tests for QR code generation

## Phase 8: User Profile Page
- [x] Create profile page layout
- [x] Display username and user info
- [x] Show linked wallet addresses (EVM and Solana)
- [x] Implement account settings section
- [x] Add profile editing functionality
- [x] Display Universal Account status
- [x] Create logout functionality
- [x] Ensure mobile responsiveness
- [x] Write vitest tests for profile operations

## Phase 9: EIP-7702 Delegation Management
- [x] Create delegation status indicator component
- [x] Implement per-chain delegation status display
- [x] Add one-click delegation activation button per chain
- [x] Integrate delegation API calls with Universal Accounts SDK
- [x] Handle delegation success/failure states
- [x] Store delegation status in database
- [x] Create delegation management UI in settings
- [x] Write vitest tests for delegation logic

## Phase 10: UI Polish & Responsiveness
- [x] Verify dark mode consistency across all pages
- [x] Test mobile responsiveness (375px, 768px, 1024px viewports)
- [x] Add loading states and skeleton screens
- [x] Implement error boundaries and error handling
- [x] Add toast notifications for user feedback
- [x] Optimize animations and transitions
- [x] Test accessibility (WCAG compliance)
- [x] Verify keyboard navigation
- [x] Test on multiple browsers

## Phase 11: Final Review & Delivery
- [x] Comprehensive end-to-end testing
- [x] Verify all features work as specified
- [x] Test cross-chain transaction flows
- [x] Verify EIP-7702 delegation works per chain
- [x] Test mobile responsiveness thoroughly
- [x] Check performance and load times
- [x] Create checkpoint for delivery
- [x] Prepare project for user review


## UI Redesign Phase

### Phase 1: Global Theme & CSS
- [ ] Redesign color palette with modern gradient system
- [ ] Update typography with improved font hierarchy
- [ ] Create new component variants and spacing system
- [ ] Add smooth animations and transitions
- [ ] Implement improved dark mode with better contrast

### Phase 2: Landing Page Enhancement
- [ ] Create new hero section with compelling visuals
- [ ] Add animated feature cards with icons
- [ ] Implement smooth scroll animations
- [ ] Add testimonials or social proof section
- [ ] Create better CTA buttons and flows
- [ ] Add FAQ section
- [ ] Improve mobile responsiveness

### Phase 3: Component Styling
- [ ] Redesign button styles (primary, secondary, outline)
- [ ] Update card components with better shadows and borders
- [ ] Improve input field styling
- [ ] Create better modal/dialog designs
- [ ] Update navigation and header styling
- [ ] Redesign badges and status indicators

### Phase 4: Dashboard Redesign
- [ ] Improve balance display card
- [ ] Better asset grid layout
- [ ] Enhanced transaction history list
- [ ] Improved action buttons
- [ ] Better delegation status display

### Phase 5: Page Updates
- [ ] Redesign send payment flow
- [ ] Update receive payment page
- [ ] Enhance profile page
- [ ] Improve form layouts

### Phase 6: Testing & Polish
- [ ] Test on all screen sizes
- [ ] Verify animations performance
- [ ] Check accessibility
- [ ] Final visual polish
