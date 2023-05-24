FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install next -g
COPY . .
RUN npm run build
EXPOSE 8081
CMD [ "npm", "start" ]