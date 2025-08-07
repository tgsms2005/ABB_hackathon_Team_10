# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build -- --output-path=./dist/out --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
# Copy the built Angular application from the 'build' stage
COPY --from=build /app/dist/out/browser /usr/share/nginx/html
EXPOSE 80