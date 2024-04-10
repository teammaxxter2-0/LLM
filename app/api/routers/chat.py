from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends, HTTPException, Request, status

chat_router = chat = APIRouter()

@chat.post("")
async def chat():
    return {"message": "GPT here."}