"""
================================================================================
  BGMI & FREE FIRE MILITARY GUN STORE - FAMGATEWAY PAYMENT INTEGRATION
  Backend Framework: Python (Flask)
  Frontend: Dark-Themed Military UI (Tailwind CSS + Custom Glassmorphism + AJAX)
  Payment Gateway: FamGateway (https://famgateway.in)
================================================================================

HOW TO RUN:
1. Set your FamGateway API Key in your environment:
   export FAMGATEWAY_API_KEY="your_famgateway_api_key"    # Linux / macOS
   set FAMGATEWAY_API_KEY="your_famgateway_api_key"       # Windows CMD
   $env:FAMGATEWAY_API_KEY="your_famgateway_api_key"      # Windows PowerShell

2. Install dependencies:
   pip install flask requests

3. Run the application:
   python famgateway_bgmi_store.py

4. Open in your browser:
   http://127.0.0.1:5000
"""

import os
import uuid
import time
import requests
from flask import Flask, request, jsonify, render_template_string, redirect

app = Flask(__name__)
app.secret_key = os.urandom(24)

# ------------------------------------------------------------------------------
# 1. SECURE API KEY CONFIGURATION (Loaded from Environment)
# ------------------------------------------------------------------------------
FAMGATEWAY_API_KEY = os.getenv('FAMGATEWAY_API_KEY', '')
FAMGATEWAY_BASE_URL = os.getenv('FAMGATEWAY_BASE_URL', 'https://famgateway.in')

# ------------------------------------------------------------------------------
# 2. MILITARY GUNS & SKINS CATALOG WITH ACTUAL IMAGES & GAMING PROPERTIES
# ------------------------------------------------------------------------------
BGMI_CATALOG = {
    "m416_glacier": {
        "id": "m416_glacier",
        "name": "M416 Glacier (Level 7 Max)",
        "category": "Mythic Assault Rifle",
        "price": 499,
        "original_price": 1999,
        "badge": "❄️ GLACIER MYTHIC",
        "rarity": "mythic",
        "image": "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=700&auto=format&fit=crop&q=80",
        "desc": "Iconic cryo-ice assault rifle with animated frost kill broadcast, iced loot crate, and zero recoil.",
        "damage": 68,
        "rate_of_fire": 92,
        "accuracy": 95,
        "range": 88,
        "redeem_code": "BGMI-GLACIER-MAX-78291"
    },
    "akm_hellfire": {
        "id": "akm_hellfire",
        "name": "AKM Hellfire Dragon",
        "category": "Heavy 7.62mm Rifle",
        "price": 349,
        "original_price": 1499,
        "badge": "🔥 DRAGON SLAYER",
        "rarity": "mythic",
        "image": "https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=700&auto=format&fit=crop&q=80",
        "desc": "Molten lava chassis with dragon roar audio broadcast and massive 7.62mm armor-piercing damage.",
        "damage": 84,
        "rate_of_fire": 75,
        "accuracy": 82,
        "range": 78,
        "redeem_code": "BGMI-HELLFIRE-AKM-99120"
    },
    "awm_godzilla": {
        "id": "awm_godzilla",
        "name": "AWM Godzilla Roar (Max)",
        "category": "1-Shot Lethal Sniper",
        "price": 599,
        "original_price": 2499,
        "badge": "⚡ GODZILLA LETHAL",
        "rarity": "mythic",
        "image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=80",
        "desc": "Atomic breath particle sniper barrel with 8x military optic scope and guaranteed 1-shot kill.",
        "damage": 100,
        "rate_of_fire": 35,
        "accuracy": 99,
        "range": 100,
        "redeem_code": "BGMI-AWM-GODZILLA-44189"
    },
    "m416_fool": {
        "id": "m416_fool",
        "name": "M416 The Fool (Mythic)",
        "category": "Upgradable Assault Rifle",
        "price": 449,
        "original_price": 1799,
        "badge": "🃏 JOKER EDITION",
        "rarity": "legendary",
        "image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&auto=format&fit=crop&q=80",
        "desc": "Animated joker puppet surprise death crate, purple aura barrel, and ultra fast cycling rate.",
        "damage": 64,
        "rate_of_fire": 90,
        "accuracy": 92,
        "range": 85,
        "redeem_code": "BGMI-FOOL-M416-66382"
    },
    "vector_cyber": {
        "id": "vector_cyber",
        "name": "Vector Golden Cyber Neon",
        "category": "Ultra Rapid SMG",
        "price": 199,
        "original_price": 799,
        "badge": "⚡ HYPER VELOCITY",
        "rarity": "epic",
        "image": "https://images.unsplash.com/photo-1563089145-599997674d42?w=700&auto=format&fit=crop&q=80",
        "desc": "Ultra high 1200 RPM cycling rate with extended 45-round drum mag and neon gold electro plating.",
        "damage": 55,
        "rate_of_fire": 98,
        "accuracy": 88,
        "range": 60,
        "redeem_code": "BGMI-VECTOR-CYBER-33109"
    },
    "kar98k_kukulcan": {
        "id": "kar98k_kukulcan",
        "name": "Kar98k Kukulcan Fury",
        "category": "Vintage Heavy Sniper",
        "price": 299,
        "original_price": 1199,
        "badge": "🦅 AZTEC MYTHIC",
        "rarity": "legendary",
        "image": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=700&auto=format&fit=crop&q=80",
        "desc": "Feathered Aztec snake spirit engraving with 6x zoom sniper scope and 1-shot level 2 helmet penetrator.",
        "damage": 92,
        "rate_of_fire": 40,
        "accuracy": 96,
        "range": 95,
        "redeem_code": "BGMI-KAR98-KUKUL-77215"
    }
}

# IN-MEMORY ORDERS STORE
ORDERS_DB = {}

# ------------------------------------------------------------------------------
# 3. BACKEND PAYMENT CREATION ROUTE (/create-payment & /pay)
# ------------------------------------------------------------------------------
@app.route('/create-payment', methods=['POST'])
@app.route('/pay', methods=['POST'])
def create_payment():
    """
    Receives gun_id, amount, and player details from frontend.
    Generates dynamic UPI intent & QR code and registers order with FamGateway.
    """
    try:
        data = request.get_json() or {}
        gun_id = data.get('gun_id')
        player_bgmi_id = str(data.get('bgmi_id', 'BGMI_COMMANDER')).strip()
        customer_mobile = str(data.get('mobile', '9999999999')).strip()
        frontend_amount = data.get('amount')

        if not gun_id or gun_id not in BGMI_CATALOG:
            return jsonify({
                "success": False,
                "error": "Invalid gun selected. Please choose a valid weapon from the armory."
            }), 400

        item = BGMI_CATALOG[gun_id]
        amount = float(frontend_amount) if frontend_amount else float(item['price'])
        order_id = f"FAM_{int(time.time())}_{uuid.uuid4().hex[:6].upper()}"

        host_url = request.host_url.rstrip('/')
        redirect_url = f"{host_url}/verify?order_id={order_id}"

        # Standard UPI Intent formatted for FamPay / FamGateway
        fampay_upi_vpa = os.getenv('FAMPAY_UPI_VPA', 'famgateway@upi')
        upi_intent = f"upi://pay?pa={fampay_upi_vpa}&pn=FamPayMerchant&am={amount:.2f}&tr={order_id}&cu=INR&tn=Gun_{gun_id}"
        dynamic_qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data={requests.utils.quote(upi_intent)}"

        # Register order in DB
        ORDERS_DB[order_id] = {
            "order_id": order_id,
            "gun_id": gun_id,
            "gun_name": item['name'],
            "amount": amount,
            "player_bgmi_id": player_bgmi_id,
            "customer_mobile": customer_mobile,
            "status": "PENDING",
            "redeem_code": item['redeem_code'],
            "upi_intent": upi_intent,
            "qr_url": dynamic_qr_url,
            "created_at": time.time()
        }

        # Check API Key for Live FamGateway Registration
        if FAMGATEWAY_API_KEY and FAMGATEWAY_API_KEY != 'MY_FAMGATEWAY_API_KEY':
            try:
                famgateway_endpoint = f"{FAMGATEWAY_BASE_URL.rstrip('/')}/api/create-order"
                params = {
                    "api_key": FAMGATEWAY_API_KEY,
                    "order_id": order_id,
                    "amount": str(amount),
                    "redirect_url": redirect_url,
                    "customer_mobile": customer_mobile,
                    "purpose": f"Gun: {item['name']}"
                }
                resp = requests.get(famgateway_endpoint, params=params, timeout=8)
                if resp.status_code == 200:
                    resp_data = resp.json()
                    live_qr = resp_data.get('qr_url') or resp_data.get('data', {}).get('qr_url')
                    if live_qr:
                        dynamic_qr_url = live_qr
                        ORDERS_DB[order_id]['qr_url'] = live_qr
            except Exception as ex:
                print(f"FamGateway live connection notice: {ex}")

        return jsonify({
            "success": True,
            "order_id": order_id,
            "amount": amount,
            "gun_name": item['name'],
            "upi_intent": upi_intent,
            "qr_url": dynamic_qr_url,
            "status": "PENDING"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500


# ------------------------------------------------------------------------------
# 4. PAYMENT STATUS & VERIFICATION ROUTE (/verify & /payment-status)
# ------------------------------------------------------------------------------
@app.route('/verify', methods=['GET', 'POST'])
@app.route('/payment-status', methods=['GET', 'POST'])
def verify_payment():
    """
    Checks whether payment has reached the user's FamPay merchant account via FamGateway API.
    Returns JSON for AJAX polling or renders HTML if opened directly in browser.
    """
    order_id = request.args.get('order_id') or (request.get_json() or {}).get('order_id') or ''
    order_info = ORDERS_DB.get(order_id)

    if not order_info:
        if request.headers.get('Accept') == 'application/json' or request.is_json:
            return jsonify({"success": False, "status": "NOT_FOUND", "error": "Order ID not found."}), 404
        return render_template_string(STATUS_PAGE_HTML, order={"order_id": order_id, "status": "NOT_FOUND", "gun_name": "Unknown", "amount": 0, "redeem_code": None})

    # If pending and FamGateway live API key is available, verify with FamGateway backend
    if order_info['status'] == 'PENDING' and FAMGATEWAY_API_KEY and FAMGATEWAY_API_KEY != 'MY_FAMGATEWAY_API_KEY':
        try:
            check_endpoint = f"{FAMGATEWAY_BASE_URL.rstrip('/')}/api/check-status"
            params = {"api_key": FAMGATEWAY_API_KEY, "order_id": order_id}
            resp = requests.get(check_endpoint, params=params, timeout=6)
            if resp.status_code == 200:
                res_data = resp.json()
                status_val = str(res_data.get('status') or res_data.get('data', {}).get('status', '')).upper()
                if status_val in ['SUCCESS', 'PAID', 'COMPLETED']:
                    order_info['status'] = 'PAID'
                elif status_val in ['FAILED', 'EXPIRED']:
                    order_info['status'] = 'FAILED'
        except Exception as check_ex:
            print(f"FamGateway verification check error: {check_ex}")

    # Return JSON for AJAX polling from the screen
    if request.is_json or request.args.get('format') == 'json' or 'application/json' in request.headers.get('Accept', ''):
        return jsonify({
            "success": True,
            "order_id": order_id,
            "status": order_info['status'],
            "gun_id": order_info['gun_id'],
            "gun_name": order_info['gun_name'],
            "amount": order_info['amount'],
            "redeem_code": order_info.get('redeem_code') if order_info['status'] == 'PAID' else None
        })

    return render_template_string(STATUS_PAGE_HTML, order=order_info)


@app.route('/api/simulate-pay', methods=['POST'])
def simulate_pay():
    """Allows instant test verification on sandbox/development environments."""
    data = request.get_json() or {}
    order_id = data.get('order_id')
    if order_id in ORDERS_DB:
        ORDERS_DB[order_id]['status'] = 'PAID'
        return jsonify({"success": True, "status": "PAID", "redeem_code": ORDERS_DB[order_id]['redeem_code']})
    return jsonify({"success": False, "error": "Order not found"}), 404


# ------------------------------------------------------------------------------
# 5. DEMO FAMGATEWAY UPI SIMULATOR (Instant testing when API key is pending)
# ------------------------------------------------------------------------------
@app.route('/mock-famgateway-pay')
def mock_gateway():
    order_id = request.args.get('order_id', '')
    amount = request.args.get('amount', '0')
    return render_template_string(MOCK_GATEWAY_HTML, order_id=order_id, amount=amount)


@app.route('/mock-complete-pay', methods=['POST'])
def mock_complete():
    order_id = request.form.get('order_id')
    outcome = request.form.get('outcome', 'success')
    if order_id in ORDERS_DB:
        ORDERS_DB[order_id]['status'] = 'PAID' if outcome == 'success' else 'FAILED'
    return redirect(f"/payment-status?order_id={order_id}")


# ------------------------------------------------------------------------------
# 6. FRONTEND STORE ROUTE (/)
# ------------------------------------------------------------------------------
@app.route('/')
def index():
    return render_template_string(STORE_FRONT_HTML, catalog=BGMI_CATALOG)


# ==============================================================================
# HTML TEMPLATES (TAILWIND CSS + DARK MILITARY THEME + NEON ORANGE ACCENTS)
# ==============================================================================
STORE_FRONT_HTML = """
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BGMI / Free Fire Military Gun Shop | FamGateway</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        teko: ['Teko', 'sans-serif'],
                        inter: ['Inter', 'sans-serif']
                    },
                    colors: {
                        military: {
                            900: '#0a0f1d',
                            800: '#111827',
                            700: '#1f293d',
                            600: '#334155'
                        },
                        neonOrange: '#ff7a00',
                        neonAmber: '#f59e0b'
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: radial-gradient(circle at top center, #1e293b 0%, #0a0f1d 70%, #030712 100%);
            min-height: 100vh;
        }
        .neon-orange-btn {
            background: linear-gradient(135deg, #ff7a00 0%, #ff4500 100%);
            box-shadow: 0 0 25px rgba(255, 122, 0, 0.55), inset 0 0 10px rgba(255, 230, 0, 0.4);
            border: 2px solid #ffea79;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .neon-orange-btn:hover {
            background: linear-gradient(135deg, #ff9431 0%, #ff5722 100%);
            box-shadow: 0 0 35px rgba(255, 122, 0, 0.85), inset 0 0 14px #ffffff;
            transform: translateY(-2px) scale(1.02);
        }
        .neon-orange-btn:active {
            transform: scale(0.97);
        }
        .glow-card-mythic {
            border: 2px solid #ef4444;
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.25);
        }
        .glow-card-legendary {
            border: 2px solid #f59e0b;
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.25);
        }
        .glow-card-epic {
            border: 2px solid #a855f7;
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.2);
        }
    </style>
</head>
<body class="text-slate-100 p-4 md:p-8">

    <div class="max-w-7xl mx-auto">
        <!-- Header Banner -->
        <header class="text-center mb-10 pt-4">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500 text-orange-400 font-bold text-xs uppercase tracking-widest mb-3">
                <span>🔥 OFFICIAL MILITARY ARMORY</span>
                <span>•</span>
                <span>FAMGATEWAY VERIFIED</span>
            </div>
            <h1 class="font-teko text-5xl md:text-7xl font-extrabold tracking-wider uppercase text-white drop-shadow-[0_0_35px_rgba(255,122,0,0.4)]">
                BGMI & FREE FIRE GUN SHOP
            </h1>
            <p class="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
                Select your upgraded mythic weapon. Instant automated character delivery via FamGateway UPI & QR checkout.
            </p>
        </header>

        <!-- Player Character ID & Mobile Details Bar -->
        <div class="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 mb-10 backdrop-blur-md shadow-2xl flex flex-wrap gap-6 items-center justify-between">
            <div class="flex-1 min-w-[260px]">
                <label for="bgmiId" class="block text-xs font-extrabold text-orange-400 uppercase tracking-wider mb-2">
                    🎮 BGMI / Free Fire Character ID:
                </label>
                <input type="text" id="bgmiId" value="5192847291" placeholder="e.g. 5192847291"
                       class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-orange-500 focus:outline-none transition">
            </div>

            <div class="flex-1 min-w-[260px]">
                <label for="mobileNo" class="block text-xs font-extrabold text-orange-400 uppercase tracking-wider mb-2">
                    📱 UPI Mobile Number (For Receipt):
                </label>
                <input type="tel" id="mobileNo" value="9876543210" placeholder="e.g. 9876543210"
                       class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-orange-500 focus:outline-none transition">
            </div>
        </div>

        <!-- Gun Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {% for gun_id, item in catalog.items() %}
            <div class="bg-slate-900/90 rounded-2xl overflow-hidden flex flex-col justify-between backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 {% if item.rarity == 'mythic' %}glow-card-mythic{% elif item.rarity == 'legendary' %}glow-card-legendary{% else %}glow-card-epic{% endif %}"
                 data-gun-id="{{ gun_id }}"
                 data-gun-price="{{ item.price }}"
                 data-gun-name="{{ item.name }}">
                
                <!-- Weapon Image Placeholder with Actual Tag -->
                <div class="relative h-56 bg-slate-950 overflow-hidden group">
                    <img src="{{ item.image }}" alt="{{ item.name }}" 
                         class="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    <!-- Rarity Badge -->
                    <div class="absolute top-3 left-3 bg-black/80 border border-amber-400 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shadow-lg">
                        {{ item.badge }}
                    </div>

                    <!-- Category Tag -->
                    <div class="absolute top-3 right-3 bg-slate-800/90 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
                        {{ item.category }}
                    </div>
                </div>

                <!-- Card Content -->
                <div class="p-6 flex flex-col flex-1">
                    <!-- Gun Name -->
                    <h2 class="font-teko text-3xl font-extrabold text-white leading-none tracking-wide mb-2">
                        {{ item.name }}
                    </h2>
                    <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-5">
                        {{ item.desc }}
                    </p>

                    <!-- Gaming Properties Progress Bars -->
                    <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
                        <!-- Damage Bar -->
                        <div>
                            <div class="flex justify-between text-xs font-bold mb-1">
                                <span class="text-slate-400">DAMAGE</span>
                                <span class="text-red-400">{{ item.damage }} / 100</span>
                            </div>
                            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style="width: {{ item.damage }}%;"></div>
                            </div>
                        </div>

                        <!-- Rate of Fire Bar -->
                        <div>
                            <div class="flex justify-between text-xs font-bold mb-1">
                                <span class="text-slate-400">RATE OF FIRE</span>
                                <span class="text-sky-400">{{ item.rate_of_fire }} / 100</span>
                            </div>
                            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full" style="width: {{ item.rate_of_fire }}%;"></div>
                            </div>
                        </div>

                        <!-- Accuracy Bar -->
                        <div>
                            <div class="flex justify-between text-xs font-bold mb-1">
                                <span class="text-slate-400">ACCURACY</span>
                                <span class="text-emerald-400">{{ item.accuracy }}%</span>
                            </div>
                            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style="width: {{ item.accuracy }}%;"></div>
                            </div>
                        </div>

                        <!-- Range Bar -->
                        <div>
                            <div class="flex justify-between text-xs font-bold mb-1">
                                <span class="text-slate-400">RANGE</span>
                                <span class="text-purple-400">{{ item.range }}m</span>
                            </div>
                            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style="width: {{ item.range }}%;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Price & Neon Orange Buy Button -->
                    <div class="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                        <div>
                            <div class="font-teko text-4xl font-extrabold text-amber-300 leading-none">
                                ₹{{ item.price }}
                            </div>
                            <div class="text-xs text-slate-500 line-through font-semibold">
                                MRP: ₹{{ item.original_price }}
                            </div>
                        </div>

                        <button onclick="handleBuyClick(this)"
                                class="neon-orange-btn px-6 py-3 rounded-xl font-teko text-2xl font-extrabold text-slate-950 uppercase tracking-wide flex items-center gap-2 cursor-pointer">
                            <span>⚡</span> BUY NOW
                        </button>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>

    <!-- On-Screen FamPay / FamGateway Dynamic QR Payment Modal -->
    <div id="qrModal" class="fixed inset-0 bg-slate-950/90 backdrop-blur-md hidden items-center justify-center z-50 p-4">
        <div class="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-orange-500 rounded-3xl max-w-md w-full p-6 text-center shadow-[0_0_60px_rgba(255,122,0,0.4)] relative">
            <button onclick="closeQrModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">✕</button>

            <!-- FamPay Header Badge -->
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/50 text-orange-400 font-extrabold text-xs tracking-wider mb-2">
                <span>⚡ FAMPAY DYNAMIC UPI QR</span>
            </div>

            <h3 id="modalGunName" class="font-teko text-3xl font-extrabold text-white leading-none mb-1">M416 Glacier</h3>
            <div class="text-xs text-slate-400 mb-3">Scan with any UPI App • Instant Weapon Unlock</div>

            <!-- Price Tag -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 mb-4 flex justify-between items-center px-4">
                <span class="text-xs text-slate-400 font-bold">TOTAL PAYABLE:</span>
                <span id="modalGunPrice" class="font-teko text-3xl font-extrabold text-amber-300">₹499</span>
            </div>

            <!-- FamPay Styled QR Container with Centered Logo -->
            <div class="relative w-56 h-56 mx-auto bg-slate-950 border-2 border-orange-500 rounded-2xl p-3 shadow-[0_0_30px_rgba(255,122,0,0.3)] mb-3 flex items-center justify-center">
                <img id="dynamicQrImg" src="" alt="FamPay QR Code" class="w-full h-full object-contain rounded-xl bg-white p-1">
                <!-- FamPay Center Emblem -->
                <div class="absolute inset-0 m-auto w-10 h-10 bg-[#25190b] border-2 border-[#ff7a00] rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#f59e0b">
                        <path d="M21 7.28a10.94 10.94 0 0 0-4.08-3.08 11.23 11.23 0 0 0-5.11-.97c-1.8.1-3.53.7-5.03 1.74A11.08 11.08 0 0 0 3 9.4c1.86-.34 3.76-.23 5.56.32a10.84 10.84 0 0 1 5.92 5.08c.55 1 .9 2.08 1.05 3.2 1.9-1.2 3.4-2.9 4.3-4.9.9-2 1.3-4.2 1.17-6.4v.58zm-7.6 5.82a13.3 13.3 0 0 0-4.38-3.76 13.2 13.2 0 0 0-5.63-1.42c.86 1.42 2.06 2.61 3.5 3.46 1.44.85 3.06 1.35 4.73 1.46.59.04 1.18.06 1.78.26z" fill="#ff7a00"/>
                    </svg>
                </div>
            </div>

            <div class="text-[11px] text-slate-400 font-semibold mb-3">
                Supports <span class="text-orange-400 font-bold">FamPay</span>, GPay, PhonePe, Paytm, BHIM & CRED
            </div>

            <!-- Direct UPI App Links for Mobile Users -->
            <div class="flex justify-center gap-2 mb-3 flex-wrap">
                <a id="intentGPay" href="#" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-slate-200">🟢 GPay</a>
                <a id="intentPhonePe" href="#" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-slate-200">🟣 PhonePe</a>
                <a id="intentPaytm" href="#" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-slate-200">🔵 Paytm</a>
                <a id="intentFamPay" href="#" class="px-2.5 py-1.5 bg-orange-950/80 hover:bg-orange-900 border border-orange-500 rounded-lg text-xs font-bold text-orange-300">⚡ FamPay</a>
            </div>

            <!-- Live Verification Status Bar (Polling /verify) -->
            <div class="bg-slate-950/90 border border-orange-500/40 rounded-xl p-3 mb-3 flex items-center justify-between text-left">
                <div class="flex items-center gap-2.5">
                    <div class="w-3 h-3 bg-orange-400 rounded-full animate-ping"></div>
                    <div>
                        <div id="verifyStatusText" class="text-xs font-extrabold text-orange-300">Waiting for payment...</div>
                        <div class="text-[10px] text-slate-500">Checking FamPay account every 2s via /verify</div>
                    </div>
                </div>
                <span id="pollCounter" class="text-xs font-mono text-slate-400 font-bold">0s</span>
            </div>

            <!-- Manual Verify / Simulate Buttons -->
            <div class="space-y-2">
                <button onclick="checkVerifyNow()" class="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-teko text-xl font-extrabold rounded-xl uppercase tracking-wider">
                    🔄 CHECK STATUS NOW (/verify)
                </button>
                <button onclick="simulateTestPayment()" class="w-full py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-lg transition">
                    🧪 Instant Sandbox Test Verify
                </button>
            </div>
        </div>
    </div>

    <!-- JavaScript Click Action & FamGateway /verify Live Polling -->
    <script>
        let currentOrderId = null;
        let pollInterval = null;
        let pollTimerSeconds = 0;

        function closeQrModal() {
            if (pollInterval) clearInterval(pollInterval);
            document.getElementById('qrModal').style.display = 'none';
        }

        async function handleBuyClick(btn) {
            const card = btn.closest('[data-gun-id]');
            if (!card) return;

            const gunId = card.dataset.gunId;
            const amount = parseFloat(card.dataset.gunPrice);
            const gunName = card.dataset.gunName;

            const bgmiId = document.getElementById('bgmiId').value.trim();
            const mobile = document.getElementById('mobileNo').value.trim();

            if (!bgmiId) {
                alert('Please enter your BGMI / Free Fire Character ID first!');
                document.getElementById('bgmiId').focus();
                return;
            }

            btn.disabled = true;

            try {
                // Call /create-payment to get dynamic QR code and Order ID
                const response = await fetch('/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gun_id: gunId,
                        amount: amount,
                        bgmi_id: bgmiId,
                        mobile: mobile
                    })
                });

                const data = await response.json();
                btn.disabled = false;

                if (response.ok && data.success) {
                    currentOrderId = data.order_id;
                    
                    // Update Modal Data
                    document.getElementById('modalGunName').innerText = gunName;
                    document.getElementById('modalGunPrice').innerText = '₹' + amount;
                    document.getElementById('dynamicQrImg').src = data.qr_url;

                    // Set Intent links for mobile UPI
                    const upiIntent = data.upi_intent;
                    if (upiIntent) {
                        document.getElementById('intentGPay').href = upiIntent;
                        document.getElementById('intentPhonePe').href = upiIntent;
                        document.getElementById('intentPaytm').href = upiIntent;
                        document.getElementById('intentFamPay').href = upiIntent;
                    }

                    // Open QR Modal directly on screen
                    document.getElementById('qrModal').style.display = 'flex';

                    // Start automatic backend /verify polling loop every 2 seconds
                    startVerifyPolling();
                } else {
                    alert('Error: ' + (data.error || 'Failed to generate dynamic FamPay QR code.'));
                }
            } catch (err) {
                btn.disabled = false;
                alert('Network Error: Unable to reach backend server.');
            }
        }

        function startVerifyPolling() {
            if (pollInterval) clearInterval(pollInterval);
            pollTimerSeconds = 0;
            const statusEl = document.getElementById('verifyStatusText');
            const timerEl = document.getElementById('pollCounter');
            if (statusEl) statusEl.innerText = 'Waiting for payment...';

            pollInterval = setInterval(async () => {
                pollTimerSeconds += 2;
                if (timerEl) timerEl.innerText = pollTimerSeconds + 's';

                if (!currentOrderId) return;

                try {
                    // Poll backend /verify endpoint to check FamPay account
                    const res = await fetch(`/verify?order_id=${currentOrderId}&format=json`, {
                        headers: { 'Accept': 'application/json' }
                    });
                    const result = await res.json();

                    if (result && result.status === 'PAID') {
                        clearInterval(pollInterval);
                        if (statusEl) statusEl.innerText = 'Payment Received in FamPay! ✅';
                        // Redirect to status page with redeem code
                        setTimeout(() => {
                            window.location.href = `/payment-status?order_id=${currentOrderId}`;
                        }, 800);
                    }
                } catch (e) {
                    console.log('Polling verify notice:', e);
                }
            }, 2000);
        }

        async function checkVerifyNow() {
            if (!currentOrderId) return;
            const statusEl = document.getElementById('verifyStatusText');
            if (statusEl) statusEl.innerText = 'Verifying with FamGateway...';

            try {
                const res = await fetch(`/verify?order_id=${currentOrderId}&format=json`, {
                    headers: { 'Accept': 'application/json' }
                });
                const result = await res.json();
                if (result && result.status === 'PAID') {
                    if (pollInterval) clearInterval(pollInterval);
                    window.location.href = `/payment-status?order_id=${currentOrderId}`;
                } else {
                    if (statusEl) statusEl.innerText = 'Status: ' + (result.status || 'PENDING');
                }
            } catch (e) {
                if (statusEl) statusEl.innerText = 'Verification check failed.';
            }
        }

        async function simulateTestPayment() {
            if (!currentOrderId) return;
            try {
                await fetch('/api/simulate-pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_id: currentOrderId })
                });
                checkVerifyNow();
            } catch (e) {
                alert('Simulator notice: ' + e);
            }
        }
    </script>
</body>
</html>
"""

STATUS_PAGE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Status | FamGateway</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Teko:wght@600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-950 text-slate-100 flex items-center justify-center min-height-screen p-4 min-h-screen">
    <div class="bg-slate-900 border-2 {% if order.status == 'PAID' %}border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]{% else %}border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]{% endif %} rounded-3xl max-w-lg w-full p-8 text-center">
        {% if order.status == 'PAID' %}
            <div class="text-6xl mb-3">✅</div>
            <h1 class="font-['Teko'] text-5xl font-extrabold text-emerald-400 leading-none mb-2">PAYMENT SUCCESSFUL!</h1>
            <p class="text-slate-400 text-sm mb-6">Payment verified via FamGateway. Weapon successfully unlocked.</p>
            
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left mb-6 space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-slate-400">Order ID:</span> <span class="font-bold font-mono">{{ order.order_id }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Weapon:</span> <span class="font-bold text-amber-300">{{ order.gun_name }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Amount Paid:</span> <span class="font-bold text-white">₹{{ order.amount }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Character ID:</span> <span class="font-bold text-sky-400">{{ order.player_bgmi_id }}</span></div>
                
                <div class="pt-4 border-t border-slate-800">
                    <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">🎁 BGMI REDEEM CODE:</div>
                    <div class="bg-emerald-950/80 border border-emerald-500 text-emerald-200 font-mono font-extrabold text-lg py-2 px-3 rounded-xl text-center select-all tracking-wider">
                        {{ order.redeem_code }}
                    </div>
                </div>
            </div>
        {% else %}
            <div class="text-6xl mb-3">❌</div>
            <h1 class="font-['Teko'] text-5xl font-extrabold text-red-400 leading-none mb-2">PAYMENT INCOMPLETE</h1>
            <p class="text-slate-400 text-sm mb-6">The transaction was cancelled or is awaiting UPI authorization.</p>
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left mb-6 space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-slate-400">Order ID:</span> <span class="font-bold font-mono">{{ order.order_id }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Status:</span> <span class="font-bold text-red-400">{{ order.status }}</span></div>
            </div>
        {% endif %}
        
        <a href="/" class="inline-block w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-['Teko'] text-2xl font-extrabold text-slate-950 uppercase tracking-wider hover:opacity-90 transition">
            ➔ RETURN TO GUN SHOP
        </a>
    </div>
</body>
</html>
"""

MOCK_GATEWAY_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FamGateway UPI Checkout Simulator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Teko:wght@700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
    <div class="bg-slate-900 border-2 border-sky-500 rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_0_50px_rgba(56,189,248,0.3)]">
        <div class="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">⚡ FAMGATEWAY INSTANT UPI</div>
        <h2 class="font-['Teko'] text-4xl font-extrabold text-white mb-1">PAY ₹{{ amount }}</h2>
        <p class="text-xs text-slate-400 mb-4">Order ID: {{ order_id }}</p>

        <div class="bg-white p-3 rounded-2xl w-44 h-44 mx-auto mb-4 flex items-center justify-center">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=famgateway@upi&pn=FamGateway&am={{ amount }}&cu=INR" alt="UPI QR" class="w-full h-full">
        </div>

        <p class="text-xs text-slate-400 mb-5">Scan with GPay, PhonePe, Paytm, BHIM, or FamPay</p>

        <form action="/mock-complete-pay" method="POST" class="space-y-2">
            <input type="hidden" name="order_id" value="{{ order_id }}">
            <input type="hidden" name="outcome" value="success">
            <button type="submit" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition">
                ✅ SIMULATE SUCCESSFUL PAYMENT
            </button>
        </form>

        <form action="/mock-complete-pay" method="POST" class="mt-2">
            <input type="hidden" name="order_id" value="{{ order_id }}">
            <input type="hidden" name="outcome" value="failed">
            <button type="submit" class="w-full py-2 bg-red-950 hover:bg-red-900 text-red-400 font-bold rounded-xl text-xs transition">
                ❌ CANCEL / FAIL
            </button>
        </form>
    </div>
</body>
</html>
"""

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 FamGateway Military Gun Store running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
