import "./styles/RoomSidebar.css";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

const proxyURL = import.meta.env.VITE_API_SERVER_URL;


function RoomSidebar() {
  const [rooms, setrooms] = useState([]);

  async function getRooms() {
    try {
      const res = await fetch(`${proxyURL}/api/getroom`);
      // "api/getroom" will fetch rooms and "api/createroom" will create a room 
      const data = await res.json();
      setrooms(data.reverse());     //Reverse -- so that when room is created then the new room should be reflected on the top of the list
    } catch (err) {
      console.log("Error Occured:", err);
    }
  }

  async function CreateRoom() {
    await fetch(`${proxyURL}/api/createroom`);
    getRooms();
  }

  useEffect(() => {
    getRooms();
  }, []);

  return (
    <div className="sidebarWrapper">
      <button className="btnCreateRoom" onClick={CreateRoom}>Create Room</button>
      <button onClick={getRooms}>🔄️</button>
      <div className="RoomsWrapper">
        <ul className="RoomsList">
          {rooms?.map((data: { roomId: string; status: string }) => {
            return (
              <li className="Room" key={uuidv4()} style={{ listStyle: "none" }}>
                {/* conditional rendering for active and non active room */}
                {data.status === "active" ? (
                  <p className="activeRoom">
                    <span></span>
                    {data.status}
                  </p>
                ) : (
                  <p className="inactiveRoom">
                    <span></span>
                    {data.status}
                  </p>
                )}
                <Link to={`/rooms/${data.roomId}`} style={{ color: "white" }}>
                  <div className="EnterButton">
                    {data.roomId} <div className="G-ThenLogo">&gt;</div>      
                    {/* &gt; is an entity name for ">" */}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default RoomSidebar;
