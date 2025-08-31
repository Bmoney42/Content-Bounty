import React from 'react';

interface BountyListProps {
  bounties?: any[];
}

const BountyList: React.FC<BountyListProps> = ({ bounties = [] }) => {
  return (
    <div className="space-y-4">
      {bounties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No bounties available</p>
        </div>
      ) : (
        bounties.map((bounty) => (
          <div key={bounty.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{bounty.title}</h3>
            <p className="text-gray-600">{bounty.description}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default BountyList;
