import React, { useState } from 'react';
import { useNavigate } from 'react-router';

const EntryPassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      return 'Password cannot be empty.';
    }
    if (passwordValue.length < 8) {
      return 'Inccorect';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        'http://localhost:8000/verify-entry-password/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('entryPasswordVerified', 'true');
        navigate('/login');
      } else {
        setError(data.error || 'Incorrect password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      <div className="hidden md:flex md:w-1/2">
        <img
          src="https://i1.sndcdn.com/artworks-qkPK3Fjd4CtvXQJ1-Yg9QGQ-t500x500.jpg"
          alt="Abstract artwork"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-xs">
          <form onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Enter password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                            bg-gray-800 text-white placeholder-gray-500
                            focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                            ${error ? 'border-red-500' : 'border-gray-600'}
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="••••••••"
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm
                         text-sm font-medium text-gray-200 bg-indigo-700 hover:bg-indigo-600
                         mt-4 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EntryPassword;
