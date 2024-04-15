from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from chat import startupSequence

app = FastAPI()

class DataModel(BaseModel):
    data: str

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/send")
async def receive_data(item: DataModel):
    data = item.data
    manager = startupSequence()
    response = manager.chat(data)
    return {"message": f"{response}"}