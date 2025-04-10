import { Tabs, Tooltip,Select } from 'antd';
import { use, useEffect, useState } from 'react';
import Coll from './Collapse';
const CustomTabs=({pathdata,pathChosen})=>{
  const [busRoutes, setBusRoutes] = useState([]);
  useEffect(() => {
    if(pathdata){
      const extractedData = pathdata.map((path, index) => {
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
  }, [pathdata]);

    return(
  <Tabs
  centered
  defaultActiveKey="1"
  items={[
    {
      label: (
        <Tooltip title="Bus" placement="top">
          <img
            className="w-8 h-8"
            src="https://i.imgur.com/XCOSmty_d.png?maxwidth=520&shape=thumb&fidelity=high"
            alt="Bus Icon"
          />
        </Tooltip>
      ),
      key: '1',
      children:
      <div className='flex flex-col gap-y-4 bg-white p-4 rounded-md'>
        <div className="flex flex-col gap-y-4 ">
        {busRoutes&&busRoutes.map((route, index) => (
         <div key={index} className="w-full flex flex-col overflow-auto "> 
          <button onClick={()=>pathChosen(index)}>
            <Coll path={route} index={index} />
          </button>
        </div>
        ))}
      </div>
      </div>
      
    },
    {
      label: (
        <Tooltip title="Train" placement="top">
          <img
            className="w-10 h-10"
            src="https://i.imgur.com/gLCpwJ7_d.png?maxwidth=520&shape=thumb&fidelity=high"
            alt="Train Icon"
          />
        </Tooltip>
      ),
      key: '2',
      children: <div></div>,
    },
    {
      label: (
        <Tooltip title="Subway" placement="top">
          <img
            className="w-10 h-10"
            src="https://i.imgur.com/P3o7IcU.png"
            alt="Disabled Icon"
          />
        </Tooltip>
      ),
      key: '3',
      children: 'Content of Tab Pane 3',
      disabled: true,
    },
  ]}
/>)
}
export default CustomTabs