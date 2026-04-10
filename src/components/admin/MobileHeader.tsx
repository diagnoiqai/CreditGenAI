import React from 'react';
import { Menu, Building2 } from 'lucide-react';

interface MobileHeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ setIsMobileMenuOpen }) => {
  return (
    <div className="lg:hidden bg-[#5A5A40] p-4 flex items-center justify-between text-white sticky top-0 z-40 shadow-md">
      <div className="flex items-center gap-2">
        <Building2 className="w-6 h-6" />
        <h1 className="text-lg font-serif font-bold">Admin</h1>
      </div>
      <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
};
