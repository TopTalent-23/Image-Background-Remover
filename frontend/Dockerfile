# Use an official Node.js runtime as a base image
FROM node:20.10-alpine

# Set working directory
WORKDIR /usr/app

# Install PM2 globally
RUN npm install --global pm2

# Copy "package.json" and "package-lock.json" before other files
# Utilise Docker cache to save re-installing dependencies if unchanged
COPY ./package*.json ./

# Install dependencies
RUN npm install

# Create .next directory and set permissions before switching to node user
RUN mkdir -p .next && chown -R node:node .next

# Copy all files
COPY ./ ./

# Set permissions for all files
RUN chown -R node:node .

# Switch to node user
USER node

# Build app
#RUN npm run build

# Expose the listening port
EXPOSE 3000

# Launch app with PM2
CMD [ "pm2-runtime", "start", "npm", "--", "run", "dev" ]