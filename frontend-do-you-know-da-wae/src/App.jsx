import { useState } from 'react'
import './App.css'

import {Marker, Source, Layer} from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import MapSidebar from './components/MapSidebar'
import NavMap from './NavMap/NavMap'
import AdditionalInfoPanel from './components/AdditionalInfoPanel'
import DetailsCard from './components/DetailsCard'

function App() {
  const styles = {divider: { height: '8px', backgroundColor: '#f0f0f0', width: '100%' }}

  const [newStartPosition, setNewStartPosition] = useState({lat: '', long: ''});
  const [newEndPosition, setNewEndPosition] = useState({lat: '', long: ''});
  const [routeData, setRouteData] = useState([{}, {}, {}]);
  const [routeHidden, setRouteHidden] = useState([false, false, false]);
  const [boundingBox, setBoundingBox] = useState('');

  const handleChangeRouteVisibility = (e) => {
    const index = Number(e.target.dataset.index);
    const checked = e.target.checked;
    
    setRouteHidden(prev => prev.map((value, i) => (i === index ? checked : value)));
  };

  const handleRouteReceived = (data) => {
    setRouteData(data);
    console.log(`Data received and route set: ${data}`);
  }

  const handleBoundingBoxReceived = (data) => {
    setBoundingBox(data);
    console.log(`Bounding box set: ${data}`);
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
    <div style={{ display: 'grid', gridTemplateColumns: '320px auto 25%', minHeight: '100vh', backgroundColor: 'dodgerblue'}}>
      <div>
        <MapSidebar
          newStartPosition={newStartPosition}
          newEndPosition={newEndPosition}
          onStartPositionChange={handleStartPositionChange}
          onEndPositionChange={handleEndPositionChange}
          onRouteCalculated={handleRouteReceived}
          onBoundingBoxCalculated={handleBoundingBoxReceived}
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
            data={routeData[0]}
            id='someRoute1'
          />
          <Source 
            type='geojson'
            data={routeData[1]}
            id='someRoute2'
          />
          <Source 
            type='geojson'
            data={routeData[2]}
            id='someRoute3'
          />
          <Layer
            id='routeLine1'
            type='line'
            source='someRoute1'
            paint={{
              "line-color":'#ff0000',
              "line-width":8,
              "line-opacity": !routeHidden[0] ? 1 : 0
            }}
          />
          <Layer
            id='routeLine2'
            type='line'
            source='someRoute2'
            paint={{
              "line-color":'green',
              "line-width":5,
              "line-opacity": !routeHidden[1] ? 1 : 0
            }}
          />
          <Layer
            id='routeLine3'
            type='line'
            source='someRoute3'
            paint={{
              "line-color":'blue',
              "line-width":3,
              "line-opacity": !routeHidden[2] ? 1 : 0
            }}
          />
          <Source 
            type='geojson'
            data={boundingBox}
            id='boundingBox'
          />
          {
            boundingBox &&
            <Layer 
              id='boundingBoxArea'
              type='fill'
              source='boundingBox'
              paint={{
              "fill-color":'pink',
              "fill-outline-color": 'red',
              "fill-opacity": 0.5
            }}
            />
          }
        </NavMap>
        <AdditionalInfoPanel>
          <div style={styles.divider} />
          { routeData[0].metadata && <>
              <DetailsCard 
                routeMetadata={routeData[0].metadata} 
                routeNumber={1} 
                routeColor='#ff0000'
                onHideClick={handleChangeRouteVisibility}
                hidden={routeHidden[0]}
              />
            </>
          }
          { routeData[1].metadata && <>
              <DetailsCard 
                routeMetadata={routeData[1].metadata} 
                routeNumber={2} 
                routeColor='green'
                onHideClick={handleChangeRouteVisibility}
                hidden={routeHidden[1]}
              />
            </>
          }
          { routeData[2].metadata && <>
              <DetailsCard 
                routeMetadata={routeData[2].metadata} 
                routeNumber={3} 
                routeColor='blue'
                onHideClick={handleChangeRouteVisibility}
                hidden={routeHidden[2]}
              />
            </>
          }
        </AdditionalInfoPanel>
    </div>
    </>
  )
}

export default App
