# -*- coding: utf-8 -*-
with open('/etc/nginx/sites-available/panel.sekaishopec.com', 'r') as f:
    content = f.read()

# Add map block at the beginning
map_block = """map $http_referer $api_upstream_3001 {
    default http://127.0.0.1:3001;
    ~dmujeres-gps http://127.0.0.1:8080;
}

"""

if "map $http_referer $api_upstream_3001" not in content:
    content = map_block + content

# Replace proxy_pass http://127.0.0.1:3001; with proxy_pass $api_upstream_3001;
# inside the location /api/ block
old_block = """    # ── CRM/ERP: API Backend (Node.js puerto 3001) ───────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;"""

new_block = """    # ── CRM/ERP: API Backend (Node.js puerto 3001) ───────────────────
    location /api/ {
        proxy_pass         $api_upstream_3001;"""

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("WARNING: could not find location /api/ block precisely. Let's try general replace.")
    content = content.replace("proxy_pass         http://127.0.0.1:3001;", "proxy_pass         $api_upstream_3001;")

with open('/etc/nginx/sites-available/panel.sekaishopec.com', 'w') as f:
    f.write(content)

print("Host Nginx config updated successfully.")
