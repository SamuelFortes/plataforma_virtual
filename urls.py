from fastapi import FastAPI
from fastapi.responses import FileResponse

app = FastAPI()

@app.get("/equipes")
async def pagina_Inicial():
    return FileResponse("index.html")



