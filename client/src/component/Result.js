import React, { useState } from 'react';

const BusRouteCard = ({busRoute,index}) => {

  
  return (
    <div className=" ">
      <div className="card bg-white p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className=" font-semibold text-gray-800">Lộ Trình #{index + 1}</h2>
          <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md font-medium">
            Chuyển tuyến: {busRoute.routeChanges}
          </span>
        </div>

        {/* Route summary */}
        <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center flex-1 gap-1">
            <div className="summary-station-dot w-2 h-2 rounded-full bg-indigo-600 gap-0.5"></div>
            <span className="summary-station-name text-sm font-medium">{busRoute.station[0].name}</span>
          </div>
          <div className="text-gray-400 mx-2">→</div>
          <div className="flex items-center flex-1 justify-end gap-0.5">
            <div className="summary-station-dot w-2 h-2 rounded-full bg-red-600"></div>
            <span className="summary-station-name text-sm font-medium">{busRoute.station[busRoute.station.length-1].name}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BusRouteCard;