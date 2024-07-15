# Anleitung zur Einrichtung eines LDAP Resolvers in privacyIDEA

Diese Anleitung beschreibt die Einrichtung eines LDAP Resolvers in privacyIDEA mit den folgenden Parametern:

- **Resolver Name**: my ldap
- **Server URI**: ldap://openldap:389
- **TLS Version**: Keine Auswahl (da kein LDAPS verwendet wird)
- **Verify TLS**: Deaktiviert (da kein LDAPS verwendet wird)
- **Base DN**: dc=schule-sh,dc=de
- **Scope**: SUBTREE
- **Bind Type**: Simple
- **Bind DN**: cn=admin,dc=schule-sh,dc=de
- **Bind Password**: admin
- **Timeout (seconds)**: 5
- **Cache Timeout (seconds)**: 120
- **Size Limit**: 500
- **Server pool retry rounds**: 2
- **Server pool skip timeout (seconds)**: 30
- **Per-process server pool**: Optional
- **Edit user store**: Optional

LDAP Benutzerstruktur:
- **Object Classes**: top, person, organizationalPerson, inetOrgPerson
- **User DN Template**: CN=&lt;username&gt;,ou=oeffentlicheSchulen,dc=schule-sh,dc=de

Attribut-Mapping:
```json
{
  "phone": "telephoneNumber",
  "mobile": "mobile",
  "email": "mail",
  "surname": "sn",
  "givenname": "givenName",
  "username": "uid"
}
```
