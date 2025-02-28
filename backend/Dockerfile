FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install --production

# Copy app source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the app
CMD ["node", "server.js"]