#!/usr/bin/env bash
set -euo pipefail

# Flush existing rules
iptables -F
iptables -X
iptables -Z
iptables -t nat -F
iptables -t mangle -F

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established/related traffic
iptables -A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

# Allow SSH, HTTP, HTTPS (new connections)
iptables -A INPUT -p tcp --dport 22  -m conntrack --ctstate NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 80  -m conntrack --ctstate NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW -j ACCEPT

# (Optional) Allow ping/ICMP - remove if you want to block ICMP entirely
iptables -A INPUT -p icmp -j ACCEPT

# Done
echo "Firewall rules applied: only ports 22, 80, 443 allowed (incoming)."