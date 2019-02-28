# opkube

> CLI utility for transferring secrets betweeen Kubernetes and 1Password


## Installation

```bash
npm install opkube
```


## Usage

> You need the [op](https://support.1password.com/command-line-getting-started/#set-up-the-command-line-tool) binary available in $PATH.


```bash
# Sign in with op
eval $(op signin myteam)

# Create kubernetes secrets from 1P vault items
opkube from-vault myvault | kubectl create -f -

# Store kubernetes secrets in 1Password vault
kubectl get secrets | opkube to-vault myvault

# Install shell completion (bash, zsh, fish)
opkube --install-completion

# Uninstall shell completion
opkube --uninstall-completion
```

### Secrets in 1Password

A secret is represented as a _Secure Note_.
Single line values are stored as key/value pairs under a section titled `data`, while multiline values are stored as linked documents.

1Password secure notes must be tagged `secret` te be considered by opkube.
