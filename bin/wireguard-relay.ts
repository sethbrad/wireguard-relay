#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WireGuardRelayStack } from '../lib/wireguard-relay-stack';

const app = new cdk.App();
new WireGuardRelayStack(app, 'WireGuardRelayStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
