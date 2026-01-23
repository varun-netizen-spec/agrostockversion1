# AgroStock Management Platform

AgroStock is a modern, premium SaaS web application designed for cattle farmers and dairy farm managers. It provides a centralized dashboard for tracking herd health, managing farm profiles, and optimizing feed consumption using AI-driven insights.

## ✨ Features

- **🛡️ Secure Authentication**: Personal registration and login for Farmers and Admins using Firebase Auth.
- **🚜 Farm Management**: Create and maintain detailed farm profiles including location and herd size.
- **🐄 Cattle Inventory**: Track individual cattle by Tag ID, age, and breed with searchable list views.
- **🏥 Health Timeline**: Monitor vaccinations, illness history, and upcoming medical due dates.
- **💡 Feed Optimizer**: Get AI-based feed recommendations to improve milk yield and reduce cost.
- **💎 Premium UI**: Modern dark-mode aesthetic with glassmorphism and smooth micro-animations.

## 🚀 Tech Stack

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Variable System)
- **Backend & DB**: [Firebase](https://firebase.google.com/) (Auth & Firestore)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd bro
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Firebase**:
   Open `src/firebase/firebase.js` and ensure the `firebaseConfig` object contains your project credentials.

4. **Environment Setup**:
   Ensure you have enabled the following in your [Firebase Console](https://console.firebase.google.com/):
   - **Authentication**: Enable Email/Password method.
   - **Firestore Database**: Initialize in Test Mode (or apply security rules).

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```text
src/
├── components/      # Reusable UI components (Sidebar, etc.)
├── context/         # Auth state management
├── firebase/        # Firebase configuration
├── pages/           # Individual module screens
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── CattleList.jsx
│   ├── HealthRecords.jsx
│   └── FeedOptimizer.jsx
├── App.jsx          # Main routing logic
├── index.css        # Core design system
└── main.jsx         # Entry point
```

## 📜 License

This project is open-source and available under the MIT License.
