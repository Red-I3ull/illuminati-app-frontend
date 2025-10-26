import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import EntryPassword from './pages/EntryPassword.jsx';
import SignIn from './pages/Register.jsx';
import LogIn from './pages/LogIn.jsx';
import MapPage from './pages/Main.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { setAuthToken } from './axiosConfig.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const token = localStorage.getItem('authToken');
if (token) {
  setAuthToken(token);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryPassword />} />
        <Route path="/register" element={<SignIn />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/main" element={<MapPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

  </StrictMode>,

);
