import goongjs from "@goongmaps/goong-js";
import { useEffect, useRef, useState } from "react";
function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve([longitude, latitude]);
        },
        (error) => reject(error),
        { enableHighAccuracy: true }
      );
    } else {
      reject("Geolocation is not supported by this browser.");
    }
  });
}
const MapComponent = ({ onLoad,locate_user ,from_coord,to_coord}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [from, setFrom] = useState({});
  const [to, setTo] = useState({});
  console.log(from_coord)
  useEffect(() => {
    goongjs.accessToken = process.env.REACT_APP_GOONG_MAP_ACCESS_TOKEN;

    map.current = new goongjs.Map({
      container: mapContainer.current,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: [105.83639558900006, 20.988928921000024], 
      zoom: 17,
    });

    map.current.on("load", () => {
      setMapLoaded(true);
      if (onLoad) onLoad(); // Notify parent component
    });
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [onLoad]);
  useEffect(()=>{
    if(locate_user){
      getLocation()
      .then((coords) => {
        map.current.setCenter(coords);
        map.current.setZoom(17);
        new goongjs.Marker().setLngLat(coords).addTo(map.current);
      })
      }        
      },[locate_user])
     
  useEffect(()=>{
    if(from_coord){
      new goongjs.Marker({color:'blue'}).setLngLat(from_coord).addTo(map.current);
      map.current.setCenter(from_coord);
    }
    if(to_coord){
      new goongjs.Marker({color:'red'}).setLngLat(to_coord).addTo(map.current);
      map.current.setCenter(to_coord);
    }
    if(from_coord&&to_coord){
      const centerPoint = [
        (from_coord.lng + to_coord.lng) / 2,
        (from_coord.lat + to_coord.lat) / 2
      ];
     
      const distance = Math.sqrt(
        Math.pow(to_coord.lat - from_coord.lat, 2) +
        Math.pow(to_coord.lng - from_coord.lng, 2)
      );

      const zoomLevel = Math.max(5, 15 - Math.log2(distance * 100));
      map.current.setCenter(centerPoint);
      map.current.setZoom(zoomLevel);
    }
  },[from_coord,to_coord])
 
  return (
    <div ref={mapContainer} className="fixed inset-0 w-screen h-screen z-0" />
  );
};

export default MapComponent;
