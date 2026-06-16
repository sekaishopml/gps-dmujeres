# -*- coding: utf-8 -*-
with open('/etc/nginx/sites-available/panel.sekaishopec.com', 'r') as f:
    content = f.read()

# Debug location block
debug_block = """    # ── D-MUJERES TRACCAR: Debug Dashboard ──────────────────────────
    location /dmujeres-gps-debug/ {
        proxy_pass         http://127.0.0.1:8085/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

"""

if "location /dmujeres-gps-debug/" not in content:
    # Insert it right before the location /dmujeres-gps/ block for consistency
    target = "    # ── D-MUJERES TRACCAR: Frontend & Assets ──────────────────────────"
    if target in content:
        content = content.replace(target, debug_block + target)
    else:
        # Otherwise, insert it after client_max_body_size
        target = "client_max_body_size 20M;"
        content = content.replace(target, target + "\n\n" + debug_block)

with open('/etc/nginx/sites-available/panel.sekaishopec.com', 'w') as f:
    f.write(content)

print("Host Nginx config updated with debug block successfully.")
