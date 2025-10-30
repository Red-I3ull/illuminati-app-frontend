import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';
import api from '../axiosConfig.js';

const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) {
    return '00:00:00';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const ProfilePage = () => {
  const [activeVotes, setActiveVotes] = useState([]);
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);
  const [timeRemainingMap, setTimeRemainingMap] = useState({});
  const [isSubmittingVote, setIsSubmittingVote] = useState({});

  const fetchActiveVotes = useCallback(async () => {
    setIsLoadingVotes(true);
    try {
      const response = await api.get('/votes/');
      setActiveVotes(response.data);
      const initialTimeMap = response.data.reduce((acc, vote) => {
        acc[vote.id] = vote.time_remaining_seconds || 0;
        return acc;
      }, {});
      setTimeRemainingMap(initialTimeMap);
    } catch (error) {
      console.error('Error fetching active votes:', error);
      toast.error('Failed to load active votes.');
      setActiveVotes([]);
    } finally {
      setIsLoadingVotes(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveVotes();
  }, [fetchActiveVotes]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemainingMap((prevMap) => {
        const newMap = {};
        let needsUpdate = false;
        for (const voteId in prevMap) {
          if (prevMap[voteId] > 0) {
            newMap[voteId] = prevMap[voteId] - 1;
            needsUpdate = true;
          } else {
            newMap[voteId] = 0;
          }
        }
        if (!needsUpdate) {
          clearInterval(interval);
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeVotes]);

  const getVoteStatusBadge = (userVote, timeRemaining) => {
    if (userVote) {
      const isAgree = userVote === 'AGREE';
      const bgClass = isAgree
        ? 'bg-green-700/50 text-green-300'
        : 'bg-red-700/50 text-red-300';
      return (
        <span className={`text-sm font-medium px-3 py-1 rounded ${bgClass}`}>
          Voted: {userVote}
        </span>
      );
    }

    if (timeRemaining <= 0) {
      return (
        <span className="text-sm font-medium text-gray-500 px-3 py-1 rounded bg-gray-600/50">
          Closed
        </span>
      );
    }

    return null;
  };

  const renderVotingButtons = (voteId, canVote, isVoteSubmitting) => (
    <>
      <button
        onClick={() => handleCastVote(voteId, 'AGREE')}
        disabled={!canVote}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          canVote
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-60'
        }`}
      >
        {isVoteSubmitting ? '...' : 'Agree'}
      </button>
      <button
        onClick={() => handleCastVote(voteId, 'DISAGREE')}
        disabled={!canVote}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          canVote
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-60'
        }`}
      >
        {isVoteSubmitting ? '...' : 'Disagree'}
      </button>
    </>
  );

  const handleCastVote = async (voteId, decision) => {
    setIsSubmittingVote((prev) => ({ ...prev, [voteId]: true }));
    try {
      const url = `/votes/${voteId}/cast-vote/`;
      const response = await api.post(url, { decision });

      setActiveVotes((prevVotes) =>
        prevVotes.map((vote) =>
          vote.id === voteId ? { ...vote, ...response.data } : vote,
        ),
      );
      toast.success(`Vote '${decision}' cast successfully!`);
    } catch (error) {
      console.error('Error casting vote:', error.response || error);
      const errorMessage =
        error.response?.data?.detail ||
        'Failed to cast vote. You might have already voted or the vote ended.';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingVote((prev) => ({ ...prev, [voteId]: false }));
    }
  };

  const renderActiveVotesContent = () => {
    if (activeVotes.length === 0) {
      return (
        <p className="text-center text-gray-400 py-4">
          No active votes available for you at the moment.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {activeVotes.map((vote) => {
          const timeRemaining = timeRemainingMap[vote.id] || 0;
          const userVote = vote.current_user_vote;
          const isVoteSubmitting = isSubmittingVote[vote.id] || false;
          const canVote = !userVote && timeRemaining > 0 && !isVoteSubmitting;
          const statusBadge = getVoteStatusBadge(userVote, timeRemaining);

          return (
            <div
              key={vote.id}
              className="bg-gray-700/50 p-4 rounded-md shadow flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0"
            >
              {/* Vote Info */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-indigo-300 truncate">
                  {vote.vote_type.name.replaceAll('_', ' ')}
                  {vote.target_username && ` on: ${vote.target_username}`}
                </p>
                <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-x-4">
                  <span>
                    Time Left:{' '}
                    <span className="font-medium text-gray-300">
                      {formatTime(timeRemaining)}
                    </span>
                  </span>
                  <span>
                    Votes Cast:{' '}
                    <span className="font-medium text-gray-300">
                      {vote.vote_counts.total_cast}
                    </span>
                  </span>
                  <span>
                    (Agree: {vote.vote_counts.agree} / Disagree:{' '}
                    {vote.vote_counts.disagree})
                  </span>
                </div>
              </div>

              {/* Voting Actions */}
              <div className="flex space-x-2 items-center flex-shrink-0">
                {statusBadge ||
                  renderVotingButtons(vote.id, canVote, isVoteSubmitting)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans relative text-gray-200">
      <Navigation />
      <div className="container mx-auto p-6 pt-20">
        {' '}
        {/* Adjusted padding-top */}
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">
          Your Profile & Votes
        </h2>
        {/* --- Active Votes Section --- */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-amber-400">
            Active Votings
          </h3>
          {isLoadingVotes ? (
            <p className="text-center text-gray-400 py-4">
              Loading active votes...
            </p>
          ) : (
            renderActiveVotesContent()
          )}
        </div>
        <div className="bg-gray-800 shadow-lg rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-amber-400">
            Rank Promotion
          </h3>
          <button
            disabled={true}
            className="w-full sm:w-auto font-bold py-2 px-6 rounded-md transition-colors bg-gray-600 text-gray-400 cursor-not-allowed opacity-70"
          >
            Promote Rank (not implemented)
          </button>
          <p className="text-sm text-gray-400 mt-2">
            You can attempt promotion once every 42 days. (Eligibility check to
            be added)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
