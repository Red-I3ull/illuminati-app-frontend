import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router';
import Navigation from '../components/Navigation';

//for testing created an object with users data, need endpoint to get users
const initialUsers = [
  { id: 1, email: 'test@gmail.com', username: 'user1', role: 'Gold Masson' },
  { id: 2, email: 'test@gmail.co', username: 'user2', role: 'Masson' },
  { id: 3, email: 'test@gmail.co', username: 'user3', role: 'Silver Masson' },
];

const Dashboard = () => {
  const [users, setUsers] = useState(initialUsers);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [inviteEmail, setInviteEmail] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = (userId, newRole) => {
    setSelectedRoles((prevSelectedRoles) => ({
      ...prevSelectedRoles,
      [userId]: newRole,
    }));
  };

  const handleConfirmRoleChange = (userId) => {
    const newRole = selectedRoles[userId];
    if (newRole) {
      //for role endpoint
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
      );
      setSelectedRoles((prevSelectedRoles) => {
        const updatedSelectedRoles = { ...prevSelectedRoles };
        delete updatedSelectedRoles[userId];
        return updatedSelectedRoles;
      });
    }
  };

  const handleInviteSubmit = (e) => {
    //for invintation endpoint
    e.preventDefault();
    if (inviteEmail && /\S+@\S+\.\S+/.test(inviteEmail)) {
      console.log(`Invite sent to: ${inviteEmail}`);
      setInviteEmail('');
    } else {
      alert('Please enter a valid email address.');
    }
  };

  const handleCompromisedClick = () => {
    //for compromised endpoint
    e.preventDefault();
    console.log('compromised');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans relative">
      <Navigation />

      <div className="container mx-auto flex flex-col md:flex-row  text-gray-200 ">
        <div className="w-full md:w-2/3 p-6">
          <h2 className="text-2xl pt-12 font-bold mb-6 text-indigo-400">
            User Dashboard
          </h2>
          <div className="bg-gray-800 shadow-lg rounded-lg p-4 overflow-x-auto">
            <table className="w-full min-w-max text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 uppercase text-sm font-semibold">
                    User Email
                  </th>
                  <th className="p-4 uppercase text-sm font-semibold">
                    Username
                  </th>
                  <th className="p-4 uppercase text-sm font-semibold">Role</th>
                  <th className="p-4 uppercase text-sm font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isChanged =
                    selectedRoles[user.id] &&
                    selectedRoles[user.id] !== user.role;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50"
                    >
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{user.username}</td>
                      <td className="p-4">
                        <select
                          value={selectedRoles[user.id] || user.role}
                          onChange={(e) =>
                            handleRoleSelect(user.id, e.target.value)
                          }
                          className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Gold Masson">Gold Masson</option>
                          <option value="Silver Masson">Silver Masson</option>
                          <option value="Masson">Masson</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleConfirmRoleChange(user.id)}
                          disabled={!isChanged}
                          className={`font-bold py-1 px-3 rounded-md transition-colors ${
                            isChanged
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Confirm
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full min-h-screen md:w-1/3 p-6 bg-gray-800/50 border-l border-gray-700 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl pt-12 font-bold mb-6 text-indigo-400">
              Actions
            </h2>
            <div className="bg-gray-800 shadow-lg rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Invite New User</h3>
              <form onSubmit={handleInviteSubmit}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter user email to invite"
                  className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  Send Invite
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleCompromisedClick}
              className="w-full bg-red-800 hover:bg-red-900 text-white font-extrabold py-4 px-4 rounded-lg shadow-lg text-lg transition-transform transform hover:scale-105"
            >
              WE ARE COMPROMISED
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
