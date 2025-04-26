# Stream Setup

## Setup (Windows)

### Install Docker

[Docker](https://www.docker.com/products/docker-desktop/)

### Setup Docker Image (terminal)

```bash
docker pull alfg/nginx-rtmp
```

### Install FFMPEG

1. Install [ffmpeg-release-essentials.zip](https://www.gyan.dev/ffmpeg/builds/) under release builds
2. Extract the ZIP and move the entire extracted folder to:

```bash
    C:\ffmpeg
```

After that, your folder structure should look like:

```bash
C:\ffmpeg\
└── bin\
    └── ffmpeg.exe
```

### Add FFmpeg to path

1. Go to start -> Enviornment Variables
2. Edit "Path" Variables
3. Click "new" and add:

   ```bash
       C:\ffmpeg\bin
   ```

4. Restart computer if typing below command in terminal gives error

```bash
ffmpeg -version
```

5. Open terminal and verify FFmpeg setup:

   ```bash
      ffmpeg -version
   ```

### Start Docker Image

Ensure the following lines in nginx.conf between line 14-17:

```bash
        application live {
            live on;
            record off;
        }
```

In terminal run:

```bash
docker run -it --rm `
  -v "{file-path}/nginx.conf:/etc/nginx/nginx.conf" `
  -p 1935:1935 -p 8080:80 `
  --name rtmp-server `
  alfg/nginx-rtmp nginx -c /etc/nginx/nginx.conf
```

Example:

```bash
docker run -it --rm `
  -v "C:/Users/Jeffuz/Documents/GitHub/rtmp-dji-drone/stream/nginx.conf:/etc/nginx/nginx.conf" `
  -p 1935:1935 -p 8080:80 `
  --name rtmp-server `
  alfg/nginx-rtmp nginx -c /etc/nginx/nginx.conf
```

### Connect Drone

Step 1: Turn on the drone and open DJI Fly app.
Step 2: Go to the livestream settings in DJI Fly:
Tap the three dots (•••) in the top-right corner.

Go to Transmission > Live Streaming (sometimes under "Transmission" or "More").

Step 3: Use Custom RTMP as the streaming platform.
Step 4: Set the RTMP URL to:

```bash
rtmp://<YOUR_COMPUTER_LOCAL_IP>:1935/live/stream
```

Replace <YOUR_COMPUTER_LOCAL_IP> with your actual local IP

You can get your local IP in PowerShell like this:

```bash
ipconfig
```

Look for the one under IPv4 Address that’s connected to your current Wi-Fi.

### Open Stream from Drone

```bash
ffplay -x 960 -y 540 rtmp://localhost/live/stream
```
