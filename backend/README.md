# MONGODB DB USER  (ELIMINAR)
username = miguelteranj02
password = jew502LCt4ARIDCN
ip_address = 181.115.215.12

# Estructura del proyecto

RITMO/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── config/
│   ├── middleware/
│   ├── services/
│   ├── server.js
│   └── package.json

- **controllers:** aquí irán los controladores que manejarán las peticiones de las rutas.
- **models:** Los modelos de las bases de datos (usando Mongoose para MongoDB).
- **routes:** Las rutas para las distintas funcionalidades (ej. autenticación, hábitos, etc.).
- **config:** Archivos de configuración (como la configuración de MongoDB, CORS, etc.).
- **middleware:** Funciones intermedias que se ejecutan antes de llegar al controlador (por ejemplo, para autenticación).
- **services:** Lógica de negocio, servicios que se encargan de realizar operaciones con la base de datos.
- **server.js:** El archivo principal para arrancar el servidor (con Express).
- **package.json:** Dependencias y scripts del backend.
