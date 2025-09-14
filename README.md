# AutoParts Pro

A modern e-commerce platform for automotive parts and accessories, built with React, TypeScript, and Supabase.

## Features

### 🛒 E-Commerce Core
- **Product Catalog**: Browse automotive parts by category, brand, and vehicle compatibility
- **Shopping Cart**: Add/remove items, quantity management, and persistent cart state
- **Wishlist**: Save favorite products for later purchase
- **Checkout Process**: Secure checkout with custom order management
- **Order Tracking**: Track order status and shipping information
- **User Accounts**: Registration, login, profile management

### 👨‍💼 Admin Features
- **User Management**: Admin panel for user administration
- **Order Management**: Track and manage customer orders
- **Analytics Dashboard**: Sales and performance metrics
- **Seller Dashboard**: Vendor management interface

### 🎨 Modern UI/UX
- **Minimalist Homepage**: Clean, high-contrast design with modular components
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Accent Color System**: Strategic use of #b22222 for CTAs and highlights
- **Dark/Light Mode**: Theme switching with system preference detection
- **Component Library**: Consistent UI with Shadcn/ui components
- **Accessibility**: ARIA labels and keyboard navigation support

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **Payments**: Custom order & payment flow with admin invoice management
- **State Management**: React Query + Context API
- **Maps**: Leaflet/React-Leaflet
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ankurrera/auto-speed-shop.git
   cd auto-speed-shop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:8080` to view the application.

## Project Structure

```
src/
├── components/                 # Reusable UI components
│   ├── ui/                    # Shadcn/ui components
│   ├── dashboard/             # Dashboard-specific components
│   ├── homepage/              # Minimalist homepage components
│   │   ├── Hero.tsx           # Main hero section
│   │   ├── VehicleSearch.tsx  # Vehicle finder module
│   │   ├── Features.tsx       # Features section with icons
│   │   ├── Categories.tsx     # Category grid
│   │   ├── ProductGrid.tsx    # Product display grid
│   │   ├── MinimalistHeader.tsx # Clean header with search
│   │   └── MinimalistFooter.tsx # Organized footer
│   ├── Header.tsx             # Main navigation header
│   ├── Footer.tsx             # Site footer
│   └── ProductCard.tsx        # Product display component
├── pages/                     # Route components
│   ├── Home.tsx              # Minimalist landing page
│   ├── Shop.tsx              # Product catalog
│   ├── Dashboard.tsx         # Vehicle dashboard
│   ├── Cart.tsx              # Shopping cart
│   ├── Checkout.tsx          # Payment process
│   └── Account.tsx           # User account management
├── contexts/                  # React contexts
│   ├── CartContext.tsx       # Shopping cart state
│   └── WishlistContext.tsx   # Wishlist state
├── hooks/                     # Custom React hooks
├── integrations/              # External service integrations
│   └── supabase/             # Supabase configuration
├── data/                      # Static data and constants
└── styles/                    # Custom CSS files
```

## Design System

### Minimalist Homepage
The homepage features a clean, minimalist design inspired by modern automotive industry aesthetics:

- **Color Palette**: High-contrast black (#171717), white, and gray scheme
- **Accent Color**: Strategic use of #b22222 for CTAs, icons, and interactive elements
- **Typography**: Modern sans-serif with strong weight contrast
- **Layout**: Modular grid system with ample white space
- **Components**: Reusable, accessible components with consistent styling

### Key Design Principles
- **Minimalism**: Clean lines and uncluttered layouts
- **Accessibility**: Keyboard navigation and screen reader support
- **Responsiveness**: Mobile-first design with proper breakpoints
- **Performance**: Optimized images and lazy loading

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development environment
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Database Setup

This project uses Supabase for the backend. You'll need to:

1. Create a new Supabase project
2. Set up the database schema (see `supabase/migrations/`)
3. Configure authentication providers
4. Set up row-level security policies

### Custom Order & Payment Flow

This project uses a custom order and payment flow:

1. Create a new Supabase project
2. Set up the database schema (see `supabase/migrations/`)
3. Configure authentication providers
4. Set up row-level security policies

The custom flow allows for admin review and invoice management before payment completion.

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PAYPAL_CLIENT_ID`

### Deployment Platforms

This project can be deployed to:

- **Vercel** (recommended for React apps)
- **Netlify**
- **Railway**
- **Heroku**

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
