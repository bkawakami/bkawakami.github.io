# Use a imagem base oficial do NGINX
FROM nginx:alpine

# Copie o arquivo index.html para o diretório padrão do NGINX
COPY . /usr/share/nginx/html/

# Copie o arquivo de configuração customizado
COPY nginx.conf /etc/nginx/nginx.conf

# Exponha a porta desejada (ex: 8080)
EXPOSE 8080

# Comando padrão para iniciar o NGINX
CMD ["nginx", "-g", "daemon off;"]
