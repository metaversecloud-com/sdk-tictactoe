git pull
npm install
apt update
apt upgrade -y
apt autoremove -y
docker build -f Dockerfile.dev . -t latest-ttt
docker stop latest-container
docker container prune -f
docker run -p 3000:3000 -p 3001:3001 -d --name latest-container --env INSTANCE_DOMAIN=api.topia.io --env INTERACTIVE_KEY=eDtTM1wKgP0B39pYidZc --env INTERACTIVE_SECRET=1314f7b5-4ec8-46ba-ac8d-8b0c06e11b3b --env CUSTOM_TEXT=rXLgzCs1wxpx96YLZAN5 --env WEB_IMAGE=webImageAsset --env API_URL=https://ttt.topia-randd.io latest-ttt
docker image prune -af
docker logs latest-container -f
