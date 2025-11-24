#!/bin/bash

# Ensure path exists
mkdir -p keys

# Generate RSA private key (2048 bits by default)
openssl genrsa -out "keys/private.pem" 2048

# Extract the public key from the private key
openssl rsa -in "keys/private.pem" -pubout -out "keys/public.pem"
