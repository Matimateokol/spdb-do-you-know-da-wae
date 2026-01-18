import React, { useState } from 'react';
import './MapSidebar.css';
import axios from "axios";

const MapSidebar = ({ newStartPosition, newEndPosition, onStartPositionChange, onEndPositionChange, onRouteCalculated }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [activeTransportMode, setActiveTransportMode] = useState("car");
  const [maxSpeed, setMaxSpeed] = useState(140);

  const baseUrl = 'http://127.0.0.1:8000/';

  const transports = {
    foot: {
        name: "foot",
        maxSpeed: 5
    },
    bike: {
        name: "bike",
        maxSpeed: 20
    },
    car: {
        name: "car",
        maxSpeed: 140
    },
    train: {
        name: "train",
        maxSpeed: 250
    },
    plane: {
        name: "plane",
        maxSpeed: 800
    },
  };

  const handleSpeedChange = (e) => {
    setMaxSpeed(e.target.value);
    if (e.target.value > transports[activeTransportMode].maxSpeed) {
        var fasterTransports = Object.entries(transports)
            .filter(((obj) => obj[1].maxSpeed > e.target.value))
            .sort((a,b) => a[1].maxSpeed - b[1].maxSpeed);

        if (fasterTransports.length > 0) {
            setActiveTransportMode(fasterTransports[0][1].name);
        }
    }
  };

  const handleSwap = () => {
    setStart(end);
    setEnd(start);
  };

  const handleTransportModeChange = (e) => {
    setActiveTransportMode(e.target.id);
    let transport = e.target.id;
    setMaxSpeed(transports[transport].maxSpeed)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //if (!start || !end) return;
    console.log(e);
    const formData = {
        start_lat: e.target.startLatField.value,
        start_lon: e.target.startLongField.value,
        end_lat: e.target.endLatField.value,
        end_lon: e.target.endLongField.value,
        vehicle_speed: e.target.maxSpeedField.value,
        algorithm: e.target.algorithmField.value
    }

    // const mockValues = {
    //     start_lat: 52.231,
    //     start_lon: 21.006,
    //     end_lat: 52.164,
    //     end_lon: 21.084,
    //     vehicle_speed: 140,
    //     algorithm: 'astar'
    // };

    // try {

    //   const response = await fetch(`{${baseUrl}/api/get_path/?start_lat=${mockValues.start_lat}&start_lon=${mockValues.start_lon}&end_lat=${mockValues.end_lat}&end_lon=${mockValues.end_lon}&vehicle_speed=${mockValues.vehicle_speed}&algorithm=${mockValues.algorithm}`);
    //   const data = await response.json();
    //   console.log(data);
    //   onRouteFound(data); // Send GeoJSON to your map component
    // } catch (err) {
    //   console.error("Fetch error:", err);
    // }

    try {
        axios({
            method: 'get',
            // params: {
            //     "start_lat": 52.231,
            //     "start_lon": 21.006,
            //     "end_lat": 52.164,
            //     "end_lon": 21.084,
            //     "vehicle_speed": 140,
            //     "algorithm": "astar"
            // },
            params: {
                "start_lat": formData.start_lat,
                "start_lon": formData.start_lon,
                "end_lat": formData.end_lat,
                "end_lon": formData.end_lon,
                "vehicle_speed": formData.vehicle_speed,
                "algorithm": formData.algorithm
            },
            url: `${baseUrl}/api/get_path/`,
            responseType: 'json',
        }).then((response) => {
            console.log("Odpowiedziano. Oto dane z odp:");
            console.log(response.data);
            onRouteCalculated(response.data);
        })
    } catch (err) {
        console.error("Fetch error:", err);
    }

  };

  return (
    <div style={styles.sidebar}>
      {/* Header Icons Area */}
      <div style={styles.iconBar}>
        <span id="foot" onClick={handleTransportModeChange}  style={ activeTransportMode === "foot" ? {...styles.icon, ...styles.activeIcon} : {...styles.icon} }>🚶</span>
        <span id="bike" onClick={handleTransportModeChange} style={ activeTransportMode === "bike" ? {...styles.icon, ...styles.activeIcon} : {...styles.icon} }>🚲</span>
        <span id="car" onClick={handleTransportModeChange} style={ activeTransportMode === "car" ? {...styles.icon, ...styles.activeIcon} : {...styles.icon} }>🚗</span>
        <span id="train" onClick={handleTransportModeChange} style={ activeTransportMode === "train" ? {...styles.icon, ...styles.activeIcon} : {...styles.icon} }>🚆</span>
        <span id="plane" onClick={handleTransportModeChange} style={ activeTransportMode === "plane" ? {...styles.icon, ...styles.activeIcon} : {...styles.icon} }>✈️</span>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
            <span className='fieldDescriber'>Prędkość maksymalna (km/h):</span>
            <input id="maxSpeedField" name="maxSpeedField" style={styles.input}
                placeholder="Prędkość maksymalna km/h..."
                value={maxSpeed}
                onChange={(e) => handleSpeedChange(e)}
            />
        </div>
        <div>
            <span className='fieldDescriber'>Algorytm</span>
            <select id="algorithmField" name="algorithmField">
                <option value="astar">A-star</option>
                <option value="djikstra">Djikstra</option>
            </select>
        </div>
        {/* LATITUDE / LONGITUDE based search */}
        <span className='fieldDescriber'>Wybór po współrzędnych</span>
        <div>
            <div style={styles.inputContainer}>
            {/* Visual Track (Dots) */}
            <div style={styles.visualTrack}>
                <div style={styles.circle}></div>
                <div style={styles.dots}></div>
                <div style={styles.pin}>📍</div>
            </div>

            <div style={styles.fields}>
                <input
                id='startLatField'
                name="startLatField"
                type='number'
                style={styles.input}
                placeholder="Szer. geograficzna A..."
                value={newStartPosition.lat}
                onChange={onStartPositionChange}
                />
                <input
                id='startLongField'
                name="startLongField"
                type='number'
                style={styles.input}
                placeholder="Dług. geograficzna A..."
                value={newStartPosition.long}
                onChange={onStartPositionChange}
                />
                <input
                id='endLatField'
                name="endLatField"
                type='number'
                style={styles.input}
                placeholder="Szer. geograficzna B..."
                value={newEndPosition.lat}
                onChange={onEndPositionChange}
                />
                <input
                id='endLongField'
                name="endLongField"
                type='number'
                style={styles.input}
                placeholder="Dług. geograficzna B..."
                value={newEndPosition.long}
                onChange={onEndPositionChange}
                />
            </div>

            <button type="button" onClick={handleSwap} style={styles.swapBtn}>
                ⇅
            </button>
            </div>
        </div>
        <span className='fieldDescriber'>Wybór po adresie</span>
        <div style={styles.inputContainer}>
          {/* Visual Track (Dots) */}
          <div style={styles.visualTrack}>
            <div style={styles.circle}></div>
            <div style={styles.dots}></div>
            <div style={styles.pin}>📍</div>
          </div>

          <div style={styles.fields}>
            <input
              style={styles.input}
              placeholder="Wybierz punkt startowy..."
              value={start}
              disabled={true}
              onChange={(e) => setStart(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Wybierz punkt docelowy..."
              value={end}
              disabled={true}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <button type="button" onClick={handleSwap} style={styles.swapBtn}>
            ⇅
          </button>
        </div>

        <button className='submitBtn' type="submit">
          Wyznacz trasę
        </button>
      </form>
      
      <div style={styles.divider}></div>
    </div>
  );
};

// Inline Styles for simplicity
const styles = {
  sidebar: {
    width: '320px',
    height: '100vh',
    backgroundColor: '#fff',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif'
  },
  iconBar: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '15px 10px',
    borderBottom: '1px solid #eee'
  },
  icon: { fontSize: '20px', cursor: 'pointer', padding: '8px', borderRadius: '8px' },
  activeIcon: { backgroundColor: '#e1f5fe', color: '#0288d1' },
  form: { padding: '20px' },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    position: 'relative'
  },
  visualTrack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  circle: { width: '8px', height: '8px', border: '2px solid #666', borderRadius: '50%' },
  dots: { width: '2px', height: '30px', borderLeft: '2px dotted #ccc' },
  pin: { fontSize: '14px' },
  fields: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' },
  input: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    outline: 'none'
  },
  swapBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666'
  },
  submitBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5px'
  },
  divider: { height: '8px', backgroundColor: '#f0f0f0', width: '100%' }
};

export default MapSidebar;