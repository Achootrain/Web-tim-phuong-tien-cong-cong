import { Tabs, Tooltip,Select } from 'antd';
import { useState } from 'react';
const CustomTabs=()=>{
const [waypoint,setWaypoint]=useState(1);
const handleChange=(value)=>{
  setWaypoint(value);
}
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
      <div>
        <Select
        defaultValue="1 tuyến"
        style={{
          width: 120,
        }}
        onChange={handleChange}
        options={[
          {
          value: '1',
          label: '1 tuyến',
        },
        {
          value: '2',
          label: '2 tuyến',
        },
        {
          value: '3',
          label: '3 tuyến',
        }
        ]}
        />
      </div>,
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