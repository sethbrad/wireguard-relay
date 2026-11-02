# WireGuard Relay on AWS Lightsail

This AWS CDK application provisions a Debian 12 Lightsail instance on the
small `nano_3_0` bundle, assigns it a static IP, and installs and starts
WireGuard on first boot. The instance opens UDP port 51820 for VPN traffic.
TCP port 22 is limited to the `lightsail-connect` source alias for the
Lightsail browser-based SSH client; it is not open to all internet addresses.

The stack applies the `project=wireguard-relay` tag to resources that
support CloudFormation resource tags, so the instance can be grouped or found
by application tag in AWS tooling. The Lightsail static IP resource does not
expose a tag property in CloudFormation; it is identified by the name
`wireguard-relay-ip`.

The server starts with no WireGuard peers configured. Use the instance's
browser-based SSH connection in the Lightsail console to add client peers
after it finishes booting. This console connection is SSH, not Systems Manager
(SSM) Session Manager; this Lightsail stack does not configure SSM access.
The generated server private key is stored on the instance at
`/etc/wireguard/server_private.key`; it is not emitted as a CDK output.
The instance's first-boot setup script is in
[lib/wireguard-user-data.sh](./lib/wireguard-user-data.sh).

## Requirements

- Node.js and npm
- AWS CLI credentials configured for an account with Lightsail permissions
- AWS CDK bootstrap completed in the target account and region

## Deploy

From this directory, install dependencies and build:

```powershell
npm.cmd install
npm.cmd run build
```

Set `CDK_DEFAULT_REGION` to a region that supports Lightsail, then bootstrap
CDK if needed and deploy:

```powershell
$env:CDK_DEFAULT_REGION = "us-east-1"
npx.cmd cdk bootstrap
npx.cmd cdk deploy
```

After deployment, select the instance in the Lightsail console and choose
**Connect using SSH**. Lightsail limits port 22 to its browser SSH client
addresses through the `lightsail-connect` firewall alias, so you do not need
to discover or maintain your own public-IP CIDR. The instance outputs the
WireGuard endpoint.

## Remove

To delete the stack and its Lightsail resources:

```powershell
npx.cmd cdk destroy
```

Lightsail charges apply while the instance and static IP are allocated.
