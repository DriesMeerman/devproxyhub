# FROM node:16

# WORKDIR /app

# COPY package.json package-lock.json* ./
# RUN npm install #//&& npm cache clean --force

# COPY . .

# CMD ["npm", "start"]
FROM node:16

WORKDIR /app

COPY ./proxyhub .

RUN npm install #//&& npm cache clean --force

CMD ["npm", "start"]
