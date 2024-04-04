FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy app source
COPY . .

# Install and prepare the app
RUN yarn install
RUN yarn build
ENV NODE_ENV=production

CMD ["yarn", "node", "--dns-result-order=ipv4first", "-r", "dotenv/config", "dist/main.js"];
