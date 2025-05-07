import { useState, useCallback } from 'react';
import MapComponent from './Map';
import BusRouteCard from './Result';
import { AutoComplete } from 'antd';
import axios from 'axios';

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const Sidebar = () => {

  const [activeTab, setActiveTab] = useState('bus');
  const [loaded, setLoaded] = useState(false);

  const [startOptions, setStartOptions] = useState([]);
  const [endOptions, setEndOptions] = useState([]);
  const [startCoordinate, setStartCoordinate] = useState(null);

  const [endCoordinate, setEndCoordinate] = useState(null);
  const [startList, setStartList] = useState(null);
  const [endList, setEndList] = useState(null);

  const [routeCriteria, setRouteCriteria] = useState(1); // '1:less-transfer' | '2:short-time'
  const [allowWalking, setAllowWalking] = useState(true);

  const [path, setPath] = useState(null);
  const [pathChosen, setPathChosen] = useState(0);

  const [busRoutes, setBusRoutes] = useState([]);


  const handleDirection = async () => {
      if (!startList || !endList) return;
    
      const start = startList.map(station => station.id).join(',');
      const end = endList.map(station => station.id).join(',');
    
      const mode = routeCriteria 
      const walking = allowWalking; // true hoặc false
    
      const url = `http://localhost:3001/Find/bus/route?start=${start}&end=${end}&mode=${mode}&walking=${walking}`;
    
      try {
        const response = await axios.get(url);
        const path = response.data;
        setPath(path);
        if(path) {
            const extractedData = path.map((path, index) => {
              const stations = path.passed.map((entry) => ({
                id: entry.station.stationId,
                name: entry.station.stationName,
                address: entry.station.stationAddress || "", // Default to empty string if null/undefined
                route: entry.route
              }));
          
              const routeDetails = path.routes && Array.isArray(path.routes)
                ? path.routes.map(route => ({
                    id: route.id,
                    name: route.name
                  }))
                : [];
          
             
              
              return {
                route: routeDetails, // Array of objects with id and name from routes property
                station: stations,   // Array of station objects
                routeChanges: path.routeChanges  // Number of route changes
              };
            });
            setBusRoutes(extractedData);
          }
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
      }
    };
  


  const fetchBusList = async (Lat, Long) => {
    const response = await axios.get(`http://localhost:3001/Find/bus?lat=${Lat}&lng=${Long}`);
    return response.data;
  };

  const fetchCoordinates = async (address) => {
    try {
      const response = await axios.get("http://localhost:3001/Map/get", {
        params: { address },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error.response?.data || error.message);
    }
  };

  const handleSearch = (setOptions) =>
    debounce(async (value) => {
      if (!value) return setOptions([]);
      try {
        const response = await axios.get(`http://localhost:3001/Map/autoComplete?input=${value}`);
        setOptions(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setOptions([]);
      }
    }, 600);

  const handleSearchStart = useCallback(handleSearch(setStartOptions), []);
  const handleSearchEnd = useCallback(handleSearch(setEndOptions), []);

  const handleSelect = async (type, value) => {
    const setCoordinate = type === 'start' ? setStartCoordinate : setEndCoordinate;
    const setList = type === 'start' ? setStartList : setEndList;
    const coor = await fetchCoordinates(value);
    const busList = await fetchBusList(coor[0].lat, coor[0].lng);
    setList(busList);
    
    setCoordinate(coor[0]);
  };
  

  return (
    <div className="flex h-screen">
      {/* Sidebar bên trái */}
      <div className='w-[400px] '>
        <div className="pl-4 pt-2 pb-2 border-b flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">Tìm Đường</h1>
          
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-col gap-2">
            <AutoComplete
              style={{ width: '100%' }}
              options={startOptions.map((option) => ({
                key: option.id,
                value: option.description,
                label: (
                  <div key={option.id}>
                    <div className="font-bold">{option.main_text}</div>
                    <div className="text-gray-500">{option.secondary_text}</div>
                  </div>
                ),
              }))}
              onSelect={(value) => handleSelect('start', value)}
              onSearch={handleSearchStart}
              placeholder="Nhập điểm bắt đầu..."
            />
            <AutoComplete
              style={{ width: '100%' }}
              options={endOptions.map((option) => ({
                key: option.id,
                value: option.description,
                label: (
                  <div key={option.id}>
                    <div className="font-bold">{option.main_text}</div>
                    <div className="text-gray-500">{option.secondary_text}</div>
                  </div>
                ),
              }))}
              onSelect={(value) => handleSelect('end', value)}
              onSearch={handleSearchEnd}
              placeholder="Nhập điểm đến..."
            />
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm"
          onClick={handleDirection}
          >
            Tìm đường
          </button>
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
            <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Tiêu chí tìm đường</p>
                <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                    <input
                        type="radio"
                        name="route-criteria"
                        value={1}
                        checked={routeCriteria === 1}
                        onChange={(e) => setRouteCriteria(Number(e.target.value))}
                        className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Ít chuyển tuyến</span>
                    </label>
                    <label className="inline-flex items-center">
                    <input
                        type="radio"
                        name="route-criteria"
                        value={2}
                        checked={routeCriteria === 2}
                        onChange={(e) => setRouteCriteria(Number(e.target.value))}
                        className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Thời gian ngắn</span>
                    </label>
                </div>
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Tùy chọn đi bộ</p>
                <label className="inline-flex items-center">
                <input
                    type="checkbox"
                    checked={allowWalking}
                    onChange={(e) => setAllowWalking(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">Cho phép đi bộ</span>
                </label>
            </div>
            </div>
                

        <div className="flex border-b border-gray-100">
          {['walk', 'bus', 'metro'].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-3 text-center text-sm ${
                activeTab === tab
                  ? 'border-b-2 text-indigo-600 font-medium'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'walk' && '🚶 Đi bộ'}
              {tab === 'bus' && '🚌 Xe buýt'}
              {tab === 'metro' && '🚇 Metro'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[300px]">
          {activeTab === 'bus' &&
          (
            <div className="p-4 text-sm text-gray-500">
                {busRoutes && busRoutes.map((route, index) => (
                <div key={index} className="w-full flex flex-col overflow-auto border-2 rounded-md border-gray-200 mb-2">
                    <button onClick={() => setPathChosen(index)}>
                    <BusRouteCard index={index} busRoute={route}/>
                    </button>
                </div>
           ))}
            </div>
          )
          }
          {activeTab === 'walk' && (
            <div className="p-4 text-sm text-gray-500">Tính năng đi bộ chưa được hỗ trợ.</div>
          )}
          {activeTab === 'metro' && (
            <div className="p-4 text-sm text-gray-500">Tính năng metro chưa được hỗ trợ.</div>
          )}
        </div>
      </div>

      {/* Map nằm bên phải */}

      <div className="flex-1 relative">
        <MapComponent onLoad={() => setLoaded(true)} from_coord={startCoordinate} to_coord={endCoordinate} fromBusList={startList} toBusList={endList} path={path} pathChosen={pathChosen}/>
      </div>
    </div>
  );
};

export default Sidebar;
