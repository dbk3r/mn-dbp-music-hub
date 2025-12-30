FROM node:alpine

WORKDIR /hub
COPY dbp-music-hub-backend/package*.json /hub/

RUN npm install
COPY dbp-music-hub-backend /hub/

EXPOSE 9000

CMD ["npm", "run", "dev"]