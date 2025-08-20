import React, { useState } from 'react';

const AddFriend = () => {
  const [platform, setPlatform] = useState('tg');
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePlatformChange = (value) => {
    setPlatform(value);
    setMessage(null);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    // Simulated request sending - here you would replace with real API calls
    await new Promise((r) => setTimeout(r, 1000));

    setSending(false);
    setMessage(`Friend request sent on ${platform === 'tg' ? 'Telegram' : 'Discord'} to: ${username}`);
    setUsername('');
  };

  return (
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[400px] 2xl:min-w-[500px] bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]">
      <span className="font-[200] text-[#ffffff72] h-[45.5px] flex items-center ml-2 text-lg">Add Friend</span>

      <form onSubmit={handleSubmit} className="border-t flex flex-col gap-5 p-4 pt-4">
        {/* Badge buttons for platform selection */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handlePlatformChange('tg')}
            className={`px-2 py-1 rounded-[6px] transition-colors border cursor-pointer select-none 
              ${platform === 'tg' 
                ? 'bg-[#3474ff] border-[#3474ff] text-white' 
                : 'bg-gray-700 border-gray-600 text-gray-400'}`
            }
            aria-pressed={platform === 'tg'}
          >
            Telegram
          </button>

          <button
            type="button"
            onClick={() => handlePlatformChange('discord')}
            className={`px-2 py-1 rounded-[6px] transition-colors border cursor-pointer select-none 
              ${platform === 'discord' 
                ? 'bg-[#5865F2] border-[#5865F2] text-white' 
                : 'bg-gray-700 border-gray-600 text-gray-400'}`
            }
            aria-pressed={platform === 'discord'}
          >
            Discord
          </button>
        </div>

        <input
          type="text"
          placeholder={`Enter ${platform === 'tg' ? 'Telegram' : 'Discord'} username`}
          value={username}
          onChange={handleUsernameChange}
          className="p-3 rounded-[6px] bg-[#222] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#3474ff]"
          required
        />

        <button
          type="submit"
          disabled={sending || username.trim() === ''}
          className={`p-3 rounded-[6px] font-semibold transition-colors ${
            sending || username.trim() === ''
              ? 'bg-gray-600 cursor-not-allowed'
              : platform === 'tg'
              ? 'bg-[#3474ff] hover:bg-indigo-700'
              : 'bg-[#5865F2] hover:bg-[#4752c4]'
          }`}
        >
          {sending ? 'Sending...' : 'Send Friend Request'}
        </button>

        {message && <p className="text-green-400 mt-2">{message}</p>}
      </form>
    </aside>
  );
};

export default AddFriend;
