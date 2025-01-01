import React from 'react';

const LoginPrompt: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900 rounded-lg shadow-xl text-gray-100 space-y-4 border-2 border-orange-600">
      <div className="flex items-center space-x-2">
        <div className="bg-gray-800 p-2 rounded-lg">
          <svg
            className="w-6 h-6 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Welcome to ColabAI</h2>
      </div>

      <div className="text-center space-y-3">
        <p className="text-gray-300">
          Please sign in to access all features
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            To sign in:
          </p>
          <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1 text-left">
            <li>Look for the extension icon <span className="inline-flex items-center px-2 py-1 bg-gray-800 rounded">
              <svg
                className="w-4 h-4 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </span> in your browser toolbar</li>
            <li>Click the icon to open the extension</li>
            <li>Sign in with your Google account</li>
          </ol>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <p className="text-xs text-gray-500">
          Sign in securely with your Google account
        </p>
      </div>
    </div>
  );
};

export default LoginPrompt;
