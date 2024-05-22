import React from 'react';

function Appbar() {
  return (
    <div className="border-blue-700 border-b flex justify-between items-center h-9 px-5 bg-slate-900">
      <div className="font-thin">
        Taskify
      </div>
      <div className="font-thin">
        Connect Wallet
      </div>
    </div>
  );
}

export default Appbar;