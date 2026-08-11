FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache bash postgresql-client

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do echo 'waiting for postgres...'; sleep 2; done; npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all || true; node src/index.js"]
