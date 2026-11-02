import * as cdk from 'aws-cdk-lib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Construct } from 'constructs';
import * as lightsail from 'aws-cdk-lib/aws-lightsail';

function wireGuardUserData(): string {
  return readFileSync(join(__dirname, 'wireguard-user-data.sh'), 'utf8').replace(
    /\r\n?/g,
    '\n',
  );
}

export class WireGuardRelayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add('project', 'wireguard-relay');

    const instance = new lightsail.CfnInstance(this, 'WireGuardInstance', {
      instanceName: 'wireguard-relay',
      blueprintId: 'debian_12',
      bundleId: 'nano_3_0',
      networking: {
        ports: [
          {
            accessDirection: 'inbound',
            accessFrom: 'Anywhere (0.0.0.0/0)',
            accessType: 'Public',
            fromPort: 51820,
            toPort: 51820,
            protocol: 'udp',
          },
          {
            accessDirection: 'inbound',
            accessFrom: 'Custom',
            accessType: 'Public',
            cidrListAliases: ['lightsail-connect'],
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
          },
        ],
      },
      userData: wireGuardUserData(),
    });

    const staticIp = new lightsail.CfnStaticIp(this, 'WireGuardStaticIp', {
      staticIpName: 'wireguard-relay-ip',
      attachedTo: instance.ref,
    });

    new cdk.CfnOutput(this, 'WireGuardEndpoint', {
      value: `${staticIp.attrIpAddress}:51820`,
      description: 'Public WireGuard endpoint',
    });
  }
}
