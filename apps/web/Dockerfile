FROM node:24-slim
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm install
COPY apps/web ./apps/web
WORKDIR /app/apps/web
CMD ["npm", "run", "dev"]
