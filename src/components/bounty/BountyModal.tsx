import React from 'react';

interface BountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bounty?: any;
}

const BountyModal: React.FC<BountyModalProps> = ({ isOpen, onClose, bounty }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bounty Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        {bounty ? (
          <div>
            <h3 className="font-semibold mb-2">{bounty.title}</h3>
            <p className="text-gray-600 mb-4">{bounty.description}</p>
            <div className="text-sm text-gray-500">
              Budget: ${bounty.budget}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No bounty selected</p>
        )}
      </div>
    </div>
  );
};

export default BountyModal;
