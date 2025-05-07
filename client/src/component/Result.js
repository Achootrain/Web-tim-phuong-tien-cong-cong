import React, { useState } from 'react';

const BusRouteCard = ({busRoute,index}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="max-w-md w-full ">
      <div className="card bg-white p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Lộ Trình #{index}</h2>
          <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md font-medium">
            Chuyển tuyến: {busRoute.routeChanges}
          </span>
        </div>

        {/* Route summary */}
        <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center flex-1 gap-1">
            <div className="summary-station-dot w-2 h-2 rounded-full bg-indigo-600"></div>
            <span className="summary-station-name text-sm font-medium">{busRoute.station[0].name}</span>
          </div>
          <div className="text-gray-400 mx-2">→</div>
          <div className="flex items-center flex-1 justify-end">
            <div className="summary-station-dot w-2 h-2 rounded-full bg-emerald-600"></div>
            <span className="summary-station-name text-sm font-medium">{busRoute.station[busRoute.station.length-1].name}</span>
          </div>
        </div>

        {/* Route details toggle */}
        <div className={`route-container ${isExpanded ? 'expanded' : ''}`}>
          <div
            className="flex justify-between items-center cursor-pointer mb-3"
            onClick={toggleDetails}
          >
            <h3 className="text-sm font-medium text-gray-800">Chi tiết lộ trình</h3>
            <svg
              className="w-5 h-5 text-gray-500 expand-button"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>

          {/* Route details */}
          <div className={`route-details ${isExpanded ? '' : 'hidden'}`}>
            <div className="relative pb-4">
            {busRoute.station.map((station, index) => (
              <div className="relative mb-5 border-2 border-indigo-600 rounded-lg p-3 ">
               
                <div className="mb-1">
                  <p className="font-medium text-sm text-left text-black ">Trạm {station.id} : {station.name}</p>
                  <div className="flex items-center mt-1">
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded mr-2">
                     {station.route===-1?"Đi bộ":station.route}
                    </span>
                    <span className="text-xs text-gray-500 text-left">{station.address}</span>
                  </div>
                </div>
              </div>))} 
            </div>
          </div>
        </div>

        {/* Journey info */}
        <div className="bg-gray-50 p-3 rounded-lg mt-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-gray-500">Thời gian</p>
              <p className="text-sm font-medium">1h 5m</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Khoảng cách</p>
              <p className="text-sm font-medium">.... km</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Giá vé</p>
              <p className="text-sm font-medium">15.000đ</p>
            </div>
          </div>
        </div>

 
      </div>

    </div>
  );
};

export default BusRouteCard;