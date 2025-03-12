import { useState } from "react";
import "../App.css";
import { Tooltip } from "antd";
import CustomTabs from "./CustomTabs";
import axios from "axios";
import MapComponent from "./Map";

const Sidebar = ({ open }) => {
  const [mapReady, setMapReady] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [getUserLocation, setUserLocation] = useState(false);
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  const fetchCoordinates = async (address) => {
    try {
      const response = await axios.get("http://localhost:3001/Map/get", {
        params: { address },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message
      );
    }
  };
  const handleFromSearch = async () => {
    const coords = await fetchCoordinates(from);
    setFromCoords(coords[0]);
  };
  const handleToSearch = async () => {
    const coords = await fetchCoordinates(to);
    setToCoords(coords[0]);
  };
  return (
    <div className="relative">
      <MapComponent locate_user={getUserLocation} onLoad={() => setMapReady(true)} from_coord={fromCoords} to_coord={toCoords} />
      {/* Make sure the map fully render */}
      {mapReady && (
        <div
          className={`fixed rounded-lg
            md:top-15 md:w-1/3 md:h-full md:bottom-auto   
            bottom-0 left-0 w-full h-1/3
            bg-gradient-to-bl from-green-600 via-green-400 to-emerald-300 
            overflow-y-auto
            text-white shadow-md p-4 
            transition-transform duration-300 ease-in-out 
            z-50
            ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:-translate-x-full"}
            md:translate-y-0`}
        >
          <div className="flex flex-col gap-5 relative md:top-5">
            <div className="flex flex-col gap-y-4">
              {/* From Field */}
              <div className="flex flex-row gap-2 items-center">
                <div className="w-10 text-left font-bold">From:</div>
                {/* Input Container with consistent width */}
                <div className="flex items-center flex-grow bg-slate-50 rounded-sm p-1">
                  <input
                    className="bg-transparent w-full text-black focus:outline-none pl-1"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                  <button
                    className="text-gray-500"
                    onClick={() => handleFromSearch()}
                  >
                    <img
                      src="https://i.imgur.com/MdNd6W3.png"
                      className="w-5 h-5"
                      alt="Search"
                    />
                  </button>
                </div>
                <Tooltip title="Your location" placement="top">
                  <button onClick={() => setUserLocation(true)}>
                    <img
                      className="w-7 h-7"
                      src="https://i.imgur.com/s3OX5uw.png"
                      alt="Your location"
                    />
                  </button>
                </Tooltip>
              </div>
              {/* To Field */}
              <div className="flex flex-row gap-2 items-center">
                <div className="w-10 text-left font-bold">To:</div>
                {/* Input Container with consistent width */}
                <div className="flex items-center flex-grow bg-slate-50 rounded-sm p-1">
                  <input
                    className="bg-transparent w-full text-black focus:outline-none pl-1"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                  <button
                    className="text-gray-500"
                    onClick={()=>handleToSearch()}
                  >
                    <img
                      src="https://i.imgur.com/MdNd6W3.png"
                      className="w-5 h-5"
                      alt="Search"
                    />
                  </button>
                </div>
                <Tooltip title="Directions" placement="top">
                  <button>
                    <img
                      className="w-7 h-7"
                      src="https://i.imgur.com/BXJ2wwe.png"
                      alt="Direction"
                    />
                  </button>
                </Tooltip>
              </div>
            </div>
            <CustomTabs />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
