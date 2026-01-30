# 🌾 AgroStock - Advanced Dairy Farm Management System

AgroStock is a premium, AI-powered SaaS platform designed to revolutionize dairy farm management. It combines comprehensive cattle tracking, financial analytics, and intelligent marketplace features with cutting-edge AI tools to optimize farm productivity and profitability.


## ✨ Key Features

### 📊 Intelligent Dashboard
- **Real-time Overview**: Instant visualization of herd statistics, milk production, and financial health.
- **Alerts & Notifications**: Smart reminders for vaccinations, low feed stock, and health anomalies.

### 🐄 Cattle Management
- **Detailed Profiles**: Track individual cattle by Tag ID, breed, age, and weight.
- **Lifecycle Tracking**: Monitor growth stages from calf to milking cow.
- **Health Records**: Comprehensive history of vaccinations, treatments, and AI-driven disease diagnosis.
- **Cattle Health Scanner**: **(AI-Powered)** Upload images/videos of cattle to detect diseases (Lumpy Skin, Foot & Mouth, etc.) using computer vision.

### 💰 Financial Analytics
- **Profit & Loss**: Detailed breakdown of revenue (milk sales, cattle sales) vs. expenses (feed, medical).
- **Cost Analysis**: Track cost per cattle and feed efficiency.
- **Visual Reports**: Interactive charts and graphs for financial trends.

### 🥗 Smart Feed Optimizer
- **AI Recommendations**: get scientifically balanced feed mixes based on cattle weight, milk field, and available ingredients.
- **Inventory Management**: Track feed stock levels and get low-stock alerts.

### 🏪 Marketplace
- **Buy & Sell**: A dedicated platform for farmers to trade cattle, feed, and equipment.
- **Order Management**: Track orders, shipments, and transaction history.
- **Product Intelligence**: Insights into market trends and pricing.

### 🧠 Advanced AI Capabilities
- **Gemini Assistant**: Integrated AI chatbot for general farming queries and advice.
- **Anomaly Detection**: Algorithms to spot irregular patterns in milk production or health metrics.

## 🚀 Technology Stack

- **Frontend**: [React.js](https://reactjs.org/) (Vite)
- **State Management**: React Context API
- **Routing**: React Router v6
- **Styling**: Modern CSS3 with Custom Properties (Glassmorphism & animated UI)
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **AI/ML**: Google Gemini API, Custom ML Models (TensorFlow/Keras for disease detection)
- **Visualization**: Recharts
- **Utilities**: Lucide React (Icons), jsPDF (Reports), XLSX (Excel export)

## 🛠️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/agrostock.git
    cd agrostock
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    - Create a project in the [Firebase Console](https://console.firebase.google.com/).
    - Enable **Authentication** (Email/Password).
    - Enable **Firestore Database** and **Storage**.
    - Copy your Firebase config object.
    - Update `src/firebase/firebase.js` with your credentials:
      ```javascript
      const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        // ...
      };
      ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```
src/
├── components/       # Reusable UI components (Sidebar, Charts, Cards)
├── context/         # Global state (Auth, Data)
├── firebase/        # Firebase configuration and initializers
├── pages/           # Application views
│   ├── Dashboard.jsx
│   ├── CattleList.jsx
│   ├── HealthRecords.jsx
│   ├── FinancialAnalytics.jsx
│   ├── Marketplace.jsx
│   ├── FeedOptimizer.jsx
│   ├── CattleHealthScanner.jsx (AI)
│   └── ...
├── services/        # Logic & API layers
│   ├── geminiService.js   # AI integration
│   ├── FeedService.js     # Nutrition logic
│   └── ...
├── styles/          # Global styles and themes
└── App.jsx          # Main routing & layout
```
