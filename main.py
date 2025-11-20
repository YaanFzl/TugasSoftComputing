from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import uvicorn
import os
from routers import ga, fuzzy, sugeno, nn

# Initialize App
app = FastAPI(title="Soft Computing Web3")

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Include Routers
app.include_router(ga.router)
app.include_router(fuzzy.router)
app.include_router(sugeno.router)
app.include_router(nn.router)

# Routes
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/ga", response_class=HTMLResponse)
async def read_ga(request: Request):
    return templates.TemplateResponse("ga.html", {"request": request})

@app.get("/fuzzy", response_class=HTMLResponse)
async def read_fuzzy(request: Request):
    return templates.TemplateResponse("fuzzy.html", {"request": request})

@app.get("/sugeno", response_class=HTMLResponse)
async def read_sugeno(request: Request):
    return templates.TemplateResponse("sugeno.html", {"request": request})

@app.get("/nn", response_class=HTMLResponse)
async def read_nn(request: Request):
    return templates.TemplateResponse("nn.html", {"request": request})

# Main Entry Point
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
