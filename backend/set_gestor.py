from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    conn.execute(text("UPDATE usuarios SET role='GESTOR' WHERE email='samuelfurtadofortes@gmail.com'"))
    conn.commit()
    print('OK - role atualizada para GESTOR')
