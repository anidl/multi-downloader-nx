FROM node  AS builder 
WORKDIR "/app"
COPY . .

# Install 7z for packaging

RUN apt-get update
RUN apt-get install p7zip-full -y

# Update bin-path for docker/linux

RUN echo 'ffmpeg: "./bin/ffmpeg/ffmpeg"\nmkvmerge: "./bin/mkvtoolnix/mkvmerge"' > /app/config/bin-path.yml

#Build AniDL

RUN npm install -g pnpm
RUN pnpm i
RUN pnpm run build-linux-gui

# Move build to new Clean Image

FROM node
WORKDIR "/app"
COPY --from=builder /app/lib/_builds/multi-downloader-nx-linux-x64-gui ./

# Install mkvmerge and ffmpeg

RUN mkdir -p /app/bin/mkvtoolnix
RUN mkdir -p /app/bin/ffmpeg

RUN apt-get update
RUN apt-get install xdg-utils -y
RUN apt-get install mkvtoolnix -y
#RUN apt-get install ffmpeg -y

RUN mv /usr/bin/mkvmerge /app/bin/mkvtoolnix/mkvmerge
#RUN mv /usr/bin/ffmpeg /app/bin/ffmpeg/ffmpeg

CMD [ "/app/aniDL" ]