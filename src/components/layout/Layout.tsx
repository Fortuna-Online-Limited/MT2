import React from 'react';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '../ui/ChatWidget';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
