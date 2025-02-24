# Utiliza la imagen oficial de Node.js
FROM node:22

# Instala pnpm
RUN npm install -g pnpm

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de configuración de dependencias
COPY package*.json ./

# Instala las dependencias de la aplicación
RUN pnpm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto en el que la aplicación escuchará
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["pnpm", "start"]

