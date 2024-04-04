FROM node:20-alpine

# Create app directory
WORKDIR /app
ENV NODE_ENV=production

# Copy app source
COPY . .

# Install and prepare the app
RUN npm install --production=false
RUN npm run build

CMD ["node", "--dns-result-order=ipv4first", "-r", "dotenv/config", "dist/main.js"];
