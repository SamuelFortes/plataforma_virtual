from fastapi import FastAPI

app = FastAPI()

from routes.auth_routes import auth_router

app.include_router(auth_router)