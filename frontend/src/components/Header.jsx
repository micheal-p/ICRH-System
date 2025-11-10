import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../assets/icons';

const Header = ({ title, showPrint = false, onPrint }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4">
            <img
              src={`${process.env.PUBLIC_URL}/iou_logo.png`}
              alt="Igbinedion University"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
              <p className="text-xs md:text-sm text-blue-100">
                {isAdmin() ? '👑 Admin Panel' : `${user?.department || ''} - ${user?.level || ''} Level`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Print Button */}
            {showPrint && onPrint && (
              <button
                onClick={onPrint}
                className="hidden md:flex items-center space-x-2 bg-gold text-gray-900 px-4 py-2 rounded-lg hover:bg-gold-dark transition-all"
              >
                <Icons.Print size={20} color="#000" />
                <span className="font-medium">Print Form</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-primary-light transition-all"
            >
              {showMenu ? <Icons.Close size={24} /> : <Icons.Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => navigate(isAdmin() ? '/admin' : '/dashboard')}
                className="p-2 rounded-lg hover:bg-primary-light transition-all"
                title="Dashboard"
              >
                <Icons.Home size={24} />
              </button>

              {!isAdmin() && (
                <button
                  onClick={() => navigate('/profile')}
                  className="p-2 rounded-lg hover:bg-primary-light transition-all"
                  title="Profile"
                >
                  <Icons.User size={24} />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
              >
                <Icons.Logout size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden mt-4 pt-4 border-t border-blue-400 space-y-2 animate-slide-up">
            {showPrint && onPrint && (
              <button
                onClick={() => {
                  onPrint();
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gold text-gray-900 rounded-lg hover:bg-gold-dark transition-all"
              >
                <Icons.Print size={20} color="#000" />
                <span className="font-medium">Print Form</span>
              </button>
            )}

            <button
              onClick={() => {
                navigate(isAdmin() ? '/admin' : '/dashboard');
                setShowMenu(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-primary-light rounded-lg hover:bg-primary transition-all"
            >
              <Icons.Home size={20} />
              <span>Dashboard</span>
            </button>

            {!isAdmin() && (
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-primary-light rounded-lg hover:bg-primary transition-all"
              >
                <Icons.User size={20} />
                <span>Profile</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition-all"
            >
              <Icons.Logout size={20} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;