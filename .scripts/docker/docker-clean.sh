docker container rm simple_ai_chat -f
docker rmi simple-ai-chat && docker image prune -f
docker system prune -a -f