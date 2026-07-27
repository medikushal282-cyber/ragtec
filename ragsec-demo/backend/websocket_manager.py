from fastapi import WebSocket
from typing import List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def start(self):
        # No external pubsub needed for single worker
        pass

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WS Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"WS Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """
        Broadcast sends the data directly to all connected clients.
        """
        message_str = json.dumps(data)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception:
                dead_connections.append(connection)
                
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()
