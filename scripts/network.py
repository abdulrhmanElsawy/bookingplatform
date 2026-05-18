import scapy.all as scapy
import netifaces
import ipaddress
import urllib.request
import urllib.error
import json
import socket
import time

def get_network_and_iface():
    gateways = netifaces.gateways()
    default_iface = gateways["default"][netifaces.AF_INET][1]
    addrs = netifaces.ifaddresses(default_iface)[netifaces.AF_INET][0]
    ip   = addrs["addr"]
    mask = addrs["netmask"]
    network = ipaddress.IPv4Network(f"{ip}/{mask}", strict=False)
    return str(network), default_iface, ip

def resolve_scapy_iface(local_ip):
    for iface_name, iface in scapy.conf.ifaces.items():
        if hasattr(iface, 'ip') and iface.ip == local_ip:
            return iface
    for iface_name, iface in scapy.conf.ifaces.items():
        try:
            if local_ip in str(iface):
                return iface
        except Exception:
            continue
    return None

def scan(network_cidr, scapy_iface):
    print(f"\n[*] Scanning {network_cidr} ...\n")
    arp_request = scapy.ARP(pdst=network_cidr)
    broadcast   = scapy.Ether(dst="ff:ff:ff:ff:ff:ff")
    packet      = broadcast / arp_request

    if scapy_iface:
        answered, _ = scapy.srp(packet, timeout=3, verbose=False, iface=scapy_iface)
    else:
        answered, _ = scapy.srp(packet, timeout=3, verbose=False)

    devices = []
    for sent, received in answered:
        devices.append({
            "ip":  received.psrc,
            "mac": received.hwsrc,
        })
    return devices

def get_hostname(ip):
    try:
        return socket.getfqdn(ip)
    except Exception:
        return "Unknown"

def get_vendor(mac):
    """Look up MAC vendor using the free macvendors.com API."""
    try:
        url = f"https://api.macvendors.com/{mac}"
        req = urllib.request.Request(url, headers={"User-Agent": "network-scanner/1.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.read().decode().strip()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return "Unknown vendor"
        return "Lookup failed"
    except Exception:
        return "Lookup failed"

def guess_device_type(vendor, hostname):
    """Guess device category from vendor name and hostname keywords."""
    vendor_l   = vendor.lower()
    hostname_l = hostname.lower()

    categories = {
        "Router / Gateway":  ["router", "gateway", "cisco", "netgear", "tp-link", "tplink",
                               "asus", "linksys", "dlink", "d-link", "ubiquiti", "mikrotik",
                               "huawei", "zyxel", "fritz", "openwrt"],
        "Phone":             ["apple", "samsung", "xiaomi", "oppo", "vivo", "oneplus",
                               "huawei", "motorola", "nokia", "iphone", "android", "phone",
                               "mobile", "realme", "infinix", "tecno"],
        "Laptop / PC":       ["intel", "dell", "hp", "lenovo", "acer", "asus", "msi",
                               "gigabyte", "microsoft", "laptop", "desktop", "pc", "computer",
                               "workstation"],
        "Smart TV / Media":  ["samsung", "lg", "sony", "tcl", "hisense", "vizio", "roku",
                               "firetv", "chromecast", "appletv", "tv", "television", "media"],
        "Game Console":      ["nintendo", "playstation", "xbox", "valve", "console", "switch"],
        "Smart Home / IoT":  ["espressif", "tuya", "shelly", "sonoff", "philips", "hue",
                               "nest", "ring", "amazon", "echo", "alexa", "iot", "smart",
                               "camera", "thermostat", "sensor"],
        "Printer":           ["hp", "canon", "epson", "brother", "xerox", "ricoh", "printer"],
        "Network Switch":    ["switch", "catalyst", "aruba", "juniper", "extreme"],
    }

    combined = vendor_l + " " + hostname_l
    for category, keywords in categories.items():
        if any(k in combined for k in keywords):
            return category

    return "Other device"

def enrich_devices(devices):
    print(f"[*] Enriching {len(devices)} device(s) with vendor & type info...\n")
    enriched = []
    for i, d in enumerate(devices):
        hostname = get_hostname(d["ip"])
        vendor   = get_vendor(d["mac"])
        dtype    = guess_device_type(vendor, hostname)
        enriched.append({**d, "hostname": hostname, "vendor": vendor, "type": dtype})
        # Respect the free API rate limit (1 req/sec)
        if i < len(devices) - 1:
            time.sleep(1)
    return enriched

def display(devices):
    if not devices:
        print("No devices found.")
        return

    col_ip   = max(15, max(len(d["ip"])       for d in devices) + 2)
    col_mac  = max(19, max(len(d["mac"])       for d in devices) + 2)
    col_vend = max(20, max(len(d["vendor"])    for d in devices) + 2)
    col_type = max(18, max(len(d["type"])      for d in devices) + 2)
    col_host = max(20, max(len(d["hostname"])  for d in devices) + 2)

    header = (f"{'IP Address':<{col_ip}} {'MAC Address':<{col_mac}} "
              f"{'Vendor':<{col_vend}} {'Device Type':<{col_type}} {'Hostname':<{col_host}}")
    print(header)
    print("-" * len(header))

    for d in sorted(devices, key=lambda x: ipaddress.IPv4Address(x["ip"])):
        print(f"{d['ip']:<{col_ip}} {d['mac']:<{col_mac}} "
              f"{d['vendor']:<{col_vend}} {d['type']:<{col_type}} {d['hostname']:<{col_host}}")

    print(f"\n[+] {len(devices)} device(s) found.")

if __name__ == "__main__":
    network, iface_name, local_ip = get_network_and_iface()
    print(f"[*] Detected interface : {iface_name}")
    print(f"[*] Local IP           : {local_ip}")
    print(f"[*] Network range      : {network}")

    scapy_iface = resolve_scapy_iface(local_ip)
    if scapy_iface:
        print(f"[*] Scapy interface    : {scapy_iface.name}")
    else:
        print("[!] Could not resolve Scapy interface — will use default.")

    devices  = scan(network, scapy_iface)
    enriched = enrich_devices(devices)
    display(enriched)