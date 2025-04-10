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
const MapComponent = ({ onLoad,locate_user ,from_coord,to_coord,fromBusList,toBusList,path,pathChosen}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
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
      fromBusList.forEach((stop) => {
        const marker = new goongjs.Marker({ color: "green" })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(
            new goongjs.Popup().setHTML(`
               <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;">
                <div><strong>Trạm số:</strong> ${stop.id}</div>
                <div><strong>${stop.name}</strong></div>
                <div>${stop.address || ''}</div>
              </div>`)
          )
          .addTo(map.current);
      });
    
        
    }
    if(to_coord){
      new goongjs.Marker({color:'red'}).setLngLat(to_coord).addTo(map.current);
      map.current.setCenter(to_coord);
      toBusList.forEach((stop) => {
        const marker = new goongjs.Marker({ color: "green" })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(
            new goongjs.Popup().setHTML(
             `
              <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;">
                <div><strong>Trạm số:</strong> ${stop.id}</div>
                <div><strong>${stop.name}</strong></div>
                <div>${stop.address || ''}</div>
              </div>
                `
            )
          )
          .addTo(map.current);
      });
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
    if (path && map.current) {
      map.current.on('load', () => {
        const colors = ['#1abc9c', '#3498db', '#e67e22', '#9b59b6', '#f1c40f', '#e74c3c']; // Add more if needed
        
          const coordinates = path[pathChosen].pathPoints.map(coord => [coord[0], coord[1]]);
          const sourceId = `route-source-${pathChosen}`;
          const layerId = `route-layer-${pathChosen}`;
       
          // Add source
          if (!map.current.getSource(sourceId)) {
            map.current.addSource(sourceId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: coordinates,
                },
              },
            });
          }
          // Add layer
          if (!map.current.getLayer(layerId)) {
            map.current.addLayer({
              id: layerId,
              type: "line",
              source: sourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": colors[pathChosen % colors.length],
                "line-width": 8,
              },
           
            });
          }
          path[pathChosen].passed.forEach((stop) => {
            const marker = new goongjs.Marker({ color: colors[pathChosen % colors.length] })
              .setLngLat([stop.station.lng, stop.station.lat])
              .setPopup(
                new goongjs.Popup().setHTML(`
                  <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;">
                    <div><strong>Trạm số:</strong> ${stop.station.stationId}</div>
                    <div><strong>Tuyến số:</strong> ${stop.route}</div>
                    <div><strong>${stop.station.stationName}</strong></div>
                    <div>${stop.station.stationAddress || ''}</div>
                  </div>
                `)
              )
              .addTo(map.current);
          })
          
          

     
      });
    }

  },[from_coord,to_coord,path,pathChosen])
 
  return (
    <div ref={mapContainer} className="fixed inset-0 w-screen h-screen z-0" />
  );
};

export default MapComponent;
