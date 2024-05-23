# Test with LDAP Test Module

## Order of tests / dependencies

Because some entries in LDAP dependent on others, testing requires a little bit preparation.
Sometimes it makes sense to define a `beforeAll` for individual tests (describe or it).

Currently, for each method of `LdapClientService` for example a separate test is done in one separate file
and each single test case (describe or it) should be tested separately whether it returns the expected result.

## Waiting / timing issues

Currently, the tests which use `LdapTestModule` also import `DatabaseTestModule` and set up the database to ensure proper
wait for the LDAP test-container to start. In the future this should be replaced by a proper wait-strategy. Unfortunately at the moment
waiting for a simple health-check is not that easy.
