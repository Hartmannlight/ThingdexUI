#!/bin/sh
set -e

TEMPLATE=/usr/share/nginx/html/config.template.js
TARGET=/usr/share/nginx/html/config.js
NGINX_TEMPLATE=/etc/nginx/nginx.conf.template
NGINX_TARGET=/etc/nginx/nginx.conf

if [ -f "$TEMPLATE" ]; then
  envsubst < "$TEMPLATE" > "$TARGET"
fi

if [ -f "$NGINX_TEMPLATE" ]; then
  envsubst '$THINGDEX_API_UPSTREAM $THINGDEX_LABEL_SERVICE_UPSTREAM $THINGDEX_PRINTER_HUB_UPSTREAM' < "$NGINX_TEMPLATE" > "$NGINX_TARGET"
fi

exec "$@"
