#!/bin/bash
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
rm -rf /home/ubuntu/deploys/* 2>/dev/null || true
rm -rf /home/ubuntu/projects/* 2>/dev/null || true
echo "[]" > /home/ubuntu/backend/projects.json
PGPASSWORD=zenith_password_123 psql -h 127.0.0.1 -U zenith -d zenith_db -c "DELETE FROM projects;"
pm2 restart deploy-api
