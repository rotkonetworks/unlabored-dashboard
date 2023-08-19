git pull
mv dist dist.bak
pnpm run build
systemctl restart eupnea-frontend
