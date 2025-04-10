import { Collapse } from 'antd';

const Coll = ({ path,index }) => {
const items = [
    {
    key: index,
    label: (
        <div className="flex flex-col">
        <span className="font-semibold text-base">Lộ trình {index+1}</span>
        <span className="text-sm text-gray-500">
            {path.routeChanges} lần chuyển tuyến
        </span>
        </div>
    ),
    children: (
        <div className="p-2">

        {/* Tuyến xe buýt */}
        <div className="mb-4">
            <div className="font-medium text-gray-700 mb-1">Tuyến xe:</div>
            <ul className="list-disc list-inside text-sm text-blue-600">
            {path.route.map((r) => (
                <li key={r.id}>
                {r.name} <span className="text-gray-400">(ID: {r.id})</span>
                </li>
            ))}
            </ul>
        </div>

        {/* Trạm dừng */}
        <div>
            <div className="font-medium text-gray-700 mb-1">Trạm dừng:</div>
            <ul className="space-y-3 text-sm">
            {path.station.map((s) => (
                <li key={s.id} className="border rounded p-2">
                <div className="font-semibold">{s.name}</div>
                <div className="text-gray-500 text-xs">Mã trạm: {s.id}</div>
                {s.address && (
                    <div className="text-gray-500 text-xs">Địa chỉ: {s.address}</div>
                )}
                <div className="text-green-500 text-xs">Tuyến đi qua: {s.route}</div>
                </li>
            ))}
            </ul>
        </div>

        </div>
    ),
    },
];

return <Collapse items={items}  className="bg-white shadow rounded-lg" />;
};
      

export default Coll;