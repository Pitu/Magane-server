FROM node:20-alpine
USER root

# Create app directory
WORKDIR /app

# Copy app source
COPY src ./src
COPY prisma ./prisma
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY .env .env

# Install and prepare the app
RUN npm install
RUN npm run build

CMD ["sh", "-c", "npm run start"];
