#!/bin/bash

# Replace environment variables in nginx config
envsubst '${REACT_APP_API_BASE_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g 'daemon off;' 