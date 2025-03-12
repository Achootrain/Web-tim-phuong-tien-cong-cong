import { Tabs, Tooltip } from 'antd';
const CustomTabs=()=>{


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
      children: <div></div>,
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