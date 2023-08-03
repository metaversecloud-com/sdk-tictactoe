git pull
npm install
docker build -f Dockerfile.dev . -t latest-ttt
docker stop latest-container
docker container prune
docker run -p 3000:3000 -p 3001:3001 -d --name latest-container --env INSTANCE_DOMAIN=api.topia.io --env INTERACTIVE_KEY=eDtTM1wKgP0B39pYidZc --env INTERACTIVE_SECRET=1314f7b5-4ec8-46ba-ac8d-8b0c06e11b3b --env CUSTOM_TEXT=rXLgzCs1wxpx96YLZAN5 --env START_BUTTON=Ko56CkYjFvL4IWm27ISX --env CROWN=cg59i7M6mabAobm1k6Hr --env BLUE_X=PjccgK9hiv5ZDB8vT2vK --env BLUE_O=Am6s8MRzIp4C137hg7Kf --env RED_X=nD7Pfmo2g1GgQF2iUmBm --env RED_O=ROP9HIdZJ8JRYAyn4oVi --env V_RED_LINE=pQ3jvnTgTisZyc7afkGn --env V_BLUE_LINE=JfwQRPt3P28XSgfMyf6I --env H_RED_LINE=UiVUWcClHSsblbTfYEMd --env H_BLUE_LINE=MhfEecToW83Nh3nVnX7F --env O_RED_LINE=L2Cid8H4cVC56Z629qC4 --env O_BLUE_LINE=ULzKociCJWXrISpisMxl --env P1_STAND=kDprIO2lDDTwkjuT7QxX --env P2_STAND=buwykWfqblLWeLpMqSLJ --env GAME_BOARD=Ck0Uoin05j5KBFajdJ9l latest-ttt
docker image prune
docker logs latest-container -f
