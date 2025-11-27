import React from 'react';

const TournamentBracket = ({ tournaments = [] }) => {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No tournament matches scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Tournament Matches</h3>
      <div className="space-y-4">
        {tournaments.map((match) => (
          <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-right">
                <p className="font-medium">{match.player1}</p>
              </div>
              <div className="text-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                  {match.score}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium">{match.player2}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentBracket;
