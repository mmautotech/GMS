import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";

// Create context
const SocketContext = createContext();

// Custom hook to use socket anywhere
export const useSocket = () => useContext(SocketContext);

// Provider component
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const socketClient = io("http://192.168.18.84:5000", {
            transports: ["websocket"],
            reconnection: true,
        });

        // On connect
        socketClient.on("connect", () => {
            console.log("✅ Connected to socket:", socketClient.id);
            setSocket(socketClient);
        });

        // On disconnect
        socketClient.on("disconnect", () => {
            console.log("🛑 Socket disconnected");
        });

        // Cleanup on unmount
        return () => {
            socketClient.disconnect();
        };
    }, []);

    const value = useMemo(() => socket, [socket]);

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
