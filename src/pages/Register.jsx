import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  let navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email cannot be empty.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!username) {
      newErrors.username = 'Username cannot be empty.';
    }
    if (!password) {
      newErrors.password = 'Password cannot be empty.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      await axios.post('http://localhost:8000/register/', {
        username: username,
        email: email,
        password: password,
      });
    } catch (error) {
      console.error('Registration failed:', error.response || error.message);
      setErrors({
        form: 'Registration failed. The email or username might already be taken.',
      });
    }
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      <div className="hidden md:flex md:w-1/2">
        <img
          src="https://i1.sndcdn.com/artworks-qkPK3Fjd4CtvXQJ1-Yg9QGQ-t500x500.jpg"
          alt="Sign In"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-extrabold text-white text-center mb-8">
            Sign In
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                           bg-gray-800 text-white placeholder-gray-500
                           focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                           ${errors.email ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="illuminati@mail.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="login"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="login"
                name="login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                           bg-gray-800 text-white placeholder-gray-500
                           focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                           ${errors.username ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="illuminati"
              />
              {errors.username && (
                <p className="mt-2 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                           bg-gray-800 text-white placeholder-gray-500
                           focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                           ${errors.password ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm 
                           text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-600 
                           "
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
