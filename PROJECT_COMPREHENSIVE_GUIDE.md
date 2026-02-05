# 🌾 AgroStock - Comprehensive Application Documentation

## 1. Project Overview
AgroStock is a Next-Gen Dairy Farm Management & Marketplace Platform. It bridges the gap between traditional farming and modern technology by integrating **Farm Management**, **Financial Analytics**, **AI-Driven Disease Detection**, and a **Direct-to-Consumer Marketplace**.

## 2. Technical Architecture

### Frontend
- **Framework**: React.js (Vite) for high-performance rendering.
- **Styling**: Vanilla CSS with modern features (Glassmorphism, CSS Variables, Animations).
- **Icons**: Lucide React for consistent, lightweight iconography.
- **State Management**: React Context API (`AuthContext`, `LanguageContext`) for global state.

### Backend (Serverless)
- **Platform**: Google Firebase
- **Database**: Firestore (NoSQL) for real-time data syncing.
- **Auth**: Firebase Authentication (Email/Password).
- **Storage**: Firebase Storage for cattle images and reports.

### AI & Machine Learning
- **Generative AI**: Google Gemini API (Pro/Flash models) for the "Smart Assistant", "Vet Advisor", and "Feed Optimizer".
- **Computer Vision**: Custom TensorFlow/Keras models for **Crop & Cattle Disease Detection** (running via a Python/Flask inference backend or client-side integration).

---

## 3. Core Modules & Features

### 🛒 Digital Marketplace (Recent Major Update)
A fully functional e-commerce module allowing farmers to sell produce directly to buyers.
- **Atomic Transactions**: Implemented crucial "Read-before-Write" logic in Firestore to ensure stock and wallet balances are updated safely without race conditions.
- **Order Management**:
  - **Buyer View**: Track order status, view Seller/Farm details (Name, Location, Phone).
  - **Seller View**: Manage incoming orders, view Buyer details, update status (Pending -> Shipped -> Delivered).
- **Smart Checkout**:
  - Integrated `Payment.jsx` with form validation for Buyer Details (Name, Location, Phone).
  - secure payment simulation with PDF Invoice generation (`jsPDF`).

### 🤖 AI-Powered Intelligence
- **Disease & Health Scanner**:
  - Upload images of cattle or crops.
  - AI analysis to detect diseases (e.g., Lumpy Skin Disease) and recommend treatments.
- **Gemini Farm Assistant**:
  - Context-aware chatbot that answers farming queries.
  - Capable of analyzing data patterns to suggest improvements.

### 🐄 Farm Management
- **Cattle Registry**: Detailed profiles for every animal (Tag ID, Breed, Age, Weight).
- **Health Records**: Digital vaccination and treatment logs.
- **Dynamic Dashboard**: Real-time stats on Herd Size, Milk Production, and Revenue.

### 📊 Financial Analytics
- **Profit/Loss Tracking**: Visual charts for income vs. expenses.
- **Cost Analysis**: Break down costs per animal to identify inefficiencies.

---

## 4. Backend Data Schema (Firestore)

### `users`
- Stores user profile, role (Farmer/Buyer), and settings.

### `farms`
- **Key Fields**: `farmName`, `farmerName`, `mobile`, `village`, `district`, `state`, `cattleBreed`.
- Linked to `ownerId` (User UID).

### `products`
- **Key Fields**: `name`, `price`, `quantity`, `category`, `farmerId`.
- Status tracking (`Active`, `Out of Stock`).

### `orders`
- **Key Fields**: `buyerId`, `farmerId`, `productId`, `status` (Pending/paid/Delivered).
- **Enhanced Details**: `buyerLocation`, `buyerPhone`, `farmerLocation`, `farmerPhone`.
- Atomic transaction support ensures data integrity.

### `wallets`
- Tracks farmer earnings (`balance`) from marketplace sales.

---

## 5. Recent Enhancements & Fixes
- **Transaction Safety**: Fixed Firestore "Reads before Writes" validation errors in `MarketplaceService.js`.
- **Enhanced Connectivity**: Added direct "Call Farmer" and "Call Buyer" features in the Order History.
- **Runtime Stability**: Resolved `ReferenceError` crashes (e.g., missing imports like `MapPin`).

---

## 6. How to Run
1. **Install Dependencies**: `npm install`
2. **Start Dev Server**: `npm run dev`
3. **Build Prod**: `npm run build`
