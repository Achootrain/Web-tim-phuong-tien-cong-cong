import { useEffect, useState } from "react";
import "../App.css";
import CustomTabs from "./CustomTabs";
import axios from "axios";
import MapComponent from "./Map";
import AutoCompleteSearch from "./AutoCompleteSearch";
import { Tooltip } from "antd";

const Sidebar = ({ open }) => {
  const [mapReady, setMapReady] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [getUserLocation, setUserLocation] = useState(false);
  
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  const [busListFrom,setBusListFrom]=useState(null);
  const [busListTo,setBusListTo]=useState(null);
  const [path, setPath] = useState(null);
  const handleDirection = async () => {
    if (!busListFrom || !busListTo) return;
    
    const start = busListFrom.map(station => station.id).join(',');
    const end = busListTo.map(station => station.id).join(',');
    
    const response = await axios.get(`http://localhost:3001/Find/bus/route?start=${start}&end=${end}`);
    const data = response.data;
    setPath(data);
  };
  const [pathChosen,setPathChosen]=useState(0);
  
  return (
    <div className="relative">
      <MapComponent locate_user={getUserLocation} onLoad={() => setMapReady(true)} 
      from_coord={fromCoords} to_coord={toCoords} fromBusList={busListFrom} toBusList={busListTo} path={path} pathChosen={pathChosen}/>
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
          <div className="flex flex-col gap-2 p-4">
            <div>
              <AutoCompleteSearch placeholder="Chọn điểm bắt đầu" setCoordinate={setFromCoords} setList={setBusListFrom}/>
              <Tooltip title="Chọn vị trí của bạn" placement="top">
                <button onClick={() => setUserLocation(true)}><img src="https://i.imgur.com/s3OX5uw.png" className="w-6 h-6 relative top-1"></img></button>  
              </Tooltip>
            </div>
            <div>
              <AutoCompleteSearch placeholder="Chọn đích đến" setCoordinate={setToCoords} setList={setBusListTo}/>
              <Tooltip title="Chỉ đường" placement="top">
                <button onClick={handleDirection}><img src="https://i.imgur.com/BXJ2wwe_d.png?maxwidth=520&shape=thumb&fidelity=high" className="w-6 h-6 relative top-1"></img></button>  
              </Tooltip>
            </div>
          </div>
            <CustomTabs pathdata={path} pathChosen={setPathChosen}/>
          
        </div>
      )}
    </div>
  );
};

export default Sidebar;
