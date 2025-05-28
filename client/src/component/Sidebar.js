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
  const [expandedRouteIndex, setExpandedRouteIndex] = useState(null);
  const [pathChosen, setPathChosen] = useState(0);
  const [startOptions, setStartOptions] = useState([]);
  const [endOptions, setEndOptions] = useState([]);
  const [startCoordinate, setStartCoordinate] = useState(null);
  const [endCoordinate, setEndCoordinate] = useState(null);
  const [startPlace,setStartPlace]=useState("")
  const [endPlace,setEndPlace]=useState("")
  const [routeCriteria, setRouteCriteria] = useState(1); // 1: less-transfer, 2: short-time
  const [allowWalking, setAllowWalking] = useState(true);
  const [useMetro, setUseMetro] = useState(false);
  const [path, setPath] = useState(null);
  const [busRoutes, setBusRoutes] = useState([]);

  const handleDirection = async () => {
    if (!startCoordinate || !endCoordinate) {
      alert("Vui lòng nhập điểm bắt đầu và điểm đến");
      return;
    }
    const startStr = encodeURIComponent(JSON.stringify(startCoordinate));
    const endStr = encodeURIComponent(JSON.stringify(endCoordinate));
    const mode = routeCriteria;
    const walking = allowWalking;
    const metro = useMetro;
    const url = `http://localhost:3001/Find/bus/route?start=${startStr}&end=${endStr}&mode=${mode}&walking=${walking}&metro=${metro}`;

    try {
      const response = await axios.get(url);
      const pathData = response.data;
      setPath(pathData);
  
      if (pathData && pathData.length > 0) {
        const extractedData = pathData.map((path, index) => {
          const stations = path.passed.map((entry) => ({
            id: entry.station.stationId ?? -1,
            name: entry.station.stationName ?? "Start",
            address: entry.station.stationAddress ?? "",
            route: entry.route
          }));
          const routeDetails = path.routes && Array.isArray(path.routes)
            ? path.routes.map(route => ({
                id: route.routeId ?? -1,
                name: route.name ?? "Unknown",
              }))
            : [];
          return {
            route: routeDetails,
            station: stations,
            routeChanges: path.routeChanges,
            time: path.time,
            distance: path.distance,
          };
        });
        setBusRoutes(extractedData);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  };

  const fetchCoordinates = async (address) => {
    try {
      const response = await axios.get("http://localhost:3001/Map/get", {
        params: { address },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error.response?.data || error.message);
      return null;
    }
  };

  const handleSearch = (setOptions) =>
    debounce(async (value) => {
      if (!value) {
        setOptions([]);
        return;
      }
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
    const setPlace=type=== 'start' ? setStartPlace:setEndPlace;

    const coor = await fetchCoordinates(value);
    if (coor && coor[0]) {
      setCoordinate(coor[0]);
      setPlace(value);
    }
  };

  const handleRouteClick = (index) => {
    setPathChosen(index);
    setExpandedRouteIndex(index === expandedRouteIndex ? null : index);
    
  };
  const handleBackToRoutes = () => {
    setExpandedRouteIndex(null);
  };

  return (
    <div className="flex h-screen">
      <div className="w-[400px] flex flex-col bg-white shadow-lg">
        {expandedRouteIndex === null ? (
          <>
            <div className="pl-4 pt-2 pb-2 border-b flex justify-between items-center">
              <h1 className="text-lg font-semibold text-gray-800">Tìm Đường</h1>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <AutoComplete
                  className="w-full"

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
                  className="w-full"
                 
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
              <button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm transition-colors"
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
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Tùy chọn</p>
                <div>
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
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={useMetro}
                      onChange={(e) => setUseMetro(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sử dụng tàu metro</span>
                  </label>
                </div>
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
            <div className="flex-1 overflow-hidden">
              {activeTab === 'bus' && (
                <div className="p-4 text-sm text-gray-500">
                  <p className="mb-2">Danh sách lộ trình xe buýt (Tìm thấy {`${busRoutes.length}`} lộ trình)</p>
                  <div className="max-h-[220px] overflow-y-auto pr-1">
                    {busRoutes.map((route, index) => (
                      <div key={index} className="w-full flex flex-col border-2 rounded-md border-gray-200 mb-2">
                        <button
                          onClick={() => handleRouteClick(index)}
                          className="w-full text-left"
                        >
                          <BusRouteCard index={index} busRoute={route} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'walk' && (
                <div className="p-4 text-sm text-gray-500">Tính năng đi bộ chưa được hỗ trợ.</div>
              )}
              {activeTab === 'metro' && (
                <div className="p-4 text-sm text-gray-500">Tính năng metro chưa được hỗ trợ.</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="pl-4 pt-2 pb-2 border-b flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={handleBackToRoutes}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-gray-800">Chi tiết lộ trình</h1>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              {busRoutes[expandedRouteIndex] && (
                <>
                  <div className="bg-indigo-50 rounded-lg p-3 mb-4 border border-indigo-100">
                    <div className="bg-gray-50 p-3 rounded-lg mt-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Thời gian </p>
                          <p className="text-sm font-medium">
                            {busRoutes[expandedRouteIndex].time != null
                              ? `${Math.floor(busRoutes[expandedRouteIndex].time / 3600)}h ${Math.floor((busRoutes[expandedRouteIndex].time % 3600) / 60)} phút`
                              : "Không xác định"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Khoảng cách</p>
                          <p className="text-sm font-medium">{busRoutes[expandedRouteIndex].distance.toFixed(1)} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Giá vé</p>
                          <p className="text-sm font-medium">....</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative pb-4">
                    {busRoutes[expandedRouteIndex] &&
                      (() => {
                        const fullStations = busRoutes[expandedRouteIndex].station;
                        const transferStations = fullStations.filter((station, index, stations) =>
                          index === 0 ||
                          index === stations.length - 1 ||
                          station.route !== stations[index - 1]?.route
                        );

                        const firstStation = transferStations[0];
                        const lastStation = transferStations[transferStations.length - 1];

                        const renderCard = (station, index, nextStation) => {
                          const routeName =
                            busRoutes[expandedRouteIndex].route.find(route => route.id === station.route)?.name || '';
                          return (
                            <div key={index} className="relative mb-5">
                              {nextStation && (
                                <div className="absolute top-10 bottom-0 left-4 w-0.5 bg-gray-300 z-0"></div>
                              )}

                              <div className="flex items-start">
                                <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full border-2 border-indigo-600 mr-4 flex-shrink-0">
                                  <span className="text-xs font-bold">{index + 1}</span>
                                </div>
                                <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                  <div className="mb-1">
                                    <p className="text-sm font-medium">{routeName}</p>
                                    <div className="flex items-center mt-2">
                                      <span
                                        className={`text-xs px-2 py-1 rounded mr-2 whitespace-nowrap font-medium ${
                                          station.route === -1
                                            ? 'bg-green-100 text-green-800'
                                            : station.route === 12998 || station.route === 10974
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-indigo-100 text-indigo-800'
                                        }`}
                                      >
                                        {station.route === -1
                                          ? '🚶 Đi bộ'
                                          : station.route === 12998 || station.route === 10974
                                          ? '🚇 Tàu metro'
                                          : '🚌 Xe buýt'}
                                      </span>
                                    </div>

                                    {nextStation && (
                                      <p className="text-xs mt-2 ml-2 ">
                                        Từ <strong>{station.name}</strong> → đến <strong>{nextStation.name}</strong>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        };

                        return (
                          <>
                            {/* StartPlace → Trạm đầu */}
                            <div className="relative mb-5">
                              <div className="absolute top-10 bottom-0 left-4 w-0.5 bg-gray-300 z-0"></div>
                              <div className="flex items-start">
                                <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-green-100 rounded-full border-2 border-green-600 mr-4 flex-shrink-0">
                                  <span className="text-xs font-bold">0</span>
                                </div>
                                <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                  <p className="text-sm font-medium">🚶 Đi bộ</p>
                                  <p className="text-xs mt-2 ml-2">
                                    Từ <strong>{startPlace}</strong> → đến <strong>{firstStation.name}</strong>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Các tuyến */}
                           {transferStations.slice(0, -1).map((station, index) =>
                            renderCard(station, index + 1, transferStations[index + 1])
                            )}
                            {/* Trạm cuối → EndPlace */}
                            <div className="relative mb-5">
                              <div className="flex items-start">
                                <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-green-100 rounded-full border-2 border-green-600 mr-4 flex-shrink-0">
                                  <span className="text-xs font-bold">{transferStations.length + 1}</span>
                                </div>
                                <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                  <p className="text-sm font-medium">🚶 Đi bộ</p>
                                  <p className="text-xs mt-2 ml-2">
                                    Từ <strong>{lastStation.name}</strong> → đến <strong>{endPlace}</strong>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()
                    }
                  </div>
                </>
                )}
              </div>
            </div>)}
      </div>
      <div className="flex-1 relative">
        <MapComponent
          onLoad={() => setLoaded(true)}
          from_coord={startCoordinate?.lat && startCoordinate?.lng ? startCoordinate : null}
          to_coord={endCoordinate?.lat && endCoordinate?.lng ? endCoordinate : null}
          path={path}
          pathChosen={pathChosen}
        />
      </div>
    </div>
  );
};

export default Sidebar;