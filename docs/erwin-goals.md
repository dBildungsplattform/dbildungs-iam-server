II a dBildung-IAM as a production ready, stand-alone system

Erwin Team Goals: <br />dBildung-IAM can be used as IDP for Service Providers like LMS and school portals i.e. dBildungscloud and "Schulportal SH":<br />
1. separating IDM from dBildungscloud supporting the strategic goal to realize a stand-alone system which is production ready.
2. extend the IDM user's data model with structural information supporting the strategic goal to base the IDM on a German educational data model.
3. dBildung-IAM can import/sync from other IDPs.
4. dBildung-IAM can be used as the leading system.
5. Configuration concerning IDPs, sync, etc. that is currently done via SHD or directly in DB is done via a micro service hosted together with dBildung-IAM  (instead of in dBildungscloud)
6. dBildung-IAM provides an API only:
    - A GUI can be developed by the portal using dBildung-IAM.
    - In the future a GUI might be provided by dBildung-IAM to be integrated it into a portal as a micro frontend.

![Erwin-Architecture-Iteration-2 Diagramm](img/Erwin-Architecture-Iteration-2.svg)

Optional Goals (to be discussed):
1. Support LTI Tools:
    - Connect e.g. Bettermarks, Big Blue Button and others directly (could enable removal of Hydra in dBildungscloud)
    - Update Q1/2024: LTI 1.3 will be supported as it is an extension of OIDC
    - Update Q1/2024: It will be looked into brokering moin.schule for LTI 1.3
2. Provide a GUI
