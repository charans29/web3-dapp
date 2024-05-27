import React from 'react';

function Appbar() {
  return (
    <div className="border-violet-400 border-b flex justify-between items-center h-9 px-5 bg-gray-800">
      <div className="font-thin">
        Worker's Taskify
      </div>
      <div className="font-thin">
        Connect Wallet
      </div>
    </div>
  );
}

export default Appbar;