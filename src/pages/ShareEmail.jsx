import React, { useState } from 'react';
import API from '../services/api';

export default function EmailShare({ fileUuid, onSendSuccess }) {
  const [emailTo, setEmailTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailTo || !fileUuid) return;

    setLoading(true);
    try {
      const response = await API.post('/files/send', {
        emailTo,
        uuid: fileUuid,
      });

      if (response.data.success) {
        alert("📩 Link shared via email successfully!");
        setEmailTo(''); // Reset input
        if (onSendSuccess) onSendSuccess();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-4 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Send Link via Email
        </label>
      </div>

      <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row gap-2">
        <input 
          type="email" 
          required
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
          placeholder="recipient@example.com"
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-colors focus:border-indigo-500 dark:focus:border-indigo-500 text-gray-700 dark:text-gray-300 disabled:opacity-60"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm focus:outline-none cursor-pointer text-center whitespace-nowrap disabled:bg-indigo-400"
        >
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
}