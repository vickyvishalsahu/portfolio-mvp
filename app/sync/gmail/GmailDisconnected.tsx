'use client';

type Props = {
  selectedNames: string[];
};

export const GmailDisconnected = ({ selectedNames }: Props) => {
  const renderBrokerNotice = () => {
    if (selectedNames.length > 0) {
      return <> Only emails from <span className="text-white">{selectedNames.join(', ')}</span> will be stored locally.</>;
    }
    return <> Select at least one broker above before connecting.</>;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-red-400">Not connected</span>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4 text-sm text-gray-400">
        <p className="mb-1 font-medium text-gray-300">Before you connect</p>
        <p>
          We request <span className="text-white">read-only</span> Gmail access to find broker confirmation emails.
          {renderBrokerNotice()}{' '}
          No other emails are read, stored, or transmitted.
        </p>
      </div>
      <a
        href="/api/gmail/auth"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        Connect Gmail
      </a>
    </div>
  );
};
