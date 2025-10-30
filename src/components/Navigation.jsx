import React from 'react';
import LogoIcon from '../assets/other.png';
import { useNavigate, NavLink } from 'react-router-dom';
import { setAuthToken } from '../axiosConfig.js';
import {toast} from "react-toastify";

const Navigation = () => {
  const navigate = useNavigate();
  let userRole = null;
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      userRole = user.role;
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }

  const handleLogout = (e) => {
    e.preventDefault();
    setAuthToken(null);
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
    toast.info('You have been logged out.');
  };

  return (
    <nav className="absolute top-0 left-0 w-full h-16 bg-gray-800 shadow-md flex items-center z-50">
      {' '}
      <div className="container px-5 mx-auto flex justify-between items-center">
        <div>
          <NavLink to="/main">
            {' '}
            <img
              src={LogoIcon}
              alt="Logo"
              className="inline-block size-10 rounded-full ring-2 ring-gray-900 hover:opacity-80 transition-opacity"
            />
          </NavLink>
        </div>
        <div className="flex items-center space-x-4">
          <NavLink
            className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer"
            to="/main"
          >
            Map Page
          </NavLink>
          <NavLink
            className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer"
            to="/profile"
          >
            My Profile
          </NavLink>

          {(userRole === 'GOLDEN' || userRole === 'ARCHITECT') && (
            <NavLink
              className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer"
              to="/dashboard"
            >
              Dashboard
            </NavLink>
          )}

          <button
            className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
