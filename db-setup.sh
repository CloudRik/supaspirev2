sudo -u postgres psql -c "CREATE USER zenith WITH PASSWORD 'zenith_password_123';"
sudo -u postgres psql -c "CREATE DATABASE zenith_db OWNER zenith;"
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/*/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql
