import React, { useState } from 'react';
import LogoIcon from '../assets/other.png';
import { useNavigate, NavLink } from 'react-router';

const Navigation = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <nav className="absolute top-0 w-full h-16 bg-gray-800 shadow-md flex items-center">
      <div className="container px-5 mx-auto flex justify-between items-center">
        <div>
          <img
            src={LogoIcon}
            alt="Logo"
            className="inline-block size-10 rounded-full ring-2 ring-gray-900"
          />
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
            to="/dashboard"
          >
            Dashboard
          </NavLink>

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
