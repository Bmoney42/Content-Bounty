# Content Bounty Platform

A modern content bounty platform connecting businesses with creators. Built with React, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

- **User Authentication** - Secure login/register with Firebase Auth
- **Dual User Types** - Separate experiences for creators and businesses
- **Bounty Management** - Create, browse, and manage content bounties
- **Real-time Data** - Firebase Firestore integration with mock data fallbacks
- **Responsive Design** - Beautiful UI that works on all devices
- **Modern Tech Stack** - React 19, TypeScript, Vite, Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore)
- **State Management**: React Context + React Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bmoney42/Content-Bounty.git
   cd content-bounty
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your Firebase config

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id-here
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "Content-Bounty"
4. Enable Google Analytics (optional)
5. Choose your location

### 2. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method"
4. Enable "Email/Password"
5. Save

### 3. Set up Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location
5. Create

### 4. Get Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web
4. Register your app
5. Copy the config object
6. Add the values to your `.env` file

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── bounty/         # Bounty-related components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components
│   └── ui/            # Basic UI components
├── config/            # Configuration files
│   └── firebase.ts    # Firebase configuration
├── contexts/          # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── services/          # API and service functions
│   └── firebase.ts    # Firebase service functions
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

## 🎯 Key Features

### Authentication
- Email/password registration and login
- User type selection (creator/business)
- Protected routes
- Persistent sessions

### Bounty System
- Create content bounties
- Browse available bounties
- Apply for bounties
- Track bounty status

### User Profiles
- Creator profiles with portfolio
- Business profiles with company info
- Real-time stats with mock data fallbacks
- Profile customization

### Dashboard
- Creator dashboard with earnings
- Business dashboard with campaign metrics
- Recent activity tracking
- Performance analytics

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
- **Netlify**: Drag and drop the `dist` folder
- **Firebase Hosting**: Use `firebase deploy`
- **AWS/GCP**: Upload the `dist` folder to your hosting service

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Environment Variables
All Firebase configuration should be in environment variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you need help:
1. Check the Firebase documentation
2. Review the code comments
3. Open an issue on GitHub

## 🎉 Demo Accounts

For testing purposes, you can use these demo accounts:
- **Creator**: `creator@demo.com` / `password123`
- **Business**: `business@demo.com` / `password123`

These will work even without Firebase configured (fallback mode).
