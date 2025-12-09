from fastapi import APIRouter

auth_router = APIRouter(prefix="/auth", tags= ["auth"])

@auth_router.get("/sign-up")
async def cadastrar_Usuário():
    return {"Message" : "Olá mundo"}

@auth_router.post("/login")
async def autenticar_Usuário():
    return {}