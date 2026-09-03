import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Menu, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChildSelector from '../parent/ChildSelector';

const Navbar = ({ onMenuClick, onSidebarOpen, onSidebarClose, searchQuery, setSearchQuery }: { onMenuClick?: () => void; onSidebarOpen?: () => void; onSidebarClose?: () => void; searchQuery: string; setSearchQuery: (query: string) => void; }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div onMouseEnter={onSidebarOpen} onMouseLeave={onSidebarClose}>
        <button 
          onClick={onMenuClick}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        </div>
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for something..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user?.role === 'parent' && <ChildSelector />}
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <Link 
          to={
            user?.role === 'admin' 
              ? '/admin/account' 
              : user?.role === 'student' || user?.role === 'parent' 
                ? '/account' 
                : '/teacher/profile'
          } 
          className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
          ) : (
            <UserCircle className="w-9 h-9 text-gray-400" />
          )}
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
