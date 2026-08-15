FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
RUN mkdir -p uploads/profiles uploads/resumes
COPY uploads/resumes/Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf ./uploads/resumes/Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf
EXPOSE 5000
CMD ["node", "dist/server.js"]
