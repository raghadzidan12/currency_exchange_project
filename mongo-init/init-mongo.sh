#!/bin/bash
set -e

# Wait for MongoDB to start
sleep 10

# Create the admin user
mongosh --eval "
  db.getSiblingDB('admin').createUser({
    user: 'admin',
    pwd: 'Srafa123!',
    roles: [
      {
        role: 'userAdminAnyDatabase',
        db: 'admin'
      },
      {
        role: 'readWriteAnyDatabase',
        db: 'admin'
      }
    ]
  });
"