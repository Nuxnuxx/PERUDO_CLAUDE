#!/bin/sh

# This script injects the BACKEND_URL environment variable into the HTML
# It's intended to be run at container startup time in the frontend container

# Default to localhost if BACKEND_URL isn't set
BACKEND_URL=${BACKEND_URL:-"http://localhost:3000"}

echo "Injecting backend URL: $BACKEND_URL"

# Replace the placeholder in index.html
sed -i "s|</head>|<script>window.BACKEND_URL = \"$BACKEND_URL\";</script></head>|g" /usr/share/nginx/html/index.html

echo "Backend URL injected successfully"

# Execute the original command
exec "$@"