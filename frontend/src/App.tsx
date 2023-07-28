import ChatFlow from "./components/ChatFlow";
import RoomSidebar from "./components/RoomSidebar";
import { Routes, Route } from "react-router-dom";

import "./App.css";
function App() {
  return (
    <div className="AppContainer">
      <div className="RoomSidebar">
        <RoomSidebar></RoomSidebar>
      </div>
      <div className="ChatAppContainer">
        <h1 style={{ textAlign: "center" }}>Walky Talky🗣️🦜</h1>
        <div className="wrapper">
          <Routes>
            {/* <Route path="/" Component={ChatFlow}></Route> */}
            <Route path="/rooms/:roomId" Component={ChatFlow}></Route>
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
