import { useState } from 'react'
import './App.css'

import {Map, Marker, Popup, Source, Layer} from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import MapSidebar from './components/MapSidebar'
import NavMap from './NavMap/NavMap'
import exampleGEOJSON from './assets/exampleGEOJSON.json';

function App() {
  const styles = {divider: { height: '8px', backgroundColor: '#f0f0f0', width: '100%' }}

  const [newStartPosition, setNewStartPosition] = useState({lat: '', long: ''});
  const [newEndPosition, setNewEndPosition] = useState({lat: '', long: ''});
  const [routeData, setRouteData] = useState({});

  const handleRouteReceived = (data) => {
    setRouteData(data);
    console.log(`Data received and route set: ${data}`);
  }

  const handleAddStartClick = (e) => {
    const [longitude, latitude] = e.lngLat.toArray();
    setNewStartPosition({
      lat: latitude,
      long: longitude,
    });
    console.log(`After dblClicking: ${e.lngLat}`);
  };

  const handleAddEndClick = (e) => {
    if (e.originalEvent.button === 2 && e.originalEvent.detail === 2) {
      const [longitude, latitude] = e.lngLat.toArray();
      setNewEndPosition({
        lat: latitude,
        long: longitude,
      });
      console.log(`After dblClicking: ${e.lngLat}`);
    }
  };

  const handleStartPositionChange = (e) => {
    const value = parseFloat(e.target.value);

    if (isNaN(value)) return; // ignore invalid input

    if (e.target.id === "startLatField" && value >= -90 && value <= 90) {
      setNewStartPosition({ ...newStartPosition,  lat: Number(e.target.value) });
    }
    if (e.target.id === "startLongField" && value >= -180 && value <= 180) {
      setNewStartPosition({ ...newStartPosition, long: Number(e.target.value) });
    }

    if (e.target.id === "startMarker") {
      const { lng, lat } = e.lngLat;
      setNewStartPosition({
        long: lng,
        lat: lat
      });
    }
  }

  const handleEndPositionChange = (e) => {
    const value = parseFloat(e.target.value);

    if (isNaN(value)) return;

    if (e.target.id === "endLatField" && value >= -90 && value <= 90) {
      setNewEndPosition({...newEndPosition, lat: Number(e.target.value) });
    }
    if (e.target.id === "endLongField" && value >= -180 && value <= 180) {
      setNewEndPosition({...newEndPosition, long: Number(e.target.value) });
    }

    if (e.target.id === "endMarker") {
      const { lng, lat } = e.lngLat;
      setNewEndPosition({
        long: lng,
        lat: lat
      });
    }
  }

  const handleStartMarkerDragEnd = (e) => {
    const { lng, lat } = e.lngLat;
    setNewStartPosition({ long: lng, lat });
  };

  const handleEndMarkerDragEnd = (e) => {
    const { lng, lat } = e.lngLat;
    setNewEndPosition({ long: lng, lat });
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: '320px auto 25%', backgroundColor: 'dodgerblue'}}>
      <div>
        <MapSidebar
          newStartPosition={newStartPosition}
          newEndPosition={newEndPosition}
          onStartPositionChange={handleStartPositionChange}
          onEndPositionChange={handleEndPositionChange}
          onRouteCalculated={handleRouteReceived}
        />
      </div>
        <NavMap 
          onDblClick={handleAddStartClick} onRightDblClick={handleAddEndClick}>
          {newStartPosition && <Marker
            id="startMarker"
            longitude={newStartPosition.long}
            latitude={newStartPosition.lat}
            anchor="center"
            color= "red"
            draggable={true}
            cursor= 'grab'
            onDragEnd={handleStartMarkerDragEnd}/>
          }
          {newEndPosition && <Marker
            id="endMarker"
            longitude={newEndPosition.long}
            latitude={newEndPosition.lat}
            anchor="center"
            color= "blue"
            draggable={true}
            cursor= 'grab'
            onDragEnd={handleEndMarkerDragEnd}
            />
          }
          <Source 
            type='geojson'
            data={routeData}
            id='someRoute'
          />
          <Layer
            id='routeLine'
            type='line'
            lineOpacity={0}
            source='someRoute'
            paint={{
              "line-color":'#ff0000',
              "line-width":4,
              "line-opacity":1
            }}
          />
        </NavMap>
      <div style={{backgroundColor: '#fff'}}>
        <span style={{color: 'black'}}>
          Informacje dodatkowe
        </span>
        <div style={styles.divider}></div>
      </div>
    </div>
    </>
  )
}

export default App
