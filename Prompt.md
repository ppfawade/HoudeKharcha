<role>Senior React Native & Expo Developer</role>
<task>
Build "HoudeKharcha": A private, on-device INR expense tracker with a shareable Bento Dashboard.
</task>

<requirements>
1. Core Tech: React Native (Expo), AsyncStorage for local persistence, Expo-Haptics.
2. Categories & Icons:
   - Provide a pre-defined list: [
     { label: 'Groceries', icon: 'shopping-cart' },
     { label: 'Fuel/Transport', icon: 'fuel' },
     { label: 'Dining/Chai', icon: 'coffee' },
     { label: 'Rent/Bills', icon: 'home' },
     { label: 'Health', icon: 'stethoscope' },
     { label: 'Entertainment', icon: 'clapperboard' },
     { label: 'Others', icon: 'layers' }
   ]
3. Dashboard UI (Bento Layout):
   - Card A (Full): Monthly Total in ₹ (Bold, Green accent).
   - Card B (Half): Daily Spend vs. daily limit of ₹500.
   - Card C (Half): Count of transactions today.
   - Card D (Full): Scrollable Transaction History (Amount, Date, Category Icon, Note).
4. Share Mechanism:
   - "Export Dashboard" button: Use 'react-native-view-shot' to capture the 3 summary cards (A, B, C) as a branded image card.
   - Use 'expo-sharing' to open the Android share sheet.
5. UI Polish:
   - Background: Deep Slate (#0F172A).
   - Card Background: #1E293B.
   - Accent: #10B981 (Emerald).
   - Font: System Sans-Serif.
</requirements>

<constraints>
- Use the ₹ symbol for all currency displays.
- Ensure the 'Add Expense' modal closes automatically on success with a 'success' haptic vibration.
- Keep the code lightweight and contained in a single App.js for the Emergent Free Tier.
</constraints>
