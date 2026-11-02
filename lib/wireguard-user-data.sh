#!/bin/bash
set -eu
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y wireguard iptables

install -d -m 700 /etc/wireguard
umask 077
wg genkey > /etc/wireguard/server_private.key
wg pubkey < /etc/wireguard/server_private.key > /etc/wireguard/server_public.key
server_private_key="$(cat /etc/wireguard/server_private.key)"
egress_interface="$(ip -o -4 route show to default | awk '{print $5; exit}')"
if [ -z "$egress_interface" ]; then
  echo "Unable to determine the default network interface" >&2
  exit 1
fi

cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = $server_private_key
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o $egress_interface -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o $egress_interface -j MASQUERADE
EOF
chmod 600 /etc/wireguard/wg0.conf

echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/99-wireguard.conf
sysctl --system
systemctl enable --now wg-quick@wg0
