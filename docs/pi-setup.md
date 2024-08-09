# PrivacyIDEA Setup

## .env

```
PI_BASE_URL=http://localhost:5000
PI_ADMIN_USER=admin
PI_ADMIN_PASSWORD=admin
PI_USER_RESOLVER=mariadb_resolver
```

## configure sql resolver

The resolver will be almost completely restored from the dump.sql. The one step to do is setting the password for maria db again.

Login into PrivacyIDEA as Admin &rarr; Configuration &rarr; User &rarr; mariadb_resolver &rarr; set password as "password"
