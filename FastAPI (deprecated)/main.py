from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response, Cookie
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from chat import startupSequence
from datetime import datetime, timedelta

app = FastAPI()

class DataModel(BaseModel):
    data: str

templates = Jinja2Templates(directory="templates")
COOKIE_EXPIRATION_TIME = 1800  # 30 minutes in seconds
COOKIE_NAME = "chat_session"

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request, response: Response, chat_session: str = Cookie(None)):
    if not chat_session:
        response.set_cookie(key=COOKIE_NAME, value=str(datetime.utcnow()), max_age=COOKIE_EXPIRATION_TIME)
        chat_session = str(datetime.utcnow())
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, chat_session: str = Cookie(None)):
    if not True:
        await websocket.close()
    else:
        await websocket.accept()
        manager = startupSequence()
        try:
            while True:
                data = await websocket.receive_text()
                print("Messaging GPT")
                response = manager.chat(data)
                await websocket.send_text(response)
                # Reset cookie
                websocket.cookies[COOKIE_NAME] = str(datetime.utcnow())
        except WebSocketDisconnect:
            await websocket.close()

@app.post("/send")
async def receive_data(item: DataModel):
    data = item.data
    manager = startupSequence()
    response = manager.chat(data)
    return {"message": f"{response}"}
