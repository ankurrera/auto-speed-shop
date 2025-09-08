import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Info, Phone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home
    },
    {
      name: 'Shop',
      href: '/shop',
      icon: Store
    },
    {
      name: 'About',
      href: '/about',
      icon: Info
    },
    {
      name: 'Contact',
      href: '/contact',
      icon: Phone
    },
    {
      name: 'Shop By Brand',
      href: '/shop',
      icon: Sparkles
    }
  ];

  return (
    <div className="flex flex-row w-auto bg-gray-900 justify-center rounded-md items-center">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "bg-transparent border-none px-4 py-3 text-white flex relative gap-2 cursor-pointer rounded border-radius-1 mx-2",
              "transition-colors duration-200",
              "hover:bg-gray-800 focus:bg-gray-700 focus:outline-none",
              "before:content-[''] before:absolute before:top-1 before:-left-2 before:w-1 before:h-4/5 before:bg-blue-500 before:rounded-md before:opacity-0 before:transition-opacity",
              active && "bg-gray-700 before:opacity-100"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default Navbar;