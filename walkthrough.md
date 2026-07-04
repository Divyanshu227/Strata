# Walkthrough: Strata - Authentication & 3-Step Developer Onboarding Wizard

We have successfully implemented a complete, secure multi-tenant authentication architecture and onboarding wizard flow:

1. **User Accounts & Relational Relational Schema**:
   * Upgraded the database schema in [schema.prisma](file:///c:/Users/divya/Desktop/Strata/prisma/schema.prisma) to add a `User` profile entity.
   * Relational mapping binds each `Project` to its owning user (`ownerId`), maintaining clean multi-tenant isolation.
2. **PBKDF2 Password Hashing & Cookie Sessions**:
   * Cryptographically secure password encryption using Node's native `crypto` module (preventing platform-dependent bcrypt build failures).
   * Secure, signed HTTP-only cookie session tokens (`strata-session`) with automated verification logic.
3. **Interactive 3-Step Onboarding Wizard**:
   * Renders dynamically when the user is not authenticated.
   * **Step 1 (Profile & Platform info)**: Collects Developer Name, Email, Platform Name, and Platform URL (CORS reference).
   * **Step 2 (Set Username)**: Pre-populates suggestions based on name. Queries database for uniqueness, recommending **3 available clickable suggestions** (e.g. `johndoe_dev`, `johndoe_strata`) if taken.
   * **Step 3 (Set Password)**: Prompts for a password, explicitly informing that leaving it blank fallback-assigns `12345678`.
4. **Welcome Email Dispatch & Mock Logger**:
   * Upon successful registration, dispatches a welcome email containing their credentials and instructions.
   * Uses real SMTP if variables are configured in `.env.local`, and seamlessly falls back to writing logs to a local file: `C:\Users\divya\Desktop\Strata\mock-emails.log`.
5. **Dashboard Project Selector Dropdown & Creator Modal**:
   * Switch dynamically between projects using a dropdown menu in the sidebar. Switching re-triggers the messages and stats sync for that project's token.
   * Create new projects directly from the dashboard sidebar using a "Create Project" plus-icon button modal.
   * Cleaned up the leftmost bottom sidebar: Removed the redundant API key card and replaced it with the developer's full name, email, and a clean logout action.

---

## 🚀 How to Run and Verify

### Step 1: Push database schema & Start Server
Sync the database structure with Supabase:
```bash
npx prisma db push --force-reset
```
Start your development server:
```bash
npm run dev
```

### Step 2: Test Onboarding Register Wizard
1. Open [http://localhost:3000](http://localhost:3000). You will be greeted by the secure **Strata onboarding portal**.
2. Click **Create Account** and fill in Step 1 (Owner Name: `Jane Doe`, Email: `jane@strata.io`, Platform: `SaaS Portal`, URL: `https://my-saas.com`). Click "Continue".
3. In Step 2, notice the username field is automatically pre-populated with `jane_doe`. Change it to `testuser` or keep it. Click "Next".
4. In Step 3, leave the password field completely blank. Click **Register Account**.
5. The onboarding wizard will submit, authorize, write the HTTP-only cookie, and redirect you to the main developer dashboard.

### Step 3: Verify the Registration Success Email
1. Open the file [mock-emails.log](file:///C:/Users/divya/Desktop/Strata/mock-emails.log) inside your project root.
2. Confirm the formatted log entry exists:
   * **Subject**: `Registration Successful on Strata`
   * **To**: `jane@strata.io`
   * **Body**: *"Welcome Jane Doe! Registration is successful. Kindly change password upon login, default password is 12345678."*

### Step 4: Verify Username Recommendation Engine
1. Click **Log Out** (bottom-left corner icon).
2. Go to **Create Account** again. Complete Step 1 with Name: `Jane Doe`, Email: `another-email@strata.io`, Platform details. Click "Continue".
3. In Step 2, type the exact same username you registered in Step 2 of the previous test. Click "Next".
4. In Step 3, click Register.
5. Notice you are kicked back to Step 2 with a warning banner: *"That username is already taken. Please choose one of our recommendations below..."*.
6. Click one of the **three suggested username buttons** (e.g., `testuser_dev`). The username field will update instantly. Complete registration!

### Step 5: Test Multi-Project Workspace Selector
1. Inside the main dashboard sidebar, click the **Plus (+)** icon next to the Project Workspace selection dropdown.
2. Enter Name: `E-commerce Form`, Platform: `Shopify Portal`, URL: `https://my-shop.com`. Click **Create Project**.
3. The dashboard switches workspace settings dynamically, updates stats cards, and refreshes the developer integration snippets.
