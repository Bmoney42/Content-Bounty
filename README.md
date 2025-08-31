# Creator Sponsorship Platform

A modern platform connecting creators with brands for sponsorship opportunities, built with Next.js, TypeScript, Prisma, and Stripe.

## 🚀 Features

### Core Workflow (Option 1 - Complete)

#### For Creators
- **Browse Available Bounties**: View all open sponsorship opportunities
- **Apply for Bounties**: Submit applications with portfolio and message
- **Track Applications**: Monitor application status (Pending, Approved, Rejected)
- **Receive Payments**: Secure payment processing through Stripe
- **Profile Management**: Complete profile with bio, social links, and wallet address
- **Earnings Tracking**: View payment history and statistics

#### For Businesses
- **Create Bounties**: Post sponsorship opportunities with detailed requirements
- **Review Applications**: Manage and approve/reject creator applications
- **Track Campaigns**: Monitor bounty performance and engagement
- **Business Profiles**: Showcase your brand and requirements

#### Platform Features
- **User Authentication**: Secure login with NextAuth.js
- **Role-Based Access**: Separate interfaces for creators and businesses
- **Role Switching**: Fiverr-style mode switching between Creator and Business modes
- **Real-time Notifications**: Stay updated on application status and payments
- **Payment Processing**: Integrated Stripe payments with escrow protection
- **Responsive Design**: Works seamlessly on desktop and mobile



## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: NextAuth.js with Google OAuth and credentials
- **Payments**: Stripe integration

- **Deployment**: Vercel ready

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sponsorship-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Stripe
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   

   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### For Creators

1. **Sign up** as a creator
2. **Complete your profile** with bio and social links
3. **Browse available bounties** on the dashboard
4. **Apply for bounties** that match your skills
5. **Track your applications** and wait for approval
6. **Receive payments** once work is completed

### Role Switching

The platform supports Fiverr-style role switching, allowing users to switch between Creator and Business modes:

1. **Switch Modes**: Use the role switcher in the navigation bar to toggle between Creator and Business modes
2. **Different Interfaces**: Each mode provides a tailored interface and functionality
3. **Data Separation**: Your data (bounties, applications, earnings) is preserved when switching modes
4. **Access Control**: Only Business mode users can create bounties, only Creator mode users can apply

### For Businesses

1. **Sign up** as a business
2. **Create bounties** with detailed requirements
3. **Review applications** from creators
4. **Approve the best candidates**
5. **Track campaign performance**
6. **Process payments** through the platform

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Bounties
- `GET /api/bounties` - List bounties
- `POST /api/bounties` - Create new bounty
- `GET /api/bounties/[id]` - Get bounty details
- `POST /api/bounties/[id]/apply` - Apply for bounty

### Applications
- `PATCH /api/bounties/[id]/applications/[applicationId]` - Update application status

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Payments
- `GET /api/earnings/[id]` - Get earning details
- `POST /api/create-payment-intent` - Create Stripe payment intent

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/[id]` - Mark notification as read

## 🎨 Customization

### Styling
The platform uses Tailwind CSS for styling. You can customize the design by modifying:
- `src/app/globals.css` - Global styles
- Component-specific classes in each component


3. Set up email templates and sequences

### Database Schema
The database schema is defined in `prisma/schema.prisma`. You can modify it and run:
```bash
npx prisma db push
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The platform is compatible with any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📈 Next Steps

### Option 2: Enhanced User Experience
- Advanced search and filtering
- Creator portfolio system
- Rating and review system
- Messaging system
- Analytics dashboard

### Option 3: Technical Improvements
- Real-time updates with WebSockets
- File upload system
- Advanced security features
- Performance optimization
- Mobile app development

### Option 4: Advanced Features
- AI-powered matching
- Escrow system
- Dispute resolution
- Multi-currency support
- API for third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@yourplatform.com or create an issue in the repository.

---

**Built with ❤️ for creators and businesses**
