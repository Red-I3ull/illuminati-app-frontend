import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';
import api from '../axiosConfig.js';
import ScalesImage from '../assets/other.png';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [backupFile, setBackupFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        setCurrentUser(userData);
        const token = localStorage.getItem('authToken');
        if (token && !api.defaults.headers.common['Authorization']) {
          api.defaults.headers.common['Authorization'] = `Token ${token}`;
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        toast.error('Could not load user data. Please log in again.');
      }
    }
  }, []);

  const is_inquisitor = currentUser?.is_inquisitor || false;

  useEffect(() => {
    if (is_inquisitor) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error('Auth token not found');
          if (!api.defaults.headers.common['Authorization']) {
            api.defaults.headers.common['Authorization'] = `Token ${token}`;
          }
          const response = await api.get('/users/');
          setUsers(response.data);
        } catch (error) {
          console.error('Error fetching users:', error);
          if (
            error.message === 'Auth token not found' ||
            error.response?.status === 401
          ) {
            toast.error('Authentication error. Please log in again.');
          } else {
            toast.error('Failed to load user list.');
          }
          setUsers([]);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [is_inquisitor]);

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  const handleNominate = async () => {
    if (!selectedUserId) {
      toast.warn('Please select a user to nominate.');
      return;
    }
    setIsSubmittingNomination(true);
    try {
      const response = await api.post('/votes/nominate-ban/', {
        target_user_id: selectedUserId,
      });
      toast.success(
        `User ${response.data.target_username} nominated. Voting started (ID: ${response.data.id})`,
      );
      setSelectedUserId(null);
    } catch (error) {
      console.error('Error nominating user:', error.response || error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Failed to start ban voting. Check permissions or nomination status.';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingNomination(false);
    }
  };

  const handleInviteSubmit = (e) => {
    //for invintation endpoint
    e.preventDefault();
    if (inviteEmail && /\S+@\S+\.\S+/.test(inviteEmail)) {
      console.log(`Invite sent to: ${inviteEmail}`);
      setInviteEmail('');
    } else {
      toast.warn('Please enter a valid email address.');
    }
  };

  const handleConfirmCompromised = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);

    try {
      await api.post('compromised/');
      toast.warn('Compromised protocol initiated!');
      navigate('/');
    } catch (error) {
      const errorMsg = error.message;
      toast.error(`Compromised failed ${errorMsg}`);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  //Download backup
  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get('backup/', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'marker_backup.json');
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMsg = error.message;
      toast.error(`Download failed ${errorMsg}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e) => {
    setBackupFile(e.target.files[0] || null);
  };

  //Upload backup
  const handleUploadBackup = async (e) => {
    e.preventDefault();
    if (!backupFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('backup_file', backupFile);

    try {
      await api.post('backup/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Restore successful!');
      setBackupFile(null);
      e.target.reset();
    } catch (error) {
      const errorMsg = error.message;
      toast.error(`Upload failed ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans relative text-gray-200">
      <Navigation />
      <div className="container mx-auto flex flex-col md:flex-row pt-16">
        <div className="w-full md:w-2/3 p-6">
          <h2 className="text-2xl font-bold mb-6 text-indigo-400">
            {is_inquisitor ? 'Inquisitor Dashboard' : 'User Dashboard'}
          </h2>

          {is_inquisitor && (
            <div className="bg-gray-800 shadow-lg rounded-lg p-4 overflow-x-auto">
              <h3 className="text-xl font-semibold mb-4 text-amber-400">
                Nominate User for Ban
              </h3>
              {(() => {
                if (isLoadingUsers) {
                  return (
                    <p className="text-center text-gray-400 py-4">
                      Loading users...
                    </p>
                  );
                }

                if (users.length > 0) {
                  return (
                    <>
                      <table className="w-full min-w-[600px] text-left table-auto">
                        <thead>
                          <tr className="border-b border-gray-700 bg-gray-700/50">
                            <th className="p-3 uppercase text-xs font-semibold w-16 text-center">
                              Select
                            </th>
                            <th className="p-3 uppercase text-xs font-semibold">
                              User Email
                            </th>
                            <th className="p-3 uppercase text-xs font-semibold">
                              Username
                            </th>
                            <th className="p-3 uppercase text-xs font-semibold">
                              Role
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr
                              key={user.id}
                              className={`border-b border-gray-700 hover:bg-gray-700/30 transition-colors ${
                                selectedUserId === user.id
                                  ? 'bg-indigo-900/40'
                                  : ''
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="radio"
                                  name="selectedUserRadio"
                                  value={user.id}
                                  checked={selectedUserId === user.id}
                                  onChange={() => handleUserSelect(user.id)}
                                  className="form-radio h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-500 focus:ring-offset-gray-800 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-sm">{user.email}</td>
                              <td className="p-3 text-sm">
                                {user.username || '-'}
                              </td>
                              <td className="p-3 text-sm">{user.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button
                        onClick={handleNominate}
                        disabled={!selectedUserId || isSubmittingNomination}
                        className={`mt-6 w-full font-bold py-2.5 px-4 rounded-md transition-all duration-300 ease-in-out text-sm ${
                          selectedUserId && !isSubmittingNomination
                            ? 'bg-red-700 hover:bg-red-800 text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-70'
                        }`}
                      >
                        {isSubmittingNomination
                          ? 'Nominating...'
                          : 'Start Ban Voting'}
                      </button>
                    </>
                  );
                }

                return (
                  <p className="text-center text-gray-400 py-4">
                    No users available to nominate.
                  </p>
                );
              })()}
            </div>
          )}

          {!is_inquisitor && (
            <div className="bg-gray-800 shadow-lg rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
              <img
                src={ScalesImage}
                alt="Masonic Scales" // Update alt text
                className="w-40 h-40 opacity-40 mb-6"
              />
              <p className="text-gray-400 text-center max-w-md">
                This section is reserved for the Inquisitor. Regular members
                cannot view the user list or initiate ban votes here. Check the
                Profile page for active votes.
              </p>
            </div>
          )}
        </div>

        <div className="w-full h-[calc(100vh-64px)] md:w-1/3 p-6 bg-gray-800/50 border-l border-gray-700 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-indigo-400">
              Other Actions
            </h2>

            <div className="mt-8, mb-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className=" w-full !bg-red-800 hover:bg-red-900 text-white font-extrabold py-3 px-4 rounded-lg shadow-lg text-base transition-transform transform hover:scale-[1.02]"
              >
                WE ARE COMPROMISED
              </button>
            </div>

            <ConfirmationModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onConfirm={handleConfirmCompromised}
              title="Are you absolutely sure?"
              message="This will trigger the compromised protocol. This action is critical and cannot be undone."
            />

            <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Invite New User</h3>
              <form onSubmit={handleInviteSubmit}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter user email to invite"
                  className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                >
                  Send Invite
                </button>
              </form>
            </div>

            {currentUser?.role === 'ARCHITECT' && (
              <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Architect Actions
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  Download the backup of marker data
                </p>
                <button
                  onClick={handleDownloadBackup}
                  disabled={isDownloading}
                  className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                  {isDownloading ? 'Downloading...' : 'Download Backup'}
                </button>

                <p className="text-sm text-gray-400 mb-2, mt-4">
                  Restore data from a backup file
                </p>

                <form onSubmit={handleUploadBackup}>
                  <div className="mt-2, mb-4">
                    <label
                      htmlFor="backup_file"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Backup File (.json)
                    </label>
                    <input
                      type="file"
                      name="backup_file"
                      id="backup_file"
                      accept=".json,application/json"
                      //required
                      onChange={handleFileChange}
                      className="mt-2, block w-full text-sm text-gray-300 bg-gray-700 rounded-lg border border-gray-600 cursor-pointer
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-l-lg file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-green-600 file:text-white
                                  hover:file:bg-green-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-green-800 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Restore'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;