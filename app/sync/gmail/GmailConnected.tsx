'use client';

type Props = {
  onDisconnect: () => void;
};

export const GmailConnected = ({ onDisconnect }: Props) => (
  <div className="flex items-center gap-3">
    <span className="w-2 h-2 bg-green-500 rounded-full" />
    <span className="text-green-400">Connected</span>
    <button
      onClick={onDisconnect}
      className="text-gray-600 hover:text-gray-400 text-xs transition"
    >
      Disconnect
    </button>
  </div>
);
