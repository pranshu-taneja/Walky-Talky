import { useState, useEffect, ChangeEvent } from "react";
import io, { Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import "./styles/ChatFlow.css";
import { useParams } from "react-router-dom";

export default function ChatFlow() {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chat, setChat] = useState<string[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [RoomJoined, setRoomJoined] = useState(false);
  const [RoomActive, setRoomActive] = useState("active");

  const { roomId } = useParams();
  // const proxyURL = "https://walky-talky-omega.vercel.app"
  const proxyURL = "http://localhost:3000"

  useEffect(() => {
    async function isRoomActive() {
      const res = await fetch(`${proxyURL}/api/roomactive/${roomId}`);
      const { isActive } = await res.json();
      // console.log(isActive);
      setRoomActive(isActive);
    }
    isRoomActive();
  }, [RoomActive, JoinRoom]);

  useEffect(() => {
    async function scrollDownChat() {
      try {
        const chatInterface =
          document.getElementsByClassName("ChatInterface")[0];
        chatInterface.scrollTop = chatInterface.scrollHeight; // This will scroll to the bottom
      } catch (err) {
        console.log(err);
      }
    }
    scrollDownChat();
  }, [chat]);

  useEffect(() => {
    function connectServer() {
      const newSocket = io(proxyURL); // Replace with your server URL
      setSocket(newSocket);
    }

    if (connected) {
      socket?.on("getChat", ({ message }) => {
        setChat((prevChat: string[]) => [...prevChat, message]);
      });
    } else {
      connectServer();
    }

    return () => {
      socket?.emit("leaveRoom", roomId);
      setRoomJoined(false);
      setChat([]);
    };
  }, [connected, roomId]);

  socket?.on("connect", () => {
    console.log("Connected to server");
    setConnected(true);
  });

  socket?.on("disconnect", () => {
    console.log("Disconnected from server");
    setConnected(false);
  });

  function handleMsg() {
    if (socket) {
      socket.emit("chatMessage", { room: roomId, message: msg });
      setChat((prevchat) => [...prevchat, msg]);
      setMsg("");
    }
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    setMsg(e.target.value);
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMsg();
    }
  }

  async function fetchChat(timestamp: string) {
    const res = await fetch(
      `${proxyURL}/api/getchat/${roomId}?timestamp=${timestamp}`
    );

    const data: [{ content: string }] = await res.json();
    data.map((val) => {
      setChat((prevChat: string[]) => [val.content, ...prevChat]);
    });
  }

  function JoinRoom() {
    socket?.emit("joinRoom", roomId);
    setRoomJoined(true);
    const timestamp = new Date().toISOString(); // Replace this with your desired timestamp

    // setTimeout(() => {
    fetchChat(timestamp);
    // }, 10000);
  }

  function leaveRoom() {
    socket?.emit("leaveRoom", roomId);
    setRoomJoined(false);
    setChat([]);
  }

  // function LoadMore(){
  //   fetchChat(chat[0].)
  // }

  return (
    <div className="ChatWrapper">
      {RoomActive ? (
        RoomJoined ? (
          <button onClick={leaveRoom}>Leave Room</button>
        ) : (
          <button onClick={JoinRoom}>Join Room</button>
        )
      ) : (
        <div>
          <p style={{color:"lightcoral"}}>Room Not Active!!</p>

          <button
            onClick={() => {
              const timestamp = new Date().toISOString();
              fetchChat(timestamp);
            }}
          >
            Load Chat👇
          </button>
        </div>
      )}

      <div className="ChatInterface">
        <ul>
          {/* <button onClick={LoadMore}>Load More👆</button> */}
          {chat?.map((value) => {
            return (
              <div className="ChatMsgWrapper" key={uuidv4()}>
                <div>
                  <li className="chatMsg">{value}</li>
                  <img
                    style={{ width: "25px", height: "25px" }}
                    src="https://api.dicebear.com/6.x/adventurer/svg?seed=Zoe"
                    alt="avatar"
                  />
                </div>
              </div>
            );
          })}
        </ul>
      </div>

      <div className="SendMsg">
        <input
          className="inputMSG"
          type="text"
          value={msg}
          onChange={(e) => {
            handleInput(e);
          }}
          // disabled={Boolean(!RoomActive)}
          onKeyDown={(e) => {
            handleKeyPress(e);
          }}
        />
        <button disabled={Boolean(!RoomActive)} onClick={handleMsg}>
          Send👋
        </button>
      </div>
    </div>
  );
}
