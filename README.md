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
- **Hosting**: Firebase Hosting (SPAs via `dist` folder).
- **Storage**: Firebase Storage for cattle images and reports.

### AI & Machine Learning
- **Generative AI**: Google Gemini API (Pro/Flash models) for the "Smart Assistant", "Vet Advisor", and "Feed Optimizer".
- **Computer Vision**: Custom TensorFlow/Keras models for **Crop & Cattle Disease Detection**.

---

## 3. Core Modules & Features

### 🏢 Cooperative Network (NEW)
**Enabling multiple farmers to work as a single unit.**
- **Network Creation**: Farmers can create or join Cooperatives to pool resources.
- **Pooled Inventory**: View aggregate stock levels across all member farms.
- **Order Splitting**: Large orders are automatically split between members based on available stock.
- **Partner Search**: Find nearby farmers to invite to the network.

### 🏥 Professional Vet Portal (NEW)
**A dedicated dashboard for Veterinarians.**
- **Emergency Queue**: Real-time "Red Alert" list for critical cases (e.g., Lumpy Skin Disease outbreaks).
- **Case Management**: Kanban-style tracking of assigned cattle (Pending -> In Progress -> Resolved).
- **Remote Diagnosis**: View shared health reports, AI scan results, and prescribe treatments digitally.

### 🛒 Buyer Experience 2.0 (Swiggy-Style)
**A modern, consumer-facing shopping interface.**
- **Personalized Dashboard**: "Quick Reorder", "Trending Products", and "Fresh Drops" from nearby farms.
- **Smart Tracking**: Visual delivery timeline (Order Placed -> Out for Delivery -> Delivered).
- **Subscriptions**: (Planned) Options for daily/weekly milk delivery.

### 🛒 Digital Marketplace (Core)
- **Atomic Transactions**: Safety checks ensuring stock isn't oversold.
- **Order Management**: Full lifecycle tracking for Buyers and Sellers.
- **Smart Checkout**: Integrated payment simulation with PDF invoicing.

### 🤖 AI-Powered Intelligence
- **Disease & Health Scanner**: AI analysis to detect diseases and recommend treatments.
- **Gemini Farm Assistant**: Context-aware chatbot for farming queries.

### 🐄 Farm Management
- **Cattle Registry**: Detailed profiles (Tag ID, Breed, Age, Weight).
- **Health Records**: Digital vaccination and treatment logs.
- **Dynamic Dashboard**: Real-time stats on Herd Size, Milk Production, and Revenue.

---

## 4. Backend Data Schema (Firestore)

### `users`
- Stores user profile, role (`farmer`, `buyer`, `vet`, `admin`), and settings.

### `cooperatives` (NEW)
- **Key Fields**: `name`, `adminId`, `members` (Array of UIDs).
- **Purpose**: Groups farmers to allow shared inventory querying.

### `health_records`
- **Updated Fields**: `vetAssignedId`, `severity` ('Critical', 'Medium'), `vetNotes` (Array).

### `products`
- **Key Fields**: `name`, `price`, `quantity`, `category`, `farmerId`.
- **Traceability**: `sourceCattleId` linking product to specific animal health history.

### `orders`
- **Key Fields**: `buyerId`, `farmerId`, `status`, `fulfillmentType` ('Single' / 'Cooperative').
- **Atomic Config**: Uses Firestore Transactions to prevent race conditions.

---

## 5. Recent Enhancements & Fixes (Feb 2026)
- **Role-Based Routing System**:
  - Implemented smart routing in `Dashboard.jsx`.
  - **Farmers** see Farm Stats.
  - **Buyers** see Marketplace Dashboard.
  - **Vets** see Case Management Portal.
- **Firebase Hosting Fix**:
  - Corrected `firebase.json` to serve the `dist` folder instead of `public`.
  - Restored `index.html` after accidental overwrite.
- **Stability**: Resolved `ReferenceError` crashes in Dashboard logic.

---

## 6. How to Run & Deploy
1. **Install Dependencies**: `npm install`
2. **Start Dev Server**: `npm run dev`
3. **Build for Production**: `npm run build`
<<<<<<< HEAD
4. **Deploy to Web**: `firebase deploy`
